# Screenshots

Thư mục này chứa screenshots của ứng dụng Flashcards Learning.

## Danh sách screenshots cần chụp

| # | Filename | Page | URL |
|---|----------|------|-----|
| 1 | `01-login.png` | Login Page | `/login` |
| 2 | `02-deck-list.png` | Deck List | `/decks` |
| 3 | `03-create-deck.png` | Create Deck | `/decks/new` |
| 4 | `04-deck-detail.png` | Deck Detail | `/decks/[id]` |
| 5 | `05-card-form.png` | Add/Edit Card | `/decks/[id]/cards/new` |
| 6 | `06-study-front.png` | Study - Question | `/decks/[id]/study` |
| 7 | `07-study-back.png` | Study - Answer | `/decks/[id]/study` (after reveal) |
| 8 | `08-session-summary.png` | Session Complete | `/decks/[id]/study` (after finish) |
| 9 | `09-no-cards-due.png` | Empty Study State | `/decks/[id]/study` (no due cards) |
| 10 | `10-header-logout.png` | Header with Logout | Any authenticated page |

## Hướng dẫn chụp

### Bước 1: Khởi động ứng dụng
```bash
# Terminal 1: Start Supabase
supabase start

# Terminal 2: Start Next.js
npm run dev
```

### Bước 2: Tạo test data
1. Truy cập `http://localhost:3000/login`
2. Đăng ký tài khoản mới
3. Tạo 1-2 deck với 3-5 cards mỗi deck

### Bước 3: Chụp screenshots

**Sử dụng browser DevTools:**
1. Mở Chrome/Firefox DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Set viewport: 1280 x 800
4. Click ⋮ → Capture screenshot

**Sử dụng công cụ hệ thống:**
- **Linux**: `gnome-screenshot -a -f docs/screenshots/01-login.png`
- **macOS**: `Cmd + Shift + 4`
- **Windows**: `Win + Shift + S`

### Bước 4: Optimize images (optional)
```bash
# Install pngquant
sudo apt install pngquant

# Compress all screenshots
for f in docs/screenshots/*.png; do
  pngquant --force --quality=65-80 "$f" --output "$f"
done
```

## Image specifications

- **Format**: PNG
- **Width**: 1280px (desktop) or 375px (mobile)
- **Quality**: Optimized for web
- **Naming**: `XX-descriptive-name.png`
