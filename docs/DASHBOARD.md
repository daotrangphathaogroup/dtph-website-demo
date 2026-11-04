# Dashboard quản lý

Tổng quan dành cho Dev/Admin/Manager và là trang mặc định sau đăng nhập. Public chỉ sử dụng đăng ký thông tin; tìm kiếm nhanh dành cho tài khoản quản lý; không thấy dữ liệu quản trị.

## Bố cục Tổng quan

1. **Bộ lọc dữ liệu**: một panel chứa Nhóm, Phường, Tổ, Độ tuổi, Năm đăng ký và Tháng đăng ký. Nút xóa lọc và làm mới nằm cùng tiêu đề. Năm/tháng dùng select, không còn dãy 12 nút tháng.
2. **Hiện trạng hồ sơ**: Tổng đã duyệt, ba chúng ngang hàng, và Chờ duyệt. Tổng có nhấn xanh; chờ duyệt có nhấn vàng. Nhấn thẻ nhóm để lọc/bỏ lọc. Không lặp cơ cấu nhóm dưới dạng donut hoặc thẻ nhóm kích thước khác nhau.
3. **Đăng ký chờ duyệt**: disclosure mở trực tiếp từ KPI; nằm trước biểu đồ để thao tác xử lý dễ tìm. Không có danh sách rút gọn thứ hai cạnh số liệu. Chỉ Admin/Dev được duyệt hoặc từ chối.
4. **Phân tích**: Đăng ký theo tháng và Phân bố huynh đệ là hai panel có tiêu đề/nút điều khiển/đường phân cách nhất quán. Giữ đường/cột và phường/tuổi/giới tính.
5. **Danh sách huynh đệ**: vùng riêng có tiêu đề, số hồ sơ đã duyệt và bảng đầy đủ. Giữ tìm kiếm, sắp xếp, cột, mật độ, lọc, chọn dòng, Excel và phân trang.

Bố cục thích ứng theo bề rộng thực tế của vùng Tổng quan (container query), bao gồm khi có cả hai sidebar. Dưới 800px, Tổng và Chờ duyệt ở hàng đầu; ba chúng ở hàng kế tiếp; biểu đồ xếp dọc. Các thẻ nhóm luôn cùng độ rộng và căn số liệu cùng hàng.

## Dữ liệu và bộ lọc

Sáu bộ lọc áp dụng đồng thời cho KPI, biểu đồ, hồ sơ chờ duyệt và danh sách. Tất cả năm/tháng nghĩa là mọi thời điểm. Thời gian dùng ngày gửi theo Asia/Ho_Chi_Minh, fallback ngày tham gia cho hồ sơ cũ. Thiếu ngày sinh/phường/Tổ giữ nhóm chưa có dữ liệu, không đoán giá trị.

Tổng huynh đệ và các tỷ lệ nhóm chỉ tính hồ sơ đã duyệt; chờ duyệt được tách riêng. Biểu đồ đường có hai chuỗi đã duyệt/chờ duyệt trên cùng trục; số liệu không thay đổi qua các đoạn cong. Khi dữ liệu trống, hiển thị 0 và trạng thái trống; không tạo dữ liệu vào database.

Trang từng chúng giữ nguyên chế độ Danh sách / Chờ duyệt / Thống kê và biểu đồ cơ cấu theo Tổ. Không thêm chế độ chuyển bảng tổng hợp cho Tổng quan. Manager chỉ xem; Admin/Dev chỉnh sửa. API và quyền truy cập không đổi.

## Kiểm chứng

18 kiểm tra liên quan đến render, dashboard và biểu đồ; kiểm tra trình duyệt trên dữ liệu local theo chế độ đọc và fixture cô lập. Đã kiểm tra lọc/reset/chọn nhóm, review disclosure, keyboard tooltip, đổi biểu đồ, bảng/CSV/hồ sơ, trạng thái trống và màn hình 320–1920px. Ảnh thử lưu tại `.local/audits/overview-layout/`.

Dữ liệu demo local được tạo bằng quy trình riêng `npm run db:demo` khi dừng server. Lần sửa giao diện này không tạo, xóa hoặc nhập dữ liệu.

## Chuyển động khi mở trang

Áp dụng nhịp dựng từ video tham khảo: bộ lọc và KPI xuất hiện nối tiếp (220–280ms, stagger 40ms); số KPI nội suy trình bày trong 600ms; khung biểu đồ hiện trước, đường/vùng màu được hé lộ đồng thời trong 700ms. Cột tăng từ gốc, thanh phân bố hé lộ theo chiều ngang. Trục, legend và dữ liệu thực giữ nguyên. Bảng hiện cả vùng, không chạy animation từng hàng.

`useDashboardEntrance` chạy một lần khi dashboard được mount; Thống kê từng chúng có lần mở đầu riêng, không lặp khi đổi chế độ. Lọc, đổi dữ liệu hoặc tương tác chuột/bàn phím kết thúc hiệu ứng ngay; refresh nền không replay. Giá trị thật luôn có sẵn riêng cho công cụ hỗ trợ, các frame đếm số chỉ là phần trình bày. Khi tab bị ẩn hoặc bật `prefers-reduced-motion`, số/biểu đồ chốt ngay trạng thái cuối. Frame, timer và listener được hủy khi kết thúc/unmount.

Token motion nằm trong `tokens.css`, quy tắc nằm trong `motion.css`. Không thêm thư viện animation, video nền, WebGL, hiệu ứng quét chéo hoặc chuyển động lên topbar/sidebar. Đã kiểm tra browser với fixture cô lập: đếm số, không replay khi lọc/refresh/đổi chế độ, tooltip bàn phím, reduced motion và màn hình 320–1440px; không ghi dữ liệu thật.
