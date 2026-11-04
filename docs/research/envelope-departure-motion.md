# Chuyển động phong thư bay đi

Ngày nghiên cứu: 04/11/2026. Phạm vi: nhịp khởi hành sau khi đóng nắp phong bì. Chỉ dùng nguồn chính chủ; các số đo và kịch bản bên dưới là đề xuất thiết kế của tác giả cho dự án, không phải thông số chuẩn từ nguồn.

## Kết luận từ nguồn

- **Lấy đà trước khi bay:** Microsoft giải thích anticipation giúp người xem chuẩn bị cho hành động; chuyển động một hướng thường bắt đầu bằng nhịp ngược hướng. Tài liệu thuộc Microsoft Agent cũ, dùng ở đây như nguyên lý hoạt hình, không như khuyến nghị API hiện hành. [Microsoft: Animation Principles](https://learn.microsoft.com/en-us/windows/win32/lwef/animation-principles)
- **Vật thể có trọng lượng, một điểm nhìn chính:** IBM khuyến nghị tiết chế biến dạng, giữ cảm giác quán tính và chỉ dùng chuyển động phụ để hỗ trợ hành động chính; các phần phụ có thể theo sau với độ trễ nhỏ. Điều này phù hợp phong thư giấy trang nhã hơn kiểu bật nảy nhiều lần. [IBM Design Language: Classic principles](https://www.ibm.com/design/language/animation/classic-principles/)
- **Quỹ đạo và tốc độ là hai quyết định khác nhau:** Material đời đầu dùng cung lõm cho chuyển động chéo trong màn hình, nhưng khuyên đường thẳng cho phần tử ra/vào màn hình. Phần tử rời hẳn màn hình tăng tốc tới cuối, không giảm tốc ở điểm không còn nhìn thấy; đường cong thời gian tham khảo là `cubic-bezier(.4,0,1,1)`. Vì vậy cung bay của phong thư là phép ẩn dụ minh họa có chủ đích, không nên được giới thiệu như quy tắc Material. [Material: Movement](https://m1.material.io/motion/movement.html), [Material: Duration & easing](https://m1.material.io/motion/duration-easing.html)
- **Thời lượng phải phục vụ phản hồi:** Apple yêu cầu chuyển động có mục đích, phản hồi gọn, chính xác và tránh buộc người dùng chờ hoạt ảnh hoàn tất. Không dùng hoạt ảnh như cách duy nhất truyền đạt kết quả. [Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- **Hiệu năng:** Chrome khuyên ưu tiên `transform` và `opacity` thay cho thay đổi `top/left` để thuận lợi cho compositor; cần đo thực tế trên thiết bị đích. [Chrome: Motion](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/motion)
- **Giảm chuyển động:** `prefers-reduced-motion: reduce` phản ánh tùy chọn giảm, thay hoặc bỏ chuyển động không thiết yếu của người dùng; phóng to và lia các vật lớn có thể gây khó chịu tiền đình. [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)

## Đề xuất tác giả: 1,6 giây, có thể điều chỉnh 1,4–1,8 giây

Thời gian tính sau khi nắp đã đóng và máy chủ đã xác nhận thành công. Không cộng thời gian chờ mạng vào kịch bản bay.

| Mốc | Hành động đề xuất |
| --- | --- |
| 0–220 ms | Nhịp lấy đà: phong thư hạ 6 px, lùi trái 8 px, xoay −3°; thu nhẹ về 0,98. Không rung lặp. |
| 220–660 ms | Nhấc khỏi vị trí: lên 20–30 px, sang phải khoảng 45 px, nghiêng 5–8°; bóng dưới thư mờ và nhỏ dần. Vệt hạt bắt đầu sau thư 70–100 ms. |
| 660–1.380 ms | Bay tăng tốc theo cung duy nhất hướng phải/lên: đoạn đầu nông, đoạn cuối dốc hơn. Thu từ 1 xuống 0,5–0,6 để gợi khoảng cách; không phanh ở mép. Giữ opacity cao đến gần cuối rồi tan trong 120–180 ms cuối. |
| 1.380–1.600 ms | Chỉ còn vài hạt tan và lời xác nhận hiện bằng chữ. Người dùng có thể tiếp tục thao tác ngay khi kết quả đã sẵn sàng. |

Điểm khởi đầu để thử: nhịp lấy đà `cubic-bezier(.4,0,.2,1)`, nhịp rời đi `cubic-bezier(.4,0,1,1)`. Dùng wrapper ngoài cho vị trí, lớp con cho xoay/thu để tránh các hiệu ứng ghi đè cùng `transform`. Tọa độ cuối tính theo vùng cảnh và kích thước thư để đi qua mép hoàn toàn, không chỉ dùng một số pixel cố định trên mọi màn hình. Đây là thông số cần xem trực tiếp và chỉnh theo bố cục thực tế.

## Vệt hạt CSS/SVG nhẹ

Đề xuất 6–10 hạt, gồm chấm tròn 2–4 px và tối đa hai nét sáng ngắn 8–14 px, màu vàng giấy với opacity đỉnh 0,35–0,55. Dùng một SVG trang trí hoặc các span tuyệt đối với tọa độ cố định dọc đường bay; mỗi hạt chỉ chạy `transform` và `opacity` một lần, trễ nhau 45–65 ms, sống 280–420 ms. Hạt xuất hiện phía sau vị trí thư đã đi qua, trôi ngược 8–16 px rồi tan; không tỏa như pháo giấy. Tránh blur động, filter SVG và bộ phát hạt chạy JavaScript mỗi khung hình. Đặt `aria-hidden="true"`, `pointer-events: none`; hủy hiệu ứng khi vùng cảnh đóng. Các giới hạn số lượng này là ngân sách đề xuất, không phải bảo đảm hiệu năng.

Với chế độ giảm chuyển động: bỏ lấy đà, bay, xoay, thu và toàn bộ hạt; chuyển mờ 120–160 ms sang kết quả bằng chữ. Kiểm tra thêm màn hình hẹp, Safari, cuộn giữa chuỗi, nhấn gửi lặp, đóng vùng cảnh và mạng lỗi; cảnh bay chỉ chạy sau thành công thật. Cấu hình này là đề xuất áp dụng nguyên tắc accessibility từ Apple/MDN ở trên.

## Triển khai trong dự án

Áp dụng nhịp lấy đà, nhấc lên và bay lên phải trong 1.720 ms, với bóng nền co/mờ dần. Phong bì dùng các mặt giấy SVG, lớp lót và dấu logo; đóng nắp/đóng dấu trong 780 ms sau khi máy chủ xác nhận. Theo yêu cầu tăng particle, dùng 130 phần tử hạt cho toàn chuỗi (không phát cùng lúc): 24 lúc thu phiếu, 24 lúc gấp, 14 lúc đóng dấu, 40 khi rời đi và 28 hạt vệt bay. Đây là lựa chọn triển khai vượt ngân sách hạt tối thiểu ở đề xuất nghiên cứu; chưa phải chứng nhận tốc độ khung hình trên mọi thiết bị. Hạt chỉ chạy transform/opacity một lần, ẩn trong chế độ giảm chuyển động. Cảnh bay được cắt theo vùng form để không gây tràn ngang trên điện thoại.

Kiểm tra trình duyệt với dữ liệu giả lập: gửi thành công, chờ máy chủ, lỗi/khôi phục, thử lại, màn hình hẹp và giảm chuyển động; không tạo hồ sơ thật khi kiểm tra.
