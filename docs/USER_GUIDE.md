# Hướng dẫn sử dụng Flashcards Learning

## Mục lục

1. [Giới thiệu](#giới-thiệu)
2. [Bắt đầu sử dụng](#bắt-đầu-sử-dụng)
3. [Quản lý Deck](#quản-lý-deck)
4. [Quản lý Card](#quản-lý-card)
5. [Học với Study Session](#học-với-study-session)
6. [Hiểu về Spaced Repetition](#hiểu-về-spaced-repetition)
7. [Mẹo sử dụng hiệu quả](#mẹo-sử-dụng-hiệu-quả)

---

## Giới thiệu

Flashcards Learning là ứng dụng học flashcard sử dụng phương pháp **Spaced Repetition** (Lặp lại ngắt quãng) — một kỹ thuật học tập đã được khoa học chứng minh giúp ghi nhớ lâu dài.

### Spaced Repetition là gì?

Thay vì ôn tập tất cả mỗi ngày, Spaced Repetition chỉ cho bạn ôn những thẻ bạn **sắp quên**:

- Thẻ mới/khó → xuất hiện thường xuyên
- Thẻ đã nhớ tốt → xuất hiện ít hơn
- Khoảng cách giữa các lần ôn tăng dần: 1 ngày → 3 ngày → 1 tuần → 1 tháng...

### Thuật toán SM-2

Ứng dụng sử dụng thuật toán SM-2 (SuperMemo 2) — một trong những thuật toán spaced repetition phổ biến và hiệu quả nhất.

---

## Bắt đầu sử dụng

### Đăng ký tài khoản

1. Truy cập trang đăng nhập
2. Chọn **Sign up**
3. Nhập email và mật khẩu
4. Xác nhận email (nếu cần)

### Đăng nhập

1. Truy cập trang đăng nhập
2. Nhập email và mật khẩu
3. Click **Sign in**

### Đăng xuất

1. Click nút **Logout** ở góc phải trên header
2. Bạn sẽ được chuyển về trang đăng nhập

---

## Quản lý Deck

**Deck** là bộ sưu tập các flashcard theo chủ đề.

### Tạo Deck mới

1. Từ trang **My Decks**, click **New Deck**
2. Nhập tên deck (1-255 ký tự)
3. Click **Create**

**Gợi ý đặt tên**:
- ✅ "Từ vựng TOEIC - Chủ đề Business"
- ✅ "Kanji N3 - Tuần 1"
- ❌ "Deck 1" (quá chung chung)

### Đổi tên Deck

1. Click vào deck muốn đổi tên
2. Click nút **Edit** (biểu tượng bút chì)
3. Nhập tên mới
4. Click **Save**

### Xóa Deck

⚠️ **Cảnh báo**: Xóa deck sẽ xóa TẤT CẢ card và lịch sử học bên trong!

1. Click vào deck
2. Click nút **Delete** (biểu tượng thùng rác)
3. Xác nhận xóa

---

## Quản lý Card

**Card** là thẻ flashcard với mặt trước (câu hỏi) và mặt sau (đáp án).

### Thêm Card mới

1. Mở một deck
2. Click **Add Card**
3. Nhập nội dung:
   - **Front**: Câu hỏi hoặc từ cần học
   - **Back**: Đáp án hoặc định nghĩa
4. Click **Create**

**Ví dụ**:
| Front | Back |
|-------|------|
| Apple | Quả táo |
| 日本 | Nhật Bản |
| What is the capital of France? | Paris |

### Sửa Card

1. Trong danh sách card, click biểu tượng **Edit** trên card
2. Chỉnh sửa Front/Back
3. Click **Save**

### Xóa Card

1. Click biểu tượng **Delete** trên card
2. Xác nhận xóa

---

## Học với Study Session

### Bắt đầu phiên học

1. Mở deck muốn học
2. Click nút **Study**
3. Nếu có card due → phiên học bắt đầu
4. Nếu không có card due → hiển thị "Nothing to review today"

### Quy trình học

```
┌─────────────────┐
│  Hiển thị câu   │
│     hỏi         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Click "Reveal   │
│    Answer"      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Hiển thị đáp   │
│      án         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Chọn rating:    │
│ Again/Hard/     │
│ Good/Easy       │
└────────┬────────┘
         │
         ▼
    Card tiếp theo
    hoặc kết thúc
```

### Cách chọn Rating

| Rating | Khi nào chọn | Kết quả |
|--------|--------------|---------|
| 🔴 **Again** | Không nhớ gì cả | Card xuất hiện lại trong session này |
| 🟠 **Hard** | Nhớ nhưng khó khăn | Interval tăng chậm (×1.2) |
| 🟢 **Good** | Nhớ tốt | Interval tăng bình thường (×EF) |
| 🔵 **Easy** | Rất dễ, nhớ ngay | Interval tăng nhanh (×EF×1.3) |

### Kết thúc phiên học

Khi rate hết tất cả card (kể cả card bị "Again"), bạn sẽ thấy màn hình tổng kết:

- Tổng số card đã học
- Số lượng từng loại rating
- Nút quay về deck

---

## Hiểu về Spaced Repetition

### Ease Factor (EF)

Mỗi card có một **Ease Factor** (hệ số dễ) riêng:

- **Mặc định**: 2.5
- **Tối thiểu**: 1.3
- Tăng khi chọn **Easy**
- Giảm khi chọn **Again** hoặc **Hard**

Card có EF cao = bạn nhớ tốt → interval dài hơn
Card có EF thấp = bạn hay quên → interval ngắn hơn

### Interval (Khoảng cách ôn tập)

| Repetitions | Interval |
|-------------|----------|
| Lần 1 | 1 ngày |
| Lần 2 | 6 ngày |
| Lần 3+ | Interval cũ × EF |

**Ví dụ với EF = 2.5**:
- Lần 1: 1 ngày
- Lần 2: 6 ngày
- Lần 3: 6 × 2.5 = 15 ngày
- Lần 4: 15 × 2.5 = 38 ngày
- ...

### Next Review Date

Sau mỗi lần rating, hệ thống tính:
```
next_review_date = hôm nay + interval
```

Card sẽ xuất hiện lại vào đúng ngày đó.

---

## Mẹo sử dụng hiệu quả

### 1. Học đều đặn mỗi ngày

- ✅ Học 15-20 phút/ngày
- ❌ Học dồn 2 tiếng cuối tuần

Spaced repetition chỉ hiệu quả khi bạn học đều đặn!

### 2. Thành thật khi rating

- Đừng chọn **Good** khi thực sự không nhớ
- Chọn **Again** sẽ giúp bạn ôn lại ngay
- Tự lừa dối = học không hiệu quả

### 3. Viết card ngắn gọn

- ✅ Front: "Apple" → Back: "Quả táo"
- ❌ Front: "What is the English word for the fruit that is red, grows on trees, and is used to make cider?"

### 4. Một ý tưởng = Một card

- ✅ Tách riêng từng từ vựng
- ❌ Gộp 10 từ vào 1 card

### 5. Sử dụng hình ảnh trong đầu

Khi học, hãy tưởng tượng hình ảnh liên quan đến câu hỏi → giúp nhớ lâu hơn.

### 6. Review vào buổi sáng

Nghiên cứu cho thấy não bộ hoạt động tốt nhất vào buổi sáng sớm.

---

## FAQ

### Card không xuất hiện trong Study?

Card chỉ xuất hiện khi `next_review_date ≤ hôm nay`. Card mới luôn xuất hiện ngay.

### Tôi muốn học lại card đã scheduled cho tương lai?

Hiện tại chưa hỗ trợ. Card sẽ tự xuất hiện khi đến ngày.

### Tôi có thể học trên điện thoại?

Có! Ứng dụng responsive, hoạt động tốt trên mobile browser.

### Dữ liệu của tôi có an toàn?

Có! Mỗi user chỉ có thể xem data của mình (Row Level Security). Dữ liệu được mã hóa và lưu trữ an toàn.

---

## Hỗ trợ

Nếu gặp vấn đề, vui lòng tạo issue trên GitHub repository.
