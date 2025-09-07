# Chrome Allowlist Extension (JSON Config)

A Chrome extension that restricts browsing to only pre-approved domains defined in a JSON configuration file. All other websites are automatically redirected to a default page.

## Features

- 🔒 **Domain-based blocking**: Only allow access to specified domains
- 📝 **JSON configuration**: No UI needed - manage everything via `whitelist.json`
- 🔄 **Hot reload**: Update configuration without reinstalling (Cmd/Ctrl+Shift+R)
- 🌐 **Subdomain support**: Automatically includes all subdomains
- ⚡ **Performance**: Uses Chrome's Declarative Net Request API
- 🎯 **Custom redirects**: Configure where blocked sites redirect to
- 🔧 **Enable/disable toggle**: Temporarily disable without uninstalling

## Installation

1. **Clone or download** this repository
2. **Configure** your allowed domains in `whitelist.json`
3. **Open Chrome** and navigate to `chrome://extensions/`
4. **Enable Developer mode** (toggle in top right)
5. Click **"Load unpacked"** and select this extension folder
6. The extension is now active!

## Configuration

Edit `whitelist.json` to configure the extension:

```json
{
  "allowlist": [
    "example.com",
    "google.com",
    "github.com",
    "stackoverflow.com"
  ],
  "defaultRedirectUrl": "https://example.com/blocked",
  "enabled": true
}
```

### Configuration Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `allowlist` | Array | Yes | List of allowed domains (without protocol or www) |
| `defaultRedirectUrl` | String | No | Where to redirect blocked sites (default: `https://example.com`) |
| `enabled` | Boolean | No | Enable/disable the extension (default: `true`) |

### Domain Format Rules

- ✅ **Correct**: `google.com`, `github.com`
- ❌ **Wrong**: `https://google.com`, `www.github.com`, `google.com/path`
- 📌 **Note**: Subdomains are automatically included (e.g., `google.com` allows `mail.google.com`)

## Usage

### Updating the Allowlist

After editing `whitelist.json`, apply changes using one of these methods:

1. **Keyboard shortcut** (fastest): Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
2. **Automatic**: Wait 5 minutes (auto-refresh interval)
3. **Manual**: Reload the extension in `chrome://extensions/`

### Testing

After making changes to `whitelist.json`:
1. Reload the configuration using `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
2. Test by visiting both allowed and blocked domains
3. Check the service worker console for any errors

## Example Configurations

### Minimal Setup
```json
{
  "allowlist": ["google.com", "github.com"]
}
```

### Work Environment
```json
{
  "allowlist": [
    "company.com",
    "slack.com",
    "github.com",
    "stackoverflow.com",
    "google.com",
    "office365.com"
  ],
  "defaultRedirectUrl": "https://intranet.company.com/blocked"
}
```

### Educational Setting
```json
{
  "allowlist": [
    "school.edu",
    "wikipedia.org",
    "khanacademy.org",
    "google.com",
    "classroom.google.com"
  ],
  "defaultRedirectUrl": "https://school.edu/acceptable-use"
}
```

### Temporarily Disabled
```json
{
  "allowlist": ["example.com"],
  "enabled": false
}
```

## Troubleshooting

### Extension Not Blocking Sites

1. Verify `"enabled": true` in `whitelist.json`
2. Check JSON syntax using an online validator like https://jsonlint.com
3. Reload configuration: `Cmd+Shift+R`
4. Check service worker console for errors:
   - Go to `chrome://extensions/`
   - Click "service worker" link
   - Look for error messages

### Allowed Sites Being Blocked

- Ensure correct domain format (no `www.` or `https://`)
- Add authentication domains if needed (e.g., `accounts.google.com` for Google login)
- Check if site uses different domain for resources

### JSON Syntax Errors

The extension falls back to default configuration if JSON is invalid:
- Check console in service worker for specific errors
- Validate JSON at https://jsonlint.com
- Ensure proper comma placement and quote usage

## Project Structure

```
chrome-extension-allow-access-from-whitelist-only/
├── manifest.json           # Extension manifest (v3)
├── background.js           # Service worker handling blocking logic
├── whitelist.json         # Configuration file (edit this!)
├── README.md              # This file
├── .gitignore            # Git ignore rules
└── icons/                # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## How It Works

1. **Configuration Loading**: The extension reads `whitelist.json` on startup and when reloaded
2. **Rule Generation**: Creates Chrome declarativeNetRequest rules:
   - High-priority "allow" rules for each whitelisted domain
   - Low-priority "redirect" rule catching everything else
3. **Request Interception**: Chrome blocks/allows requests based on these rules
4. **Auto-refresh**: Checks for configuration changes every 5 minutes

## Security & Privacy

- ✅ No data collection or tracking
- ✅ No external dependencies
- ✅ All processing happens locally
- ✅ Uses Chrome's native APIs only
- ✅ Open source - audit the code yourself

## Development

### Prerequisites
- Chrome or Chromium browser
- Node.js (optional, for validation script)
- Text editor for JSON editing

### Making Changes
1. Edit `whitelist.json`
2. Validate JSON syntax at https://jsonlint.com (optional)
3. Reload extension with `Cmd+Shift+R`
4. Test your changes

### Debugging
- View logs: Chrome Extensions page → Service Worker → Console
- Check rules: Use Chrome's `chrome://extensions` developer tools
- Validate JSON: Use https://jsonlint.com or any JSON validator

## Version History

- **v2.0.0** - JSON-based configuration, removed UI, added hot reload
- **v1.0.0** - Initial version with options page UI

## License

This project is open source. Feel free to modify and distribute according to your needs.

## Contributing

Contributions are welcome! Please:
1. Test your changes thoroughly
2. Update documentation as needed
3. Follow the existing code style
4. Include descriptions of your changes

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the test checklist
3. Examine the service worker console for errors

---

**Note**: This extension is designed for administrative or parental control purposes. Users should be informed when browsing restrictions are in place.
