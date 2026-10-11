# Triển khai cổng quản trị — 11/10/2026

Hạ tầng giữ Next.js trên Vercel, PostgreSQL Supabase và ảnh private trên Cloudflare R2. Không cần dịch vụ SMS, email OTP hoặc Google OAuth.

## Database trước khi deploy

Áp dụng các migration còn thiếu theo thứ tự trong `supabase/migrations/`, đặc biệt `202610110001_staff_portal.sql`. Có thể mở SQL trong Supabase SQL Editor hoặc dùng:

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

Sau migration, commit/push mã để Vercel build. Domain chính: https://dtph-website-demo.vercel.app. Trang chủ hiện công khai, quản trị tại /quan-tri/dang-nhap.

## Quản trị đầu tiên khi database không có tài khoản cũ

Trên máy quản lý có `.env.production` chứa DATABASE_URL:

```sh
npm run admin:create -- admin-name "Họ tên quản lý"
```

Lệnh yêu cầu mật khẩu qua prompt ẩn trong terminal; không đưa mật khẩu vào argument/Git. Chỉ chạy sau migration. Sau đó đăng nhập /quan-tri/dang-nhap và tạo tài khoản khác tại /quan-tri/tai-khoan. Trang tạo tài khoản kiểm tra quyền quản lý tổng, không cho người truy cập tự cấp quyền.

## Kiểm tra

- Trang chủ, trang chọn nhóm và ba trang con mở không cần đăng nhập.
- Ba form chưa nhận dữ liệu, chờ chốt trường; giao diện hiển thị trạng thái chuẩn bị.
- /api/bootstrap khi chưa đăng nhập không trả hồ sơ.
- /api/auth/login, register, verify, Google… trả 404.
- /api/admin/login chỉ dùng username + mật khẩu nhân sự.
- Quản lý lớp chỉ xem/cập nhật học viên trong lớp được giao.
- /api/health xác nhận database và mode staff-portal, không thay thế kiểm tra upload R2.
- Backend local giữ dữ liệu trên ổ đĩa; không tự đưa dữ liệu local lên cloud.
