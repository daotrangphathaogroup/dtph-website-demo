# Triển khai Vercel + Supabase PostgreSQL + Cloudflare R2

Mã nguồn đã có adapter và cấu hình production. Chưa tạo tài nguyên cloud hay deploy: cần tài khoản/project và các biến môi trường. Không upload `.local/`, `.env.production` hoặc mật khẩu vào Git/Vercel deployment files.

## Kiến trúc bản này

Next.js App Router → Vercel; `/api/*` → Next.js Route Handler (Node.js runtime) → Supabase PostgreSQL private schema `phat_hao`. Ảnh qua API có xác thực → R2 private. Auth/password/session/OTP hiện do backend ứng dụng quản lý, **không phải Supabase Auth**. SĐT dùng chung vẫn được hỗ trợ.

Production không chạy PGlite, không tự migrate khi cold start, không seed tài khoản demo, không trả OTP/nội dung SMS ra HTTP. Cookie có Secure/HttpOnly/SameSite=Strict. Rate limit IP, account và SĐT lưu trong PostgreSQL để dùng giữa nhiều instance. SMS đang hỗ trợ Twilio; `SMS_PROVIDER=disabled` chặn đăng ký/OTP, dùng để chuẩn bị hosting trước khi chọn provider.

## 1. Supabase

1. Tạo project trong tài khoản của đơn vị hoặc chọn project hiện có. Không chạy migration này vào database chưa kiểm tra quyền sở hữu/phạm vi.
2. Lấy connection string từ **Connect**: Transaction pooler cho `DATABASE_URL` trên Vercel; Direct hoặc Session pooler cho migration. Password trong URL cần URL-encode. Bật kiểm tra TLS; nếu CA không được tin cậy, cung cấp PEM từ Supabase qua `DATABASE_SSL_CA`, không tắt certificate verification.
3. Copy `.env.example` thành `.env.production` trên máy, điền các giá trị thật. Không gửi secret trong chat. File này đã được Git/Vercel ignore.
4. Chạy `npm run db:migrate`, hoặc chạy nội dung `supabase/migrations/202610020001_initial.sql` trong SQL Editor của project.

Migration tạo schema riêng, enable RLS toàn bộ bảng, revoke quyền của `PUBLIC`, `anon`, `authenticated`; browser không có connection string hoặc key có quyền đọc các bảng này. Schema `phat_hao` không được thêm vào exposed schemas của Supabase Data API. API kết nối bằng tài khoản database ở server và kiểm tra quyền theo session; cấu hình hiện dùng connection string postgres của project, nên phải giữ bí mật tuyệt đối. Không cho frontend gọi trực tiếp bảng accounts/sessions/challenges. Nếu đổi sang DB role hạn chế, phải cấp quyền đúng schema và thiết kế policies cho backend role đó trước khi dùng.

Project mới bắt đầu mã PH00001, chỉ có lớp/cấu hình, không có hồ sơ giả. Dữ liệu và mật khẩu local **không tự chuyển lên**. Bản local có thể chứa dữ liệu người dùng đã nhập; cần xác nhận phạm vi riêng trước khi thực hiện import.

## 2. Cloudflare R2

1. Tạo/chọn bucket, ví dụ `phat-hao-avatars`; giữ private, tắt public access/r2.dev.
2. Tạo S3 API credentials chỉ có Object Read & Write trên bucket đã chọn.
3. Điền `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` vào environment Vercel.

Không cần bucket public domain hay browser CORS: API nhận ảnh, Sharp chuyển WebP và upload qua S3 SDK. Ảnh được đọc qua `/api/avatars/:key` có xác thực; DB không lưu presigned URL. Key nằm dưới `avatars/`. Các ảnh local cũ chưa tự chuyển lên R2.

## 3. SMS OTP

Chưa chọn nhà cung cấp: dùng `SMS_PROVIDER=disabled`, chưa mở đăng ký thật. Khi chọn Twilio:

- `SMS_PROVIDER=twilio`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- `TWILIO_MESSAGING_SERVICE_SID` hoặc `TWILIO_FROM`

Nhà cung cấp/sender phải được phép gửi tới Việt Nam; kiểm tra khả năng gửi, tài khoản, geo permissions và chi phí thực tế trong dashboard. Adapter chuyển 090… thành +8490… và gửi nội dung có mã thành viên. Production không có SMS mock hoặc mã OTP hiển thị.

Đặt `OTP_SECRET` ngẫu nhiên ít nhất 32 ký tự, ổn định giữa các lần deploy. Có thể tạo bằng Node crypto và lưu trực tiếp vào file/env riêng, không in vào chat. Đổi secret làm vô hiệu OTP đang chờ và đổi khóa rate-limit.

## 4. Vercel

1. Chọn/create project trong tài khoản Vercel. Framework **Next.js**, Node **24.x**, build `npm run build`; giữ mặc định Output Directory của Vercel, không đặt `dist`.
2. Điền các environment server từ `.env.example`: `DATABASE_URL`, `OTP_SECRET`, `APP_ORIGIN`, R2, SMS. Không đưa `MIGRATION_DATABASE_URL` vào Vercel. Không dùng tiền tố `NEXT_PUBLIC_` cho secret.
3. `APP_ORIGIN` là URL HTTPS chính xác của site, không có dấu `/` cuối. Nếu dùng domain mới, cập nhật và redeploy. Preview có URL khác phải dùng origin/environment riêng để đăng nhập; không cho phép wildcard toàn bộ vercel.app.
4. Upload qua Vercel CLI từ thư mục này: `npx vercel login`, `npx vercel link`, `npx vercel` để preview; sau khi kiểm tra, `npx vercel --prod`.

`vercel.json` chọn framework Next.js. Giao diện nằm ở `src/app/page.tsx`, layout/metadata ở `src/app/layout.tsx`; `/api/*` do `src/app/api/[[...path]]/route.ts` xử lý. Không dùng rewrite API hoặc fallback index.html của Vite. Preview/production nên dùng database/bucket tách riêng khi kiểm thử dữ liệu.

## 5. Tài khoản quản lý đầu tiên và nghiệm thu

Khi SMS hoạt động, người phụ trách đăng ký tài khoản bằng thông tin/SĐT thật và xác minh OTP. Cấp quyền cho **mã đã xác minh đúng người** bằng `npm run admin:promote -- PHxxxxx`, chạy với DATABASE_URL của project. Không dùng mật khẩu mẫu hoặc tài khoản mẫu local ở production.

Kiểm tra `/api/health`, đăng ký/đăng nhập/OTP, đăng nhập bằng SĐT dùng chung, đổi mật khẩu, profile, WebP upload/read, đăng ký lớp và quyền chéo tài khoản. Health `ready:false` khi SMS bị tắt. Kiểm tra log Vercel, schema Supabase và object R2 sau một lần lưu hồ sơ; chưa xác nhận triển khai thành công chỉ từ build local.

## Giới hạn còn lại

Chưa có quên mật khẩu/email, quản lý thêm lớp/phân quyền qua UI, nhắc bổ sung trường bắt buộc, pagination server và dọn ảnh orphan. **Đổi SĐT trên production đang bị chặn** vì chưa có bước xác minh số mới; cập nhật các trường khác vẫn hoạt động. Xác minh kênh mới cần hoàn tất trước khi mở thao tác thay số. Các kiểm thử adapter dùng DB nhúng và fake SMS/R2, không thay thế smoke test trên các dịch vụ thật.

## Tài liệu chính thức đã đối chiếu

- [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js)
- [Supabase database connections](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Cloudflare R2 với AWS SDK v3](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/)
- [Twilio Messages API](https://www.twilio.com/docs/messaging/api/message-resource)
