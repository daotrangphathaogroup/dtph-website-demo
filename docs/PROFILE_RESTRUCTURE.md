# Cấu trúc hồ sơ theo bảng ĐHPH

Nguồn: file Excel “Bảng các thông tin của từng chúng - ĐHPH”, hai sheet “Tổng quan” (B1:F23) và “Đăng ký thông tin” (B1:O17), nhận ngày 27/10/2026. Không nhập danh sách từ thư mục DATA trong đợt thay đổi này.

## Trường dùng chung

Cả ba nhóm dùng cùng khóa dữ liệu cho thông tin chung: `name`, `dharmaName`, `gender`, `birthday`, `address`, `team`, `hometown`, `avatar`, `phone`, `introducedBy`, `notes`, `status`, `occupation`, `job`, `relativePhone`. `id` và `joined` do hệ thống tạo, không cho ghi đè qua biểu mẫu/API.

Chúng thiếu nhi thêm `parentName`, `personality`, `nickname`. Chúng thanh niên và Đạo tràng thêm `caregiver`, `position`; mỗi nhóm vẫn có cấu hình riêng.

`job` là một trường duy nhất. Khi nghề nghiệp là Học sinh/Sinh viên, giao diện và cột xuất theo nhóm hồ sơ đó dùng tên Trường học. Nếu xuất hồ sơ có nhiều loại nghề nghiệp, cột mang tên Nơi công tác / Trường học. Chọn Không sẽ xóa và khóa giá trị này. Nghề nghiệp Khác có thể ghi rõ, lưu trong cùng trường nghề nghiệp.

`relativePhone` hiển thị SĐT PH ở Chúng thiếu nhi, SĐT Người thân ở hai nhóm còn lại, gồm cả tiêu đề CSV.

## Biểu mẫu công khai

Theo đúng thứ tự sheet 2: Hình ảnh, Họ và tên, Pháp danh, Giới tính, Ngày sinh, Nghề nghiệp, Trường học/Nơi công tác, Nơi ở hiện tại, Tổ, Quê quán, SĐT Cá nhân, [Họ và tên PH ở Chúng thiếu nhi], SĐT PH/SĐT Người thân, Người giới thiệu.

Bắt buộc ở cả ba nhóm: hình ảnh, họ tên, giới tính, ngày sinh, nơi ở hiện tại, tổ. SĐT cá nhân bắt buộc thêm ở Chúng thanh niên và Đạo tràng. Những trường còn lại không bắt buộc. Trang/API Cấu hình đăng ký đã được bỏ theo yêu cầu; quy tắc biểu mẫu nằm trong schema mã nguồn và migration.

Ghi chú, Tình trạng, ID, Ngày tham gia và các trường quản lý riêng không xuất hiện trên biểu mẫu công khai. Tình trạng/Vị trí khởi đầu trống, chưa áp đặt danh sách lựa chọn theo xác nhận của người dùng.

## Ảnh và người liên quan

Ảnh có khung cắt 3×4, điều chỉnh phóng to/vị trí, nén WebP 360×480 ở cả trình duyệt và server. Tải ảnh lên hoặc dùng nút chụp ảnh trên thiết bị hỗ trợ capture. Chỉ gửi ảnh khi gửi biểu mẫu; bản xem trước ở trình duyệt chưa lưu vào database.

Người giới thiệu và HĐ Chăm sóc lưu ID trong một khóa cho mỗi quan hệ, không lưu tên nhập tự do. Danh sách chọn có ảnh, tên, nhóm và ID để phân biệt trùng tên; chỉ hiển thị hồ sơ đã duyệt. API công khai này chỉ trả các thông tin định danh nói trên, không trả SĐT/ngày sinh/địa chỉ. Ảnh của hồ sơ chờ duyệt vẫn riêng tư.

## Khởi tạo và làm sạch

Migrations cập nhật schema một lần, không tự xóa dữ liệu khi khởi động lại. Dữ liệu demo chỉ còn ở fixture kiểm thử và không đóng gói vào website.

Lệnh bảo trì được tách riêng ở `scripts/reset-member-data.mjs`. Lệnh chỉ chạy khi chỉ định rõ `--local --execute` hoặc `--cloud --execute`. Nó sao lưu JSON và ảnh dưới `.local/backups/`, xóa hồ sơ, liên kết/đăng ký/lớp học và dữ liệu auth thành viên cũ, giữ tài khoản quản trị/mật khẩu. Không commit bản sao lưu hay file môi trường.

Supabase dùng migration `202610270001_workbook_profiles.sql`; script reset cloud áp dụng schema và xóa dữ liệu trong cùng giao dịch sau khi sao lưu thành công. Chứng chỉ CA đúng có thể truyền qua `DATABASE_SSL_CA_FILE`; không tắt xác minh TLS.

Sau khi cập nhật database cloud, cần triển khai phiên bản mã nguồn mới lên Vercel để form và API nhận cùng cấu trúc. Việc cập nhật Supabase không tự triển khai Vercel.
