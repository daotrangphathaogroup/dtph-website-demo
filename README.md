# Đạo Tràng Phật Hào — Cổng thông tin và quản trị

Kiến trúc từ 11/10/2026 hướng đến nhân sự quản lý Đạo Tràng. Next.js App Router, TypeScript, backend Node.js; PostgreSQL local bằng PGlite, production bằng Supabase, ảnh private trên R2.

## Trang công khai

- `/`: trang chủ, luôn mở trực tiếp; nội dung sẽ chốt sau.
- `/dang-ky-thong-tin`: lựa chọn Chúng thiếu nhi / Chúng thanh niên / Đạo tràng.
- `/dang-ky-thong-tin/chung-thieu-nhi`
- `/dang-ky-thong-tin/chung-thanh-nien`
- `/dang-ky-thong-tin/dao-trang`

Ba trang con hiện là khung biểu mẫu riêng. Chưa có form gửi dữ liệu vì các trường sẽ được cung cấp sau. Không có tài khoản, mật khẩu, mã đăng nhập hay xác thực dành cho người điền form.

## Trang chính và quyền

Trang `/` dùng chung thanh bên. Công khai chỉ hiện Tổng quát / Tìm kiếm nhanh, có mục Đăng ký thông tin trong Tổng quát. Không hiển thị nút quản trị, đăng nhập hoặc tài khoản cho khách.

- `/quan-tri`: đăng nhập quản trị bằng ID + mật khẩu; `/quan-tri/dang-nhap` giữ tương thích.
- Đăng nhập xong quay về `/`, hiển thị thêm Chúng thiếu nhi / Chúng thanh niên / Đạo tràng.
- Manager xem hồ sơ cả ba nhóm, không chỉnh sửa.
- Admin xem/chỉnh sửa hồ sơ, không tạo/xóa/đặt lại mật khẩu tài khoản khác.
- Dev có toàn bộ quyền, thêm Cấu hình đăng ký / Cấu hình nhà phát triển. Quản lý tài khoản và đổi mật khẩu nằm trong menu góc phải, không cần trang riêng.
- Dev tạo Admin/Manager bằng ID (chữ/số, 1–40 ký tự) + mật khẩu, danh sách không chứa mật khẩu/hash. Dev đặt mật khẩu mới hoặc xóa tài khoản; Admin/Manager chỉ đổi mật khẩu của mình bằng mật khẩu hiện tại.

Tài khoản Dev duy nhất khai báo trong `server/dev-account.mjs`: ID `dev`, mật khẩu **ban đầu** `1@345678`. Backend tạo một lần, lưu scrypt hash và không đặt lại mật khẩu khi khởi động/redeploy. Đổi mật khẩu qua menu tài khoản sau khi đăng nhập. Không cho tạo thêm/xóa Dev; database có unique index giới hạn một Dev.

Tài khoản quản trị ở `staff_accounts`, độc lập với hồ sơ `members`. Không có tài khoản huynh đệ, OTP, SMS/email login, Google hoặc Supabase Auth. Tìm kiếm công khai chỉ trả họ tên/nhóm, không trả liên hệ hoặc hồ sơ chi tiết.

## Local

```sh
npm install
npm run dev
```

Mở http://127.0.0.1:5173. Database giữ trên `.local/postgres`, ảnh ở `.local/avatars`; không reset dữ liệu.

Database mới chỉ tự tạo Dev; Dev tạo các tài khoản nhân sự bằng giao diện. Database cũ giữ hồ sơ và tài khoản nhân sự đã chuyển ở migration trước (`admin-1` / `manager-1`…); mật khẩu không thay đổi. Quyền `class_manager` chuyển thành `manager`, chỉ xem toàn bộ hồ sơ.

```sh
npm test
npm run build
```

Xem [kiến trúc](docs/ARCHITECTURE.md) và [triển khai](docs/DEPLOYMENT.md). Mô hình dữ liệu huynh đệ hiện giữ để chờ yêu cầu mới, không tự sửa/xóa dữ liệu cũ.
