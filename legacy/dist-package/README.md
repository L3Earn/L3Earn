<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1PR-mDAbI4rinm7Nb6RXmnsvVv2UUpCdO

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set up environment variables in [.env.local](.env.local)
3. Run the app:
   `npm run dev`

## Configuration

### LLM Provider Configuration

This app supports multiple LLM providers through OpenAI-compatible APIs:

**Environment Variables:**

```bash
# Required - Your LLM API key
LLM_API_KEY=your-api-key

# Optional - Provider type: 'openai', 'anthropic', 'azure', 'custom'
LLM_PROVIDER=openai

# Optional - Model name (default: gpt-4o-mini)
LLM_MODEL=MiniMax-M2.5

# Optional - Custom base URL for self-hosted models
LLM_BASE_URL=https://api.openai.com/v1
```

**Supported Providers:**

- **OpenAI** (default): Set `LLM_API_KEY` to your OpenAI API key
- **Anthropic Claude**: Set `LLM_PROVIDER=anthropic` and `LLM_API_KEY`
- **Azure OpenAI**: Set `LLM_PROVIDER=azure`, `LLM_API_KEY`, and `AZURE_OPENAI_ENDPOINT`
- **Custom/Open-source**: Set `LLM_PROVIDER=custom`, `LLM_API_KEY`, and `LLM_BASE_URL`

**Backward Compatibility:**
The app also supports legacy `GEMINI_API_KEY` and `API_KEY` environment variables for existing setups.
