# Dashboard quản lý

Trang chủ công khai giữ nội dung giới thiệu và đăng ký. Trang Tổng quan và dashboard ba chúng chỉ hiển thị sau khi đăng nhập Dev/Admin/Manager. Sau đăng nhập, trang quản lý mặc định là Tổng quan.

Bộ lọc nhóm/phường/Tổ/độ tuổi/năm/tháng áp dụng đồng thời cho các thẻ thống kê, biểu đồ, hồ sơ chờ duyệt và danh sách. Tổng tháng và Năm “Tất cả” nghĩa là mọi thời điểm; có thể chọn riêng năm hoặc tháng. Thống kê tháng dùng ngày gửi đăng ký theo Asia/Ho_Chi_Minh; hồ sơ cũ không có thời điểm gửi sẽ dùng Ngày tham gia. Tuổi tính theo ngày sinh đầy đủ và ngày hiện tại tại Việt Nam. Thiếu dữ liệu được gom vào nhóm “Chưa có…”, không gán tuổi/phường/Tổ giả định.

Số liệu chính và biểu đồ chỉ đếm hồ sơ đã duyệt. Hồ sơ chờ duyệt được đếm riêng, không gộp vào tổng. Khi database trống, thẻ/biểu đồ hiển thị 0 và thông báo chưa có dữ liệu; không thêm dữ liệu minh họa vào database.

Dashboard tổng hiển thị cơ cấu ba chúng. Dashboard từng chúng giới hạn dữ liệu đúng nhóm đó, thống kê từng Tổ và biểu đồ phân bố theo Tổ. Cả bốn trang có biểu đồ phường/độ tuổi/giới tính và đăng ký theo tháng.

Danh sách tổng hợp có tìm kiếm tên/pháp danh/ID, sắp xếp, phân trang, tải CSV theo bộ lọc và từ khóa hiện tại. Trang từng chúng (hoặc khi chọn riêng một nhóm ở dashboard tổng) có thêm chế độ Bảng dữ liệu để dùng các cột hồ sơ đầy đủ, tùy chỉnh độ rộng/cột, bộ lọc theo trường và xuất CSV chi tiết. Tìm kiếm/lọc nội bộ bảng chỉ áp dụng cho danh sách đó.

Manager xem hồ sơ. Admin/Dev có thêm chỉnh sửa và duyệt/từ chối. API tiếp tục kiểm tra quyền. Nút làm mới và đồng bộ nền 30 giây dùng cùng bootstrap hiện có.

## Dữ liệu thử local

Tổng quan nằm dưới nhãn Hồ sơ huynh đệ, trước ba trang chúng. Không còn trang Cấu hình đăng ký hoặc API thay đổi trường bắt buộc. Quản lý tài khoản vẫn dành riêng cho Dev.

Dừng server local, chạy `npm run db:demo`, rồi khởi động lại để thêm 360 hồ sơ giả đã duyệt (thiếu nhi 90, thanh niên 120, Đạo tràng 150) và 12 hồ sơ chờ duyệt. Script không truy cập Supabase/R2, không xóa hồ sơ có sẵn, không tạo tài khoản quản trị, và không thêm trùng khi chạy lại. Ảnh và thông tin đều là dữ liệu mẫu; dashboard hiển thị nhãn để nhận biết. Thông tin Tình trạng/Vị trí tiếp tục để trống.
