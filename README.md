# Đạo Tràng Phật Hào — Cổng thông tin và quản trị

Kiến trúc từ 11/10/2026 hướng đến nhân sự quản lý Đạo Tràng. Next.js App Router, TypeScript, backend Node.js; PostgreSQL local bằng PGlite, production bằng Supabase, ảnh private trên R2.

## Trang công khai

- `/`: trang chủ, luôn mở trực tiếp; nội dung sẽ chốt sau.
- `/dang-ky-thong-tin`: lựa chọn Chúng thiếu nhi / Chúng thanh niên / Đạo tràng.
- `/dang-ky-thong-tin/chung-thieu-nhi`
- `/dang-ky-thong-tin/chung-thanh-nien`
- `/dang-ky-thong-tin/dao-trang`

Ba trang con hiện là khung biểu mẫu riêng. Chưa có form gửi dữ liệu vì các trường sẽ được cung cấp sau. Không có tài khoản, mật khẩu, mã đăng nhập hay xác thực dành cho người điền form.

## Quản trị

- `/quan-tri/dang-nhap`: tên đăng nhập + mật khẩu dành riêng cho nhân sự.
- `/quan-tri`: quản lý hồ sơ và lớp học hiện có.
- `/quan-tri/tai-khoan`: quản lý tổng tạo tài khoản và phân công lớp; không tự đăng ký quyền quản trị công khai.

Tài khoản quản trị ở `staff_accounts`, độc lập với hồ sơ `members`. Các API auth huynh đệ/OTP/Google và thư viện gửi SMS đã gỡ. Không dùng Supabase Auth.

## Local

```sh
npm install
npm run dev
```

Mở http://127.0.0.1:5173. Database giữ trên `.local/postgres`, ảnh ở `.local/avatars`; không reset dữ liệu.

Database **mới** có tài khoản mẫu `admin` và `manager`, mật khẩu `PhatHao@123`. Database **đã có tài khoản quản lý từ phiên bản cũ**: migration giữ mật khẩu hiện tại và chuyển tên đăng nhập thành `admin-1`, `admin-2`… hoặc `manager-1`, `manager-2`… theo thứ tự mã nội bộ cũ. Người dùng thông thường không được chuyển sang tài khoản quản trị.

```sh
npm test
npm run build
```

Xem [kiến trúc](docs/ARCHITECTURE.md) và [triển khai](docs/DEPLOYMENT.md). Mô hình dữ liệu huynh đệ hiện giữ để chờ yêu cầu mới, không tự sửa/xóa dữ liệu cũ.
