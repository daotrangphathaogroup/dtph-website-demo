# Kiến trúc — 11/10/2026

## Trang chính dùng chung

`src/App.tsx` mở tại `/`, thanh bên hiện theo phiên: public có Tổng quát/Tìm kiếm nhanh; staff thêm ba nhóm; Dev thêm hai mục cấu hình. Khách không thấy liên kết hoặc UI tài khoản. Mục đăng ký trong Tổng quát dẫn tới `/dang-ky-thong-tin` và ba biểu mẫu con đang chờ đặc tả. Không tạo tài khoản cho người điền form.

`/quan-tri` là trang đăng nhập riêng, đăng nhập xong trở về `/`. Menu tài khoản góc phải chứa đổi mật khẩu/đăng xuất, Dev thêm quản lý tài khoản ngay trong trang chính. URL /quan-tri/dang-nhap giữ tương thích; /quan-tri/tai-khoan chuyển về trang chính.

## Quyền ở server

- Dev: singleton khai báo server-only, toàn quyền hồ sơ, cấu hình, tạo/list/reset/delete Admin/Manager. Không thể tạo Dev qua API hoặc xóa Dev; partial unique index ngăn thêm Dev.
- Admin: xem/chỉnh sửa hồ sơ của mọi nhóm; không có quyền tài khoản khác hoặc cấu hình Dev.
- Manager: xem toàn bộ danh sách/hồ sơ của ba nhóm, không ghi hồ sơ, đăng ký lớp hoặc cấu hình.
- Public: bootstrap không có dữ liệu cá nhân, quick search giới hạn 20 tên/nhóm, không trả ID/địa chỉ/điện thoại/email.

Mọi API ghi kiểm tra quyền và Origin. Tài khoản mới chỉ cần ID chữ/số và mật khẩu, không họ tên hay phân công lớp. ID mới chuẩn hóa lowercase và unique. Username cũ có dấu gạch giữ khả năng đăng nhập để không khóa người quản lý hiện có.

## Mật khẩu và phiên

Scrypt hash, không đọc lại mật khẩu/hash từ API. Dev chỉ đặt mật khẩu mới. Mọi staff đổi mật khẩu riêng phải nhập mật khẩu hiện tại; đổi/reset mật khẩu thu hồi toàn bộ phiên. Xóa tài khoản cũng thu hồi phiên, giữ hồ sơ huynh đệ và audit log.

Dev `dev` có mật khẩu ban đầu khai báo server/dev-account.mjs, tạo một lần và không ghi đè hash đã đổi khi redeploy. Cookie ph_staff_session HttpOnly, Secure production, SameSite Strict, 8 giờ. Rate limit lưu database, kiểm tra Origin cho mọi mutation. Bảng staff bật RLS, revoke anon/authenticated.

## Dữ liệu và migration

members/classes/enrollments hiện giữ nguyên chờ đặc tả. ID huynh đệ cũ chỉ làm khóa nội bộ, không dùng đăng nhập và không hiển thị. Tổ vẫn suy ra từ phường.

004 chuyển các quản lý cũ thành staff một lần; 005 đổi class_manager thành manager và thêm Dev/singleton index. Cloud dùng hai migration 202610110001_staff_portal.sql và 202610110002_staff_roles.sql. Không xóa hồ sơ hoặc mật khẩu đã có. Bảng legacy member auth và staff_class_managers được giữ để bảo toàn dữ liệu; chúng không quyết định quyền Manager nữa. Các API member auth/OTP/Google đã gỡ.
