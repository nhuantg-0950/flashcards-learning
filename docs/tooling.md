# Developer Tooling: Context7 MCP Server

## Overview

Context7 MCP (Model Context Protocol) Server cung cấp cho AI assistants khả năng truy cập documentation của các thư viện được sử dụng trong project. Thay vì dựa vào training data có thể outdated, AI có thể fetch documentation mới nhất trực tiếp từ Context7.

### Tại sao cần Context7?

- **Up-to-date**: Documentation luôn mới nhất, không phụ thuộc vào training cutoff date
- **Accurate**: Giảm hallucination vì AI có access đến source of truth
- **Contextual**: AI biết chính xác version của library đang dùng trong project

## Setup Instructions

### Cho Cursor IDE

1. File `.cursor/mcp.json` đã được cấu hình sẵn trong project
2. Restart Cursor IDE
3. Kiểm tra MCP tools: Mở Cursor Settings → Features → MCP Servers
4. Verify "context7" xuất hiện trong danh sách

### Cho VS Code

1. Cài extension: [Copilot MCP](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-mcp) (nếu có)
2. File `.vscode/mcp.json` đã được cấu hình sẵn
3. Restart VS Code
4. Verify trong Copilot Chat settings

### Configuration File

**Cursor** (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

**VS Code** (`.vscode/mcp.json`):
```json
{
  "servers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

## Usage

### Cách sử dụng Context7 trong AI Chat

Khi chat với AI assistant (Cursor AI, GitHub Copilot), bạn có thể yêu cầu AI sử dụng Context7 để lấy documentation:

**Ví dụ queries**:

```
# Hỏi về Supabase Auth
"Use context7 to look up how to implement signOut with Supabase SSR in Next.js App Router"

# Hỏi về Next.js Middleware
"Check context7 for Next.js middleware documentation for auth protection"

# Hỏi về Zod validation
"Use context7 to find Zod schema validation best practices"
```

### Libraries được hỗ trợ

Context7 hỗ trợ hầu hết các popular libraries. Các libraries trong project này:

| Library | Use Case |
|---------|----------|
| `next` | App Router, Server Components, Middleware |
| `@supabase/supabase-js` | Database queries, Auth |
| `@supabase/ssr` | Server-side Supabase client |
| `zod` | Schema validation |
| `react` | Hooks, Components |
| `tailwindcss` | Styling |

## Verification

### Kiểm tra Context7 đang hoạt động

1. Mở AI Chat (Cursor AI hoặc GitHub Copilot)
2. Hỏi một câu cụ thể về library:
   ```
   Use context7 to explain how createServerClient works in @supabase/ssr
   ```
3. AI sẽ fetch documentation từ Context7 và trả lời với thông tin chính xác

### Troubleshooting

**Context7 không xuất hiện trong tools list**:
- Đảm bảo đã restart IDE sau khi thêm config file
- Kiểm tra `npx` có trong PATH
- Thử chạy manual: `npx -y @upstash/context7-mcp`

**Lỗi khi fetch documentation**:
- Kiểm tra internet connection
- Một số libraries hiếm có thể không được index

## Best Practices

1. **Specify library name**: Luôn mention tên library cụ thể khi hỏi
   - ✅ "How to use signOut in @supabase/ssr?"
   - ❌ "How to logout?"

2. **Include version context**: Nếu cần version cụ thể
   - "Check context7 for Next.js 14 App Router middleware"

3. **Ask for code examples**: Context7 có thể cung cấp code samples
   - "Use context7 to show example of Zod schema with custom error messages"

## Notes

- Context7 là **development-time tooling** — không ảnh hưởng đến runtime
- Không có dependencies nào được thêm vào `package.json`
- Config files (`.cursor/mcp.json`, `.vscode/mcp.json`) có thể commit vào repo để team members cùng sử dụng
