# Đăng nhập bằng Google

Website giữ backend xác thực hiện tại và dùng Google OpenID Connect cho phương thức đăng nhập bổ sung. Không cần chuyển sang Supabase Auth. Không cần cấu hình Gmail SMTP để dùng nút này; đăng nhập Google không gửi email OTP và không xin quyền đọc Gmail.

## Cấu hình Google Cloud

1. Mở https://console.cloud.google.com/ và tạo/chọn project.
2. Vào **Google Auth Platform**. Hoàn tất **Branding** (tên website, email hỗ trợ/liên hệ). Ở **Audience**, chọn External nếu huynh đệ dùng Gmail cá nhân. Khi ứng dụng còn Testing, thêm các địa chỉ thử vào Test users. Chuyển sang In production khi mở cho mọi người; Google có thể yêu cầu xác minh tên miền hoặc ứng dụng theo cấu hình.
3. Vào **Clients → Create client → Web application**. Thêm Authorized redirect URIs chính xác:

   ```text
   https://dtph-website-demo.vercel.app/api/auth/google/callback
   http://127.0.0.1:5173/api/auth/google/callback
   ```

   Nếu dùng tên miền riêng, thêm callback của tên miền đó và cập nhật APP_ORIGIN. Không dùng wildcard hoặc đường dẫn có dấu `/` thừa. Luồng chuyển hướng server này không cần Authorized JavaScript origins.
4. Lưu Client ID và Client secret; không commit secret.

## Supabase và Vercel

1. Áp dụng các migration chưa chạy theo thứ tự, bao gồm migration email và `supabase/migrations/202610050002_google_auth.sql`. Có thể chạy `npm run db:migrate` với cấu hình migration local, hoặc mở từng file trong Supabase SQL Editor. Migration thêm cột và bảng, giữ dữ liệu hiện tại. Bảng flow OAuth là dữ liệu nội bộ, không cấp quyền cho anon/authenticated.
2. Vercel → Project → Settings → Environment Variables, thêm hai biến **server-only** cho Production:

   ```text
   GOOGLE_CLIENT_ID=<Client ID>
   GOOGLE_CLIENT_SECRET=<Client secret>
   ```

   Giữ `APP_ORIGIN=https://dtph-website-demo.vercel.app` và `OTP_SECRET` hiện có. Không thêm tiền tố NEXT_PUBLIC_. Mỗi môi trường phải dùng callback khớp chính xác với origin của nó.
3. Push mã nguồn lên GitHub để Vercel build, hoặc Redeploy sau khi đổi biến môi trường.
4. Đăng nhập bằng mật khẩu với tài khoản quản lý tổng, vào **Cấu hình đăng ký → Tính năng xác thực**, bật **Đăng nhập bằng Google** (mặc định tắt).
5. Test trên tên miền chính đã đăng ký callback; các URL preview ngẫu nhiên không tự được Google chấp nhận.

## Thử local

Tạo `.env.local` (đã được gitignore) chứa GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET, restart `npm run dev`, mở http://127.0.0.1:5173. Backend local dùng callback cố định như trên. Không chép các biến PostgreSQL/R2 production vào `.env.local` nếu muốn tiếp tục thử database local.

## Cách sử dụng

- Hồ sơ phải hoàn tất đăng ký và có email trùng với email Google. Nếu chưa có email, đăng nhập bằng mật khẩu và cập nhật email trong hồ sơ trước.
- Bấm **Đăng nhập bằng Google** và chọn tài khoản.
- Lần đầu, website yêu cầu mật khẩu hồ sơ hiện tại để liên kết. Không tự liên kết chỉ vì email trùng: email trong hồ sơ trước đây chưa được xác minh.
- Những lần sau, Google xác thực và website mở phiên đăng nhập trực tiếp, không gửi thêm SMS. Đây là phương thức đăng nhập thay thế, không phải cam kết Google đã bật 2FA.
- Hồ sơ mới vẫn đăng ký bằng form hiện có; nút Google không tự tạo hồ sơ thiếu thông tin. Hoàn tất đăng ký bằng cùng email rồi quay lại nút Google để liên kết.
- Quyền quản lý được giữ trong database, không lấy từ Google. Liên kết lưu bằng Google `sub`, nên đổi email hồ sơ không chuyển liên kết sang người khác.
- Mỗi Google account liên kết tối đa một hồ sơ. Chưa có thao tác đổi/gỡ liên kết trên giao diện.

## Bảo vệ luồng xác thực

Authorization Code + PKCE, state gắn với cookie HttpOnly/SameSite=Lax, nonce trong ID token, xác minh chữ ký/audience/issuer/hạn token bằng google-auth-library. Callback và phiên liên kết lưu trong PostgreSQL, hết hạn sau 10 phút và chỉ sử dụng một lần; giới hạn 5 lần thử mật khẩu liên kết. Callback không lưu access token/refresh token. Phiên website tiếp tục dùng cookie HttpOnly/Secure/SameSite=Strict trong production.

## Nguồn

- https://developers.google.com/identity/protocols/oauth2/web-server
- https://developers.google.com/identity/openid-connect/openid-connect
- https://developers.google.com/identity/sign-in/web/backend-auth
