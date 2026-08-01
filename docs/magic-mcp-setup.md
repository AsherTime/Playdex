# 21st MCP (formerly Magic MCP) setup for Cursor

Magic MCP is now the unified **21st MCP**. Use it to search/generate shadcn-style UI from prompts inside Cursor.

## 1. Get an API key

1. Open [https://21st.dev/mcp](https://21st.dev/mcp)
2. Generate a fresh API key (old Magic console keys were reset)

## 2. Configure Cursor (recommended)

```bash
npx @21st-dev/cli@latest init --client cursor
```

Or copy the example config into the project (gitignored):

```bash
mkdir -p .cursor
cp mcp.magic.example.json .cursor/mcp.json
```

Replace `YOUR_21ST_API_KEY` in `.cursor/mcp.json` with your real key.

User-level config (`~/.cursor/mcp.json`) works the same:

```json
{
  "mcpServers": {
    "21st": {
      "url": "https://21st.dev/api/mcp",
      "headers": {
        "x-api-key": "YOUR_21ST_API_KEY"
      }
    }
  }
}
```

### Compatibility proxy (optional)

Older `@21st-dev/magic` stdio configs still work as a proxy:

```json
{
  "mcpServers": {
    "@21st-dev/magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest", "API_KEY=\"YOUR_21ST_API_KEY\""]
    }
  }
}
```

## 3. Restart Cursor

After restart, confirm **21st** appears under Cursor Settings → MCP.

## 4. Use it

Ask the agent to use 21st tools, for example:

- `Search 21st for a dark gaming homepage hero`
- `Generate a live news tracker card with shadcn/Tailwind`

Prefer current tool names (`search`, `generate`, `get_inspiration`) over legacy Magic names.

`.cursor/` is gitignored in this repo so local API keys stay off git.
