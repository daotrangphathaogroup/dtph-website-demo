# Dashboard quản lý

Tổng quan dành cho Dev/Admin/Manager và là trang mặc định sau đăng nhập. Public chỉ sử dụng đăng ký thông tin; tìm kiếm nhanh dành cho tài khoản quản lý; không thấy dữ liệu quản trị.

## Bố cục Tổng quan

1. **Hiện trạng hồ sơ**: bốn thẻ bố cục mới gồm tổng và ba chúng, nền pastel nhấn ở góc. Thanh tổng biểu thị tỷ trọng thực. Nút chờ duyệt nằm cùng tiêu đề và mở workflow duyệt hiện có.
2. **Bộ lọc gọn**: Nhóm/Năm/Tháng luôn hiển thị; Phường/Tổ/Tuổi trong “Bộ lọc thêm”, đóng bằng click ngoài/Escape. Nhãn lọc có thể xóa riêng.
3. **Phân tích Atlas**: grid 12 cột bất đối xứng, biến đổi theo bề rộng nội dung thực. Diễn biến đăng ký chiếm vùng lớn cạnh cơ cấu vòng quỹ đạo; địa bàn cạnh chăm sóc; thẻ điểm tốt cạnh tổ; cơ cấu thế hệ ở hàng cuối.
4. **Biểu đồ thiết kế riêng** (`AtlasCharts.tsx`): đường cong 3 chúng trên vùng tổng, 3 vòng phần trăm độc lập, thanh xếp chồng theo phường, waffle 100 ô chăm sóc, ma trận bong bóng thẻ × chúng (diện tích tỷ lệ số người), ô số kèm tick theo tổ và cánh bướm tuổi × giới tính. Legend/đơn vị/số thực luôn rõ. Tooltip tháng dùng pointer, focus, phím mũi tên/Escape và chạm; giới hạn trong viewport.
5. **Danh sách huynh đệ**: bảng đầy đủ phía dưới, giữ nguyên tìm kiếm/sắp xếp/lọc cột/Excel/phân trang, hồ sơ và quyền truy cập. Thống kê từng chúng giữ các chế độ quản lý hiện có.

Màu mỗi chúng thống nhất giữa KPI, vòng quỹ đạo, chuỗi tháng, địa bàn và phân công chăm sóc. DNA từ ba ảnh người dùng nằm trong `docs/design-dna/atlas-dashboard/`; khung màu trung tính lấy ảnh 2 làm chính, các motif bố cục/biểu đồ tham khảo ảnh 1 và 3.

## Quy tắc phân tích

`overviewAnalytics` nhận đúng tập hồ sơ đã lọc, không tạo dữ liệu mẫu. “Tình trạng” là thẻ điểm tốt chọn nhiều giá trị, không còn là phân loại hoạt động. Biểu đồ đếm số người mang từng thẻ theo 3 chúng; một người chỉ đếm một lần trong mỗi thẻ, có thể có mặt ở nhiều hàng. Số người đã gắn/chưa gắn thẻ là số hồ sơ duy nhất; không cộng số của các hàng để suy ra tổng. Giá trị hoạt động cũ không tự coi là điểm tốt. HĐ chăm sóc tính theo liên kết đã lưu, không suy ra số lần tương tác hay hiệu quả chăm sóc.

Tuổi tính theo ngày hiện tại, độc lập với nhóm sinh hoạt được lưu. Ngày sinh/giới tính/tổ/phường chưa rõ luôn có nhóm riêng. Top 6 phường có chú thích số người được bao phủ trên tổng. Biểu đồ tháng dùng ngày đăng ký theo múi giờ Việt Nam; nếu xem tất cả năm, ghi rõ cộng cùng tháng giữa các năm, không ngụ ý xu hướng theo thời gian. Hồ sơ chưa có ngày đăng ký không tính vào cột tháng và được báo số lượng.

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

## Hình học và trung thực dữ liệu

Các vòng quỹ đạo lần lượt thể hiện tỷ lệ của từng chúng trên tổng, mỗi vòng có đường nền 100% riêng. Bubble matrix dùng bán kính `18 * sqrt(count / max)` để diện tích tỷ lệ số người; giá trị 0 không vẽ bong bóng. Waffle mỗi ô xấp xỉ 1%, kèm số người và phân số chính xác. Hai cánh tuổi–giới tính dùng chung trục tỷ lệ; giới tính chưa rõ được báo riêng. Các đường tháng dùng hình học Bézier có sẵn, không vượt giá trị lân cận; nền vùng tổng được phân biệt với ba đường chúng.
