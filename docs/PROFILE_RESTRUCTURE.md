# Cấu trúc hồ sơ theo bảng ĐHPH

Nguồn: file Excel “Bảng các thông tin của từng chúng - ĐHPH”, hai sheet “Tổng quan” (B1:F23) và “Đăng ký thông tin” (B1:O17), nhận ngày 27/10/2026. Không nhập danh sách từ thư mục DATA trong đợt thay đổi này.

## Trường hồ sơ hiện tại (05/11/2026, schema 13)

Cả ba nhóm dùng `name`, `dharmaName`, `gender`, `birthday`, `address`, `team`, `avatar`, `phone`, `relativePhone`, `introducedBy`, `notes`, `status`, `occupation`, `caregiver`. `id` và `joined` do hệ thống tạo. `caregiver` là “HĐ chăm sóc”, chọn huynh đệ đã duyệt và chỉ do quản lý cập nhật.

Đã bỏ hoàn toàn `hometown` (Quê quán) và `job` (Nơi công tác/Trường học) khỏi schema/API. Migration 013 xóa riêng hai khóa này trong `members.profile_data`, giữ nguyên hồ sơ và các giá trị khác. API từ chối ghi hai khóa đã bỏ.

Chúng thiếu nhi có thêm `parentName`, `personality`, `nickname`, `schoolClass`. `schoolClass` (“Lớp”) chọn chuỗi `1`–`12` hoặc `Không`; để trống khi chưa cập nhật. Nghề nghiệp và người giới thiệu vẫn lưu trong hồ sơ thiếu nhi, quản lý vẫn có thể xem/chỉnh sửa trong hồ sơ; hai trường này ẩn khỏi bảng dữ liệu, bộ lọc cột và đăng ký công khai. Trong bảng tổng hợp nhiều nhóm, giá trị hai trường này của dòng thiếu nhi cũng để trống.

Chúng thanh niên và Đạo tràng có `position`, hiển thị “Vai trò”: Tổ điều hành, Tổ trưởng, Tổ phó, Thành viên, Huynh đệ mới, Thành viên không thường xuyên, Học sinh. Giữ nguyên khóa dữ liệu `position`; các giá trị cũ ngoài danh sách vẫn được hiển thị và giữ khi sửa trường khác. Chọn vai trò mới chỉ chấp nhận danh sách quy định.

`status` hiển thị “Trạng thái” với bốn mức hoạt động, chỉ dành cho quản lý. `relativePhone` hiển thị SĐT PH cho thiếu nhi và SĐT Người thân cho hai nhóm còn lại.

## Biểu mẫu công khai

Trang đăng ký chính tự xác định nhóm từ ngày sinh: dưới 16 là thiếu nhi, 16–40 là thanh niên, trên 40 là Đạo tràng. Bốn bước đầu gồm thông tin cơ bản, khu vực, liên lạc và ảnh. Bước cuối của thiếu nhi gồm lớp và biệt danh, không có người giới thiệu; bước cuối của hai nhóm còn lại là người giới thiệu. Các trang đăng ký riêng dùng schema tương ứng với cùng quy tắc ẩn trường.

Bắt buộc: hình ảnh, họ tên, giới tính, ngày sinh, nơi ở và tổ; SĐT cá nhân bắt buộc thêm cho hai nhóm người lớn. Ghi chú, Trạng thái, ID, Ngày tham gia, HĐ chăm sóc và Vai trò không hiển thị ở đăng ký công khai.

Migration local và Supabase đã áp dụng ngày 05/11/2026, không xóa hồ sơ. Thay đổi giao diện/backend được triển khai từ mã nguồn cùng schema 13.

## Ảnh và người liên quan

Ảnh có khung cắt 3×4, điều chỉnh phóng to/vị trí, nén WebP 360×480 ở cả trình duyệt và server. Tải ảnh lên hoặc dùng nút chụp ảnh trên thiết bị hỗ trợ capture. Chỉ gửi ảnh khi gửi biểu mẫu; bản xem trước ở trình duyệt chưa lưu vào database.

Người giới thiệu và HĐ Chăm sóc lưu ID trong một khóa cho mỗi quan hệ, không lưu tên nhập tự do. Danh sách chọn có ảnh, tên, nhóm và ID để phân biệt trùng tên; chỉ hiển thị hồ sơ đã duyệt. API công khai này chỉ trả các thông tin định danh nói trên, không trả SĐT/ngày sinh/địa chỉ. Ảnh của hồ sơ chờ duyệt vẫn riêng tư.

## Khởi tạo và làm sạch

Migrations cập nhật schema một lần, không tự xóa dữ liệu khi khởi động lại. Dữ liệu demo chỉ còn ở fixture kiểm thử và không đóng gói vào website.

Lệnh bảo trì được tách riêng ở `scripts/reset-member-data.mjs`. Lệnh chỉ chạy khi chỉ định rõ `--local --execute` hoặc `--cloud --execute`. Nó sao lưu JSON và ảnh dưới `.local/backups/`, xóa hồ sơ, liên kết/đăng ký/lớp học và dữ liệu auth thành viên cũ, giữ tài khoản quản trị/mật khẩu. Không commit bản sao lưu hay file môi trường.

Supabase dùng migration `202610270001_workbook_profiles.sql`; script reset cloud áp dụng schema và xóa dữ liệu trong cùng giao dịch sau khi sao lưu thành công. Chứng chỉ CA đúng có thể truyền qua `DATABASE_SSL_CA_FILE`; không tắt xác minh TLS.

Sau khi cập nhật database cloud, cần triển khai phiên bản mã nguồn mới lên Vercel để form và API nhận cùng cấu trúc. Việc cập nhật Supabase không tự triển khai Vercel.
