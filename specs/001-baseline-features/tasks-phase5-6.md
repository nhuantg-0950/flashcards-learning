# Actionable Tasks: Phase 5 (Context7 MCP) & Phase 6 (Logout)

**Branch**: `001-baseline-features` | **Date**: 2026-02-27
**Spec**: `specs/001-baseline-features/spec.md` | **Plan**: `specs/001-baseline-features/plan.md`

> Chỉ bao gồm tasks cho Phase 5 và Phase 6. Các tính năng Flashcard (Phase 1-4) đã hoàn thành.

---

## Phase 5 — Context7 MCP Server Setup ✅

### Task 5.1: Tạo MCP Configuration cho Cursor IDE ✅
**Priority**: P1 | **Estimate**: 5 min | **FRs**: FR-028, FR-029

**Mô tả**: Tạo file cấu hình MCP để Cursor IDE có thể kết nối với Context7 server.

**File đã tạo**:
- `.cursor/mcp.json` ✅

**Nội dung**:
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

**Acceptance Criteria**:
- [ ] File `.cursor/mcp.json` tồn tại với cấu hình đúng
- [ ] Restart Cursor → Context7 xuất hiện trong danh sách MCP tools

---

### Task 5.2: Tạo MCP Configuration cho VS Code (Optional) ✅
**Priority**: P2 | **Estimate**: 5 min | **FRs**: FR-028

**Mô tả**: Tạo file cấu hình MCP tương tự cho VS Code users.

**File đã tạo**:
- `.vscode/mcp.json` ✅

**Nội dung**: Giống Task 5.1

**Acceptance Criteria**:
- [ ] File `.vscode/mcp.json` tồn tại
- [ ] VS Code với MCP extension có thể load Context7

---

### Task 5.3: Tạo Documentation cho Context7 Tooling ✅
**Priority**: P1 | **Estimate**: 15 min | **FRs**: FR-030

**Mô tả**: Viết hướng dẫn setup và sử dụng Context7 MCP Server.

**File đã tạo**:
- `docs/tooling.md` ✅

**Nội dung cần bao gồm**:
1. Context7 là gì và tại sao cần dùng
2. Hướng dẫn setup cho Cursor IDE
3. Hướng dẫn setup cho VS Code
4. Cách verify Context7 đang hoạt động
5. Ví dụ query thực tế (e.g., "How to use Supabase signOut?")

**Acceptance Criteria**:
- [ ] File `docs/tooling.md` tồn tại
- [ ] Hướng dẫn đầy đủ cho cả Cursor và VS Code
- [ ] Có ví dụ sử dụng cụ thể

---

### Task 5.4: Cập nhật README với Tooling Section ✅
**Priority**: P2 | **Estimate**: 5 min | **FRs**: FR-030

**Mô tả**: Thêm section Developer Tooling vào README.md với link đến docs/tooling.md.

**File đã tạo**:
- `README.md` ✅

**Thay đổi**:
- Thêm section "## Developer Tooling"
- Link đến `docs/tooling.md`
- Mention Context7 MCP Server

**Acceptance Criteria**:
- [ ] README có section Developer Tooling
- [ ] Link đến docs/tooling.md hoạt động

---

## Phase 6 — Logout Feature ✅

### Task 6.1: Tạo Logout API Route Handler ✅
**Priority**: P1 | **Estimate**: 20 min | **FRs**: FR-023, FR-024, FR-027

**Mô tả**: Tạo POST endpoint để xử lý logout, gọi Supabase signOut và clear cookies.

**File đã tạo**:
- `app/api/auth/logout/route.ts` ✅

**Implementation**:
```typescript
// POST /api/auth/logout
// 1. Tạo Supabase server client
// 2. Gọi supabase.auth.signOut()
// 3. Clear tất cả sb-* cookies trong response
// 4. Return { success: true } hoặc { error: string }
```

**API Contract**:
| Method | Path | Request Body | Success Response | Error Response |
|--------|------|--------------|------------------|----------------|
| POST | `/api/auth/logout` | None | `{ success: true }` | `{ error: string }` |

**Cookie clearing logic**:
```typescript
const response = NextResponse.json({ success: true });
// Clear Supabase auth cookies
const cookiesToClear = ['sb-access-token', 'sb-refresh-token'];
cookiesToClear.forEach(name => {
  response.cookies.delete(name);
});
return response;
```

**Acceptance Criteria**:
- [ ] POST /api/auth/logout trả về `{ success: true }` khi thành công
- [ ] Supabase session được invalidate trên server
- [ ] Tất cả auth cookies được clear
- [ ] Trả về `{ error: string }` khi thất bại (không throw)

---

### Task 6.2: Tạo useLogout Hook ✅
**Priority**: P1 | **Estimate**: 15 min | **FRs**: FR-022, FR-025, FR-027

**Mô tả**: Tạo React hook để handle logout action với loading/error state.

**File đã tạo**:
- `hooks/useLogout.ts` ✅

**Interface**:
```typescript
interface UseLogoutReturn {
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
```

**Implementation logic**:
```typescript
// 1. Set isLoading = true
// 2. Call POST /api/auth/logout
// 3. On success: router.push('/login'), router.refresh()
// 4. On error: set error message, do NOT redirect
// 5. Set isLoading = false
```

**Acceptance Criteria**:
- [ ] Hook export `logout`, `isLoading`, `error`
- [ ] `logout()` gọi API và redirect khi thành công
- [ ] Khi API fail, set error message và KHÔNG redirect
- [ ] isLoading phản ánh đúng trạng thái

---

### Task 6.3: Tạo LogoutButton Component ✅
**Priority**: P1 | **Estimate**: 10 min | **FRs**: FR-022

**Mô tả**: Tạo client component hiển thị nút Logout và xử lý click event.

**File đã tạo**:
- `components/layout/LogoutButton.tsx` ✅

**Props**:
```typescript
interface LogoutButtonProps {
  className?: string;
}
```

**Implementation**:
- Sử dụng `useLogout` hook
- Hiển thị loading spinner khi đang logout
- Hiển thị error toast/alert khi thất bại
- Disable button khi isLoading

**Acceptance Criteria**:
- [ ] Button hiển thị "Logout" hoặc "Đăng xuất"
- [ ] Click → gọi logout()
- [ ] Hiển thị loading state
- [ ] Hiển thị error khi thất bại

---

### Task 6.4: Tạo Header Component với Navigation ✅
**Priority**: P1 | **Estimate**: 20 min | **FRs**: FR-022

**Mô tả**: Tạo header component chứa logo, navigation links, và LogoutButton.

**File đã tạo**:
- `components/layout/Header.tsx` ✅

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ [Logo] Flashcards    [My Decks]           [Logout Btn] │
└─────────────────────────────────────────────────────────┘
```

**Implementation**:
- Client component (cần auth state)
- Conditional render: chỉ hiển thị trên authenticated pages
- Link "My Decks" → `/decks`
- LogoutButton ở góc phải

**Acceptance Criteria**:
- [ ] Header hiển thị logo/app name
- [ ] Link đến /decks
- [ ] LogoutButton ở góc phải
- [ ] Responsive trên mobile

---

### Task 6.5: Cập nhật Layout để include Header ✅
**Priority**: P1 | **Estimate**: 10 min | **FRs**: FR-022

**Mô tả**: Thêm Header vào app layout cho các authenticated pages.

**File đã tạo**:
- `app/decks/layout.tsx` ✅ (tạo layout riêng cho /decks route group)

**Approach Options**:

**Option A**: Sửa `app/layout.tsx`
- Conditional render Header dựa trên route
- Không hiển thị Header trên /login

**Option B**: Tạo route group layout (Recommended)
- Tạo `app/(authenticated)/layout.tsx` với Header
- Di chuyển `/decks` vào `app/(authenticated)/decks/`

**Acceptance Criteria**:
- [ ] Header hiển thị trên tất cả protected pages (/decks, /decks/[id], etc.)
- [ ] Header KHÔNG hiển thị trên /login
- [ ] Layout không bị break

---

### Task 6.6: Cập nhật/Tạo Middleware cho Session Validation ✅
**Priority**: P1 | **Estimate**: 15 min | **FRs**: FR-026

**Mô tả**: Đảm bảo middleware redirect về /login khi session invalid/expired.

**File đã tạo**:
- `middleware.ts` ✅ (root level, bao gồm cả Cache-Control headers)

**Implementation**:
```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. Create Supabase client with request cookies
  // 2. Get user session
  // 3. If no session and accessing protected route → redirect to /login
  // 4. If session valid → continue
  // 5. Refresh session if needed
}

export const config = {
  matcher: ['/decks/:path*', '/api/decks/:path*', '/api/cards/:path*'],
};
```

**Protected routes**:
- `/decks/*`
- `/api/decks/*`
- `/api/cards/*`

**Acceptance Criteria**:
- [ ] Unauthenticated user → redirect to /login
- [ ] Expired session → redirect to /login
- [ ] Valid session → request continues
- [ ] /login không bị protect

---

### Task 6.7: Thêm Cache-Control Headers để Prevent Back Button Access ✅
**Priority**: P2 | **Estimate**: 10 min | **FRs**: FR-026

**Mô tả**: Thêm headers để browser không cache protected pages, prevent back button showing stale content sau logout.

**Đã bao gồm trong**: `middleware.ts` ✅

**Headers cần thêm**:
```typescript
response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
response.headers.set('Pragma', 'no-cache');
response.headers.set('Expires', '0');
```

**Acceptance Criteria**:
- [ ] Protected pages có Cache-Control: no-store
- [ ] Sau logout, Back button không show cached content

---

### Task 6.8: Viết Integration Tests cho Logout
**Priority**: P2 | **Estimate**: 20 min | **FRs**: FR-023, FR-024, FR-025, FR-026
**Status**: Optional — có thể làm sau

**Mô tả**: Viết tests để verify logout flow hoạt động đúng.

**File cần tạo**:
- `tests/integration/api/logout.test.ts`

**Test cases**:
1. **Logout success**: POST /api/auth/logout → 200, cookies cleared
2. **Logout redirects**: After logout, GET /decks → redirect to /login
3. **Logout error handling**: Simulate network error → user stays logged in

**Acceptance Criteria**:
- [ ] Test logout API trả về success
- [ ] Test cookies được clear
- [ ] Test redirect sau logout

---

## Checklist Summary

### Phase 5 — Context7 MCP Server ✅
- [x] Task 5.1: `.cursor/mcp.json`
- [x] Task 5.2: `.vscode/mcp.json`
- [x] Task 5.3: `docs/tooling.md`
- [x] Task 5.4: `README.md`

### Phase 6 — Logout Feature ✅

**Files đã TẠO MỚI**:
| File | Task | Status |
|------|------|--------|
| `app/api/auth/logout/route.ts` | 6.1 | ✅ |
| `hooks/useLogout.ts` | 6.2 | ✅ |
| `components/layout/LogoutButton.tsx` | 6.3 | ✅ |
| `components/layout/Header.tsx` | 6.4 | ✅ |
| `middleware.ts` | 6.6 + 6.7 | ✅ |
| `app/decks/layout.tsx` | 6.5 | ✅ |
| `tests/integration/api/logout.test.ts` | 6.8 | 🔲 Optional |

### Execution Order (Recommended)

```
Phase 5 (có thể làm song song với Phase 6):
  5.1 → 5.2 → 5.3 → 5.4

Phase 6 (sequential):
  6.6 (Middleware) → 6.1 (API) → 6.2 (Hook) → 6.3 (Button) → 6.4 (Header) → 6.5 (Layout) → 6.7 (Cache) → 6.8 (Tests)
```

### Verification Commands

```bash
# TypeScript check
npx tsc --noEmit

# Build check
npx next build

# Run tests
npm test

# Manual verification
npm run dev
# 1. Login
# 2. Navigate to /decks
# 3. Click Logout
# 4. Verify redirect to /login
# 5. Press Back button → should stay on /login
# 6. Try to access /decks directly → redirect to /login
```
