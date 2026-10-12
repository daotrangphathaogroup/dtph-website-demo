# Kiến trúc — 11/10/2026

## Trang chính dùng chung

`src/App.tsx` mở tại `/`, thanh bên hiện theo phiên: public có Tổng quát/Tìm kiếm nhanh; staff thêm ba nhóm; Dev thêm hai mục cấu hình. Tổng quát có liên kết Đăng nhập quản trị tới /quan-tri khi chưa đăng nhập; khách không thấy menu tài khoản hoặc các mục quản lý. Mục đăng ký trong Tổng quát dẫn tới `/dang-ky-thong-tin` và ba biểu mẫu con có schema riêng và nhận dữ liệu đăng ký. Không tạo tài khoản cho người điền form.

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

## Biểu mẫu và giá trị mở rộng — 12/10/2026

registration_schemas có group_id PK, version và fields JSONB chứa key/label/type/required/options/staffOnly. Youth/congregation được seed hai bộ độc lập, không tham chiếu chung một cấu hình. Mọi record members chỉ có một group và profile_data JSONB phù hợp schema nhóm; server từ chối key của nhóm khác hoặc key staffOnly ở public. Bản ghi lưu profile_version tại thời điểm gửi/lưu. Trường bị loại khỏi schema trong tương lai có thể ẩn khỏi UI nhưng vẫn giữ giá trị cũ để phục hồi. Chưa có UI thêm/xóa trường.

Core columns vẫn giữ cho quan hệ/tìm kiếm: id/name/phone/address/avatar/group/joined. Email/birthday/area/referrer cũ giữ để tránh mất lịch sử; public mới không nhận các trường ngoài schema. birthYear/clubSinceYear/attendance2026/team lưu số nguyên, studyDate lưu YYYY-MM-DD và UI tự hiển thị thứ; các trường khác chuỗi. Children studentCode do người điền nhập, tùy chọn, không dùng đăng nhập; hồ sơ thiếu nhi cũ backfill bằng ID hiện có. Mã số chưa có ràng buộc unique vì chưa có quy định về cấp mã.

Form công khai trẻ em chỉ có 11 trường đầu; 3 trường cuối (attendance2026/studyDate/remarks) chỉ Admin/Dev ghi. Manager xem hồ sơ đủ trường nhưng không ghi. Staff sửa dữ liệu và ghi audit trong cùng transaction. API yêu cầu mutation Origin hợp lệ, rate limit, validation ảnh/năm/giới tính/số điện thoại/Tổ. Public đăng ký không cần mật khẩu, không tạo staff/member account và không trả dữ liệu hồ sơ. registration_submissions giữ request_id + fingerprint để xử lý retry đã thành công mà không tạo hồ sơ trùng.

Migration 006/202610120001_group_profiles.sql thêm JSONB/schema/index và backfill một lần. Các giá trị mới không bị ghi đè khi chạy lại migration. Bảng schema/submission production bật RLS và revoke anon/authenticated; Next server dùng kết nối PG riêng.

## Duyệt đăng ký — 12/10/2026

Đăng ký không có phiên nhân sự hợp lệ lưu trạng thái pending. Trong ba tab quản lý, badge hiển thị số đăng ký chờ duyệt và bảng chờ có nút xem hồ sơ. Chỉ Admin/Dev duyệt, Manager chỉ xem. Hồ sơ pending không nằm trong danh sách chính, CSV danh sách chính, tìm kiếm công khai hoặc đăng ký lớp. Khi duyệt, trạng thái approved, lưu approved_at/approved_by và audit trong transaction; duyệt lại không tạo audit trùng.

Phiên Manager/Admin/Dev hợp lệ khi gửi form được ghi nhận approved ngay. Quyền lấy từ cookie server, không tin role/status/actor trong payload. Retry giữ trạng thái của yêu cầu gốc, không tự nâng pending thành approved khi gửi lại dưới phiên Manager. Màn hình thành công phân biệt chờ duyệt/đã ghi nhận. UI quản lý làm mới thông báo mỗi 30 giây khi tab hiện và khi focus lại.

Migration 007/202610120002_registration_approval.sql giữ hồ sơ hiện có ở approved và chỉ áp dụng chờ duyệt cho các đăng ký công khai mới. Không có thao tác từ chối/xóa vì chưa được yêu cầu.
