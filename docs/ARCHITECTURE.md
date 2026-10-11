# Kiến trúc cổng quản trị — 11/10/2026

## Hai khu vực độc lập

Public: trang chủ và ba trang điền form theo nhóm sinh hoạt, không có tài khoản huynh đệ. Nội dung và trường biểu mẫu chưa được chốt nên chỉ dựng các route/khung trang, chưa mở endpoint nhận đăng ký. Sau khi chốt form, endpoint tiếp nhận thông tin sẽ tạo hồ sơ/phiếu đăng ký, tuyệt đối không tạo tài khoản đăng nhập.

Staff: nhân sự có tên đăng nhập/mật khẩu riêng. Quản lý tổng tạo tài khoản, quản lý toàn bộ hồ sơ và lớp học; quản lý lớp chỉ nhận hồ sơ học viên và thao tác trong lớp được phân công. Mọi quyền được kiểm tra ở API, không dựa vào việc ẩn nút trên giao diện.

## Dữ liệu

- `members`: hồ sơ huynh đệ cũ được giữ nguyên, chỉ là bản ghi dữ liệu, không phải tài khoản.
- `classes`, `enrollments`: lớp và danh sách học viên hiện có được giữ nguyên.
- `staff_accounts`: định danh nhân sự, username unique, display_name, password_hash, role, active.
- `staff_class_managers`: phân công lớp cho nhân sự.
- `staff_sessions`: phiên quản trị opaque, lưu hash, hết hạn 8 giờ.
- `registration_fields`: cấu hình quản lý hồ sơ tạm, không còn mật khẩu/người giới thiệu qua mã. Sau này tách schema biểu mẫu theo từng nhóm khi có đặc tả.
- Tổ sinh hoạt tiếp tục suy ra từ phường theo cấu hình chung.

ID hồ sơ cũ chỉ giữ làm khóa nội bộ để không phá liên kết dữ liệu. Không dùng làm tên đăng nhập, không hiển thị mã huynh đệ trên giao diện. Schema trường hồ sơ sẽ được thay đổi sau khi người dùng cung cấp yêu cầu.

Migration `202610110001_staff_portal.sql` sao chép một lần các tài khoản quản lý đang hoạt động từ schema cũ sang staff_accounts, giữ mật khẩu hash và phân công lớp. Không chuyển tài khoản member. Bảng legacy accounts/sessions/challenges/grants/Google và migration lịch sử được giữ để không xóa dữ liệu khi chưa chốt chuyển đổi; runtime không còn đọc chúng và các API cũ trả 404. Không có luồng OTP, email/SMS login, OAuth hay công tắc xác thực.

## Bảo vệ quản trị

Scrypt mật khẩu; cookie ph_staff_session HttpOnly, Secure trong production, SameSite=Strict; rate limit theo IP/tên đăng nhập lưu PostgreSQL; POST/PATCH/PUT/DELETE kiểm tra Origin. Các bảng staff production bật RLS và thu hồi quyền anon/authenticated. Phiên huynh đệ cũ không thể vào khu vực quản trị.

## Cấu trúc

`src/app/` chứa route thực; public pages không cần gọi database để hiện trang chủ. `src/components/PublicShell.tsx` là vỏ trang công khai. `src/App.tsx` là workspace quản trị hiện có, được mở tại /quan-tri. Backend được Next Route Handler bridge tới `server/backend.mjs`. Bố cục chi tiết của cả hai khu vực còn chờ yêu cầu tiếp theo.
