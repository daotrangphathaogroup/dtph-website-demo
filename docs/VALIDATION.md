# Kiểm tra backend local — 02/10/2026

`npm run build` đạt: TypeScript và Vite build thành công.

`npm test` đạt: 10 tests (9 tình huống integration và test bao ngoài), dùng HTTP và database PostgreSQL tạm, không thay đổi dữ liệu local người dùng đang thử.

Các tình huống đã kiểm tra:

- Bootstrap chưa đăng nhập không trả hồ sơ, ghi từ origin khác bị chặn.
- Chung SĐT cần mã thành viên; OTP từ chối sai account/purpose và dùng lại.
- API che thông tin riêng theo quyền, chặn sửa hồ sơ/config trái phép và giả role.
- Đăng ký lớp đồng thời không trùng; quản lý lớp chỉ hủy cho đúng lớp được phân công.
- Đăng ký tài khoản mới với SĐT có sẵn; chỉ kích hoạt sau OTP, mật khẩu lưu hash.
- OTP giới hạn 5 lần sai, hết hạn, cooldown gửi lại và hủy mã cũ.
- Đổi mật khẩu gắn đúng session, grant một lần, thu hồi session khác; mật khẩu mới có hiệu lực.
- Lưu hồ sơ/cấu hình, server chuyển PNG sang WebP, ảnh yêu cầu đăng nhập.
- Đóng/mở lại PostgreSQL giữ hồ sơ, tài khoản mới, cấu hình, phiên và mật khẩu đã đổi.

Kiểm tra trình duyệt:

- Đăng nhập SĐT chung 0901200000 yêu cầu mã; nhập PH00001 nhận SMS mô phỏng đúng mã thành viên.
- Nhập OTP từ backend mở tổng quan với quyền quản lý tổng.
- Bảng quản lý tải 36 hồ sơ từ API, hiển thị ngày đúng YYYY-MM-DD chuyển sang tiếng Việt.
- Biểu mẫu hồ sơ tải dữ liệu backend; bấm Lưu thông tin nhận thông báo thành công.
- Backend được khởi động lại trên database local; tiến trình thứ hai bị chặn để bảo vệ dữ liệu PGlite.

SMS thật, Supabase Auth/RLS và Cloudflare R2 chưa tích hợp. Thử giao diện trên mobile của giai đoạn frontend vẫn được giữ; chưa chạy lại toàn bộ các luồng trên mọi kích thước sau khi nối backend. Quên mật khẩu và xác minh SĐT mới khi thay số là bước production tiếp theo.

## Cập nhật logo và giao diện — 02/10/2026

- Logo gốc `public/logo-ctn.png` có nền trong suốt, dùng chung ở sidebar, header mobile, Auth và favicon.
- Màu đỏ trầm/vàng ấm/nền ngà áp dụng vào điều hướng, nút, bảng, biểu mẫu, hộp thoại và OTP.
- Build TypeScript/Vite đạt.
- Browser desktop: logo tải thành công, tổng quan và bảng quản lý hiển thị đúng.
- Browser mobile 390px: menu mở/đóng, logo hiển thị trên header; document width 390px, bảng cuộn trong vùng riêng.
- Ảnh kiểm tra: `docs/previews/brand-overview.jpg`, `docs/previews/brand-mobile.jpg`.

## Chuẩn bị triển khai Vercel / Supabase / R2 — 02/10/2026

- `npm run build`: đạt.
- `npm test`: 17 tests đạt; giữ các integration tests local và thêm tests production/providers.
- PostgreSQL adapter: transaction dùng một client, SET LOCAL search_path trong transaction và rollback; TLS verification bật.
- Migration production thử trên PostgreSQL nhúng: schema private, RLS các bảng, anon/authenticated bị chặn, không có hồ sơ mẫu.
- Đăng ký qua nhánh production: SMS provider fake nhận mã đúng account, HTTP không có code/message/SĐT đầy đủ, cookie Secure và OTP không dùng lại.
- R2 adapter fake: key avatars/, WebP, private; Twilio adapter fake: SĐT +84 và nội dung có mã thành viên.
- Rate limits production ghi DB; health kiểm tra được schema/connection qua query.
- Chưa deploy thật, chưa chạy migration trên Supabase thật, chưa tạo bucket/key R2 hoặc gửi SMS thật: chưa có tài khoản/project/kết nối cloud.
