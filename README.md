# Prompt Enhancer - Chrome Extension

A powerful Chrome extension that enhances your prompts using DeepSeek R1 32B via OpenRouter. Transform your raw prompts into optimized, clear instructions for better AI interactions.

## Features

- 🚀 **AI-Powered Enhancement**: Uses DeepSeek R1 32B to rewrite prompts
- 🔒 **Secure Storage**: Encrypted API key storage with AES-GCM encryption
- 🎯 **Smart Detection**: Automatically detects text areas and rich-text editors
- 🌐 **Domain Whitelist**: Control which websites the extension is active on
- ⚡ **Real-time Validation**: Instant feedback on API keys and domain configurations
- 🎨 **Adaptive UI**: Floating buttons that match your page's theme
- 🌓 **Modern UI**: Compact, responsive, dark mode, sun/moon toggle, and improved color contrast
- 📱 **Responsive Design**: Works on both desktop and mobile browsers

## Installation

### Method 1: Load Unpacked Extension (Recommended for Development)

1. **Download the Extension**
   - Download and extract the extension files to a folder on your computer

2. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or go to Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked" button
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

5. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in the Chrome toolbar
   - Find "Prompt Enhancer" and click the pin icon to keep it visible

### Method 2: Install from Chrome Web Store (Future)

*This extension will be available on the Chrome Web Store soon.*

## Setup

### 1. Get Your OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up for an account or log in
3. Navigate to your API settings
4. Generate a new API key
5. Copy the API key (you'll need this for the extension)

### 2. Configure the Extension

1. **Open Extension Popup**
   - Click the Prompt Enhancer icon in your Chrome toolbar
   - Or right-click the icon and select "Options"

2. **Enter Your API Key**
   - Paste your OpenRouter API key in the "Product Key" field
   - The key will be encrypted and stored securely

3. **Set Active Sites**
   - Enter comma-separated domain names where you want the extension active
   - Examples: `example.com, docs.google.com, chat.openai.com`
   - Leave empty to disable the extension on all sites
   - Use `*.domain.com` for wildcard subdomains

4. **Save Settings**
   - Click "Save Settings" to store your configuration
   - Use "Test Connection" to verify your API key works

## Usage

### Basic Usage

1. **Navigate to a Whitelisted Site**
   - Go to any website you've added to your domain whitelist

2. **Find Text Areas**
   - The extension automatically detects text input fields
   - Look for the floating "Enhance Prompt" button near text areas

3. **Enhance Your Prompt**
   - Type your raw prompt in any text field
   - Click the "Enhance Prompt" button
   - Wait for the AI to process and replace your text with an enhanced version

### Supported Text Elements

The extension works with:
- Standard `<textarea>` elements
- Text input fields (`<input type="text">`)
- Content-editable divs
- Rich text editors (Quill, CodeMirror, Monaco)
- Elements with `role="textbox"`

### Example Enhancement

**Before:**
```
write a blog post about AI
```

**After:**
```
Write a comprehensive blog post about artificial intelligence that includes:

1. An engaging introduction explaining what AI is and why it matters
2. Current applications of AI in various industries (healthcare, finance, transportation, etc.)
3. Recent breakthroughs and developments in AI technology
4. Potential benefits and challenges of AI adoption
5. Future predictions and trends in AI development
6. A conclusion that summarizes key points and calls for responsible AI development

Target audience: General readers with basic technical knowledge
Tone: Informative yet accessible
Length: 1500-2000 words
Include relevant examples and statistics where appropriate.
```

## Troubleshooting

### Common Issues

**Extension Not Working on a Site**
- Check if the domain is in your whitelist
- Ensure the domain format is correct (no `http://` or `https://`)
- Try refreshing the page after updating settings

**API Key Errors**
- Verify your OpenRouter API key is correct
- Check your OpenRouter account has sufficient credits
- Use the "Test Connection" button to verify the key

**Button Not Appearing**
- Check if the text field is large enough (minimum 100x30 pixels)
- Ensure the field is not readonly or disabled
- Try scrolling or resizing the page to trigger detection

**Enhancement Fails**
- Check your internet connection
- Verify the prompt is not too long (max 4000 characters)
- Ensure the prompt contains actual text content

### Error Messages

| Error | Solution |
|-------|----------|
| "Please configure your API key" | Add your OpenRouter API key in extension settings |
| "Invalid API key" | Check your API key is correct and active |
| "Rate limit exceeded" | Wait a moment before trying again |
| "Prompt is too long" | Reduce prompt length to under 4000 characters |
| "Network error" | Check your internet connection |

## Privacy & Security

### Data Protection
- **API keys are encrypted** using AES-GCM encryption before storage
- **No data is collected** by the extension itself
- **Prompts are sent only to OpenRouter** for enhancement
- **No tracking or analytics** are implemented

### Permissions Explained
- **Storage**: To save your encrypted API key and domain settings
- **Active Tab**: To inject enhancement buttons on whitelisted pages
- **Host Permissions**: To communicate with OpenRouter API

## Development

### Project Structure
```
prompt-enhancer-extension/
├── manifest.json          # Extension configuration
├── popup.html             # Settings popup interface
├── popup.css              # Popup styling
├── popup.js               # Popup functionality
├── content.js             # Content script for page injection
├── content.css            # Content script styles
├── background.js          # Service worker for API calls
├── encryption.js          # Encryption utilities
├── storage.js             # Secure storage utilities
├── validation.js          # Input validation utilities
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

### Building from Source

1. Clone or download the source code
2. No build process required - the extension uses vanilla JavaScript
3. Load the extension directory in Chrome as described in installation

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Changelog

### Version 1.2.2
- Bug fixes
- Removed How it works section

### Version 1.2.0
- Major UI overhaul: modern, compact, and responsive popup
- Added dark mode with sun/moon toggle
- Improved color contrast and accessibility
- More compact header and reduced blank space
- Wider popup for better usability
- All text colors now adapt to light/dark mode for perfect readability

### Version 1.1.2
- Switched to DeepSeek R1 32B via OpenRouter for improved prompt enhancement
- Improved prompt enhancement quality

## Support

For issues, questions, or feature requests:

1. Check the troubleshooting section above
2. Review common error messages and solutions
3. Contact the developer through the social links in the extension popup

## License

This project is licensed under the MIT License, Would appreciate credits 

## Credits

- **AI Model**: DeepSeek R1 32B via OpenRouter
- **Developer**: [@prshv1](https://github.com/prshv1/)
- **Social**: [@parshva.0](https://www.instagram.com/parshva.0/)


---

**Made with ❤️ for better AI interactions**

