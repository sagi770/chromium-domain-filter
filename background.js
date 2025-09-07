const CATCH_ALL_RULE_ID = 1;           // reserved id for redirect rule
const ALLOW_RULE_BASE_ID = 1000;       // ids >= 1000 are per‑domain allow rules

function normalizeDomain(input) {
  if (!input || typeof input !== 'string') return '';
  
  let domain = input.trim();
  
  // Try to parse as URL first (handles http://, https://, etc.)
  try {
    const url = new URL(domain.startsWith('http') ? domain : `https://${domain}`);
    domain = url.hostname;
  } catch (e) {
    // If URL parsing fails, clean up manually
    domain = domain
      .replace(/^https?:\/\//, '')  // Remove protocol
      .replace(/\/.*$/, '')         // Remove path
      .replace(/:\d+$/, '');        // Remove port
  }
  
  // Remove www. prefix (optional but common)
  domain = domain.replace(/^www\./, '');
  
  return domain.toLowerCase();
}

function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  // Trim whitespace
  url = url.trim();
  
  // Check for empty string
  if (url === '') return false;
  
  // Try to create a URL object to validate format
  try {
    const urlObj = new URL(url);
    // Must be http or https protocol
    if (!urlObj.protocol.startsWith('http')) return false;
    // Must have a valid hostname
    if (!urlObj.hostname || urlObj.hostname === '') return false;
    return true;
  } catch (e) {
    return false;
  }
}

function buildAllowRuleForDomain(domain, idx) {
  return {
    id: ALLOW_RULE_BASE_ID + idx,
    priority: 1000,
    action: { type: "allow" },
    condition: {
      urlFilter: `||${domain}^`,
      resourceTypes: ["main_frame"]
    }
  };
}

function buildCatchAllRedirectRule(defaultUrl) {
  console.log('buildCatchAllRedirectRule called with:', defaultUrl, typeof defaultUrl);
  
  // Validate external URL before using it
  if (!isValidUrl(defaultUrl)) {
    console.log('Invalid URL detected, using default redirect URL');
    defaultUrl = "https://example.com";
  }
  
  // Use validated external URL for redirect
  const rule = {
    id: CATCH_ALL_RULE_ID,
    priority: 1,
    action: { type: "redirect", redirect: { url: defaultUrl } },
    condition: { regexFilter: "https?://.*", resourceTypes: ["main_frame"] }
  };
  console.log('Created external URL rule:', rule);
  return rule;
}

async function loadConfigFromJSON() {
  try {
    // Fetch the whitelist.json file from the extension directory
    const response = await fetch(chrome.runtime.getURL('whitelist.json'));
    if (!response.ok) {
      throw new Error(`Failed to load whitelist.json: ${response.status}`);
    }
    
    const config = await response.json();
    
    // Validate the configuration structure
    if (!config.allowlist || !Array.isArray(config.allowlist)) {
      throw new Error('Invalid configuration: allowlist must be an array');
    }
    
    return {
      allowlist: config.allowlist,
      defaultRedirectUrl: config.defaultRedirectUrl || "https://example.com",
      enabled: config.enabled !== false // Default to true if not specified
    };
  } catch (error) {
    console.error('Error loading whitelist configuration:', error);
    // Return fallback configuration
    return {
      allowlist: ["example.com"],
      defaultRedirectUrl: "https://example.com",
      enabled: true
    };
  }
}

async function syncRules() {
  const config = await loadConfigFromJSON();
  
  // If the extension is disabled, remove all rules
  if (!config.enabled) {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const idsToRemove = existing.map(r => r.id);
    
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: idsToRemove,
      addRules: []
    });
    
    console.log('Extension disabled via configuration');
    return;
  }
  
  const { allowlist, defaultRedirectUrl } = config;
  
  // Determine the final redirect URL with proper validation
  let finalRedirectUrl = defaultRedirectUrl;
  
  // Additional safety check - ensure we always have a string
  if (!finalRedirectUrl || typeof finalRedirectUrl !== 'string') {
    finalRedirectUrl = "https://example.com";
  }
  
  // If no URL provided or invalid, use reliable fallback
  if (!isValidUrl(finalRedirectUrl)) {
    finalRedirectUrl = "https://example.com";
  }
  
  // Final safety check - ensure the URL is exactly what we expect
  if (finalRedirectUrl !== "https://example.com" && !isValidUrl(finalRedirectUrl)) {
    finalRedirectUrl = "https://example.com";
  }

  const allowRules = allowlist
    .map((d) => d && normalizeDomain(d))
    .filter(Boolean)
    .map((d, i) => buildAllowRuleForDomain(d, i));

  const extraAllow = [];
  // Auto-allow the redirect URL's domain to prevent infinite redirects
  if (isValidUrl(finalRedirectUrl)) {
    try {
      const u = new URL(finalRedirectUrl);
      extraAllow.push(buildAllowRuleForDomain(u.hostname, allowRules.length + 1));
    } catch (_) {
      // If URL parsing fails somehow, just continue without extra allow
    }
  }

  // Debug logging to understand what's happening
  console.log('Creating redirect rule with URL:', finalRedirectUrl, 'isValid:', isValidUrl(finalRedirectUrl));
  
  const rulesToAdd = [
    ...allowRules,
    ...extraAllow,
    buildCatchAllRedirectRule(finalRedirectUrl),
  ];

  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const idsToRemove = existing
    .filter(r => r.id === CATCH_ALL_RULE_ID || r.id >= ALLOW_RULE_BASE_ID)
    .map(r => r.id);

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: idsToRemove,
      addRules: rulesToAdd
    });
  } catch (error) {
    // Log detailed error information for debugging
    console.error('Failed to update declarativeNetRequest rules:', {
      error: error.message,
      finalRedirectUrl,
      ruleCount: rulesToAdd.length,
      allowRuleCount: allowRules.length,
      hasValidRedirectUrl: isValidUrl(finalRedirectUrl)
    });
    
    // Rethrow the error so calling code can handle it
    throw new Error(`Rule update failed: ${error.message}`);
  }
}

chrome.runtime.onInstalled.addListener(syncRules);
chrome.runtime.onStartup.addListener(syncRules);

// Add command listener for manual reload via keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === "reload-config") {
    console.log('Reloading configuration from whitelist.json');
    syncRules().then(() => {
      console.log('Configuration reloaded successfully');
    }).catch(error => {
      console.error('Failed to reload configuration:', error);
    });
  }
});

// Periodically check for config changes (every 5 minutes)
setInterval(() => {
  console.log('Periodic configuration check');
  syncRules().catch(error => {
    console.error('Failed to sync rules during periodic check:', error);
  });
}, 5 * 60 * 1000); // 5 minutes
