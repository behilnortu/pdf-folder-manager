# Anthropic API Setup Guide

## Getting Your API Key

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" in the settings
4. Click "Create Key" and copy your new API key

## Setting Up the API Key

### For macOS/Linux:

1. Open your terminal
2. Add to your shell profile (`.zshrc`, `.bashrc`, or `.bash_profile`):
   ```bash
   export ANTHROPIC_API_KEY="your-api-key-here"
   ```
3. Reload your shell:
   ```bash
   source ~/.zshrc  # or ~/.bashrc
   ```

### For Windows:

1. Open PowerShell as Administrator
2. Set environment variable:
   ```powershell
   [System.Environment]::SetEnvironmentVariable('ANTHROPIC_API_KEY', 'your-api-key-here', 'User')
   ```

### Temporary (Current Session Only):

```bash
# macOS/Linux
export ANTHROPIC_API_KEY="your-api-key-here"

# Windows (PowerShell)
$env:ANTHROPIC_API_KEY="your-api-key-here"
```

## Running the Server

After setting the environment variable, start the server:

```bash
npm start
```

## Testing the Feature

1. Load a PDF in the viewer
2. Click the "Summarize" button (with ✨ icon)
3. Wait for the summary to generate (usually 5-30 seconds depending on PDF size)
4. The summary will be automatically saved to the PDF's notes
5. A ✨ sparkle icon will appear next to the PDF name
6. Click the sparkle to view the summary

## Pricing

- Approximate cost: $0.03-0.15 per PDF summary
- Based on PDF length and complexity
- 32MB maximum file size

## Troubleshooting

If you see an error:
- "API key not configured" → Set the ANTHROPIC_API_KEY environment variable
- "Invalid API key" → Check that your API key is correct
- "PDF exceeds 32MB limit" → Use a smaller PDF file
- "Rate limit exceeded" → Wait a few moments and try again
