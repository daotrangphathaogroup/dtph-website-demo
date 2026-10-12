# Triển khai cổng quản trị — 11/10/2026

Hạ tầng giữ Next.js trên Vercel, PostgreSQL Supabase và ảnh private trên Cloudflare R2. Không cần dịch vụ SMS, email OTP hoặc Google OAuth.

## Database trước khi deploy

Áp dụng các migration còn thiếu theo thứ tự trong `supabase/migrations/`, đặc biệt `202610110001_staff_portal.sql` `202610110002_staff_roles.sql` `202610120001_group_profiles.sql` và `202610120002_registration_approval.sql`. Có thể mở SQL trong Supabase SQL Editor hoặc dùng:

```sh
npm run db:migrate
```

CLI đọc `.env.production` local (gitignored), dùng MIGRATION_DATABASE_URL qua direct/session pooler. Giữ TLS verification; DATABASE_SSL_CA là PEM của Supabase nếu cần. URL connection không nên kèm sslmode/sslcert/sslrootcert có thể ghi đè cấu hình CA của pg.

Migration staff thêm bảng, không xóa hồ sơ/lớp/học viên; chuyển một lần tài khoản admin/class_manager verified sang tài khoản nhân sự. Tên mới `admin-1`/`manager-1`… và mật khẩu hiện tại giữ nguyên. Xem kết quả trong SQL Editor:

```sql
SELECT username, display_name, role FROM phat_hao.staff_accounts ORDER BY username;
```

Không xuất password_hash. Migration lặp lại không ghi đè mật khẩu/tài khoản mới.

## Vercel

Giữ liên kết GitHub. Environment Variables Production:

- APP_ORIGIN=https://dtph-website-demo.vercel.app (hoặc origin tên miền thật, không dấu / cuối).
- DATABASE_URL: Supabase transaction pooler port 6543, mật khẩu URL encoded.
- DATABASE_SSL_CA nếu cần xác minh CA.
- ADMIN_SESSION_SECRET: chuỗi random >=32 ký tự, ổn định qua redeploy.
- R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.

Không dùng NEXT_PUBLIC_ cho secrets, không commit `.env.production`. Trong giai đoạn đổi tên biến, backend chấp nhận secret cũ OTP_SECRET nếu chưa đặt ADMIN_SESSION_SECRET; đây chỉ là secret server cho rate limit, không còn tính năng OTP. Có thể chuyển cùng giá trị sang tên mới rồi xóa biến cũ. Các biến SMS_PROVIDER/TWILIO_*/GOOGLE_* không còn được sử dụng, có thể xóa trên Vercel.

Sau migration, commit/push mã để Vercel build. Domain chính: https://dtph-website-demo.vercel.app. Trang chủ hiện công khai, đăng nhập quản trị trực tiếp tại /quan-tri; khách có nút Đăng nhập quản trị ở Tổng quát.

## Tài khoản Dev

Sau khi áp dụng migration và deploy, backend tự tạo một tài khoản Dev duy nhất từ mã nguồn, ID `dev`, mật khẩu ban đầu `1@345678`. Vào `/quan-tri`, đăng nhập rồi đổi mật khẩu qua menu góc phải. Mật khẩu đã đổi được giữ trong database qua redeploy. Không đưa mã nguồn server hoặc secrets vào client bundle.

Dev tạo Admin/Manager bằng ID + mật khẩu tại menu Quản lý tài khoản. Admin/Manager không được tự tạo tài khoản hoặc xóa chính mình. Dev có thể đặt mật khẩu mới/xóa các tài khoản này; mọi phiên của tài khoản bị đặt lại mật khẩu/xóa sẽ bị thu hồi. Mật khẩu/hash không có trong API danh sách.

Migration mới đổi class_manager sang manager, giữ mật khẩu và hồ sơ. Manager được xem danh sách cả ba nhóm nhưng không chỉnh sửa. Không chạy CLI admin:create của phiên bản trước; lệnh đã được gỡ.

## Kiểm tra

- Trang chủ, trang chọn nhóm và ba trang con mở không cần đăng nhập.
- Ba form nhận thông tin và lưu hồ sơ vào đúng nhóm. Form thiếu nhi công khai không hiển thị số lần học/ngày học/nhận xét; Admin/Dev cập nhật sau.
- /api/bootstrap khi chưa đăng nhập không trả hồ sơ.
- /api/auth/login, register, verify, Google… trả 404.
- /api/admin/login chỉ dùng username + mật khẩu nhân sự.
- Manager xem cả ba nhóm, không cập nhật. Admin chỉnh sửa hồ sơ. Chỉ Dev cấu hình đăng ký và tạo/xóa/đặt mật khẩu tài khoản khác.
- /api/health xác nhận database và mode staff-portal, không thay thế kiểm tra upload R2.
- Backend local giữ dữ liệu trên ổ đĩa; không tự đưa dữ liệu local lên cloud.
