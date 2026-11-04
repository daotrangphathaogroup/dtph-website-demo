# Chuyển động đăng ký: biểu mẫu → thiệp → phong bì → gửi

Nghiên cứu ngày 04/11/2026, chỉ dùng tài liệu chính chủ. Các thông số ở phần đề xuất là lựa chọn thiết kế cho sản phẩm này, không phải chuẩn bắt buộc từ các nguồn.

## Cơ sở thiết kế

- Chuyển động cần giải thích hành động, phản hồi ngắn gọn, có mục đích và có phương án giảm chuyển động. Chuỗi gấp giấy hợp lý khi giúp người dùng hiểu thông tin vừa điền được đóng thành một lời đăng ký; không nên thêm cảnh biểu diễn độc lập. [Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- Container transform giữ bề mặt bao liên tục trong lúc vị trí, kích thước và hình dáng thay đổi; nhờ đó người xem nhận ra hai trạng thái thuộc cùng một vật. Áp dụng ở đây: chính nền giấy của biểu mẫu co lại thành tờ đăng ký rồi gấp thành thiệp, ngay trong vùng biểu mẫu. Nội dung có thể đổi dần nhưng không được mất dấu vật thể. [Material: The motion system](https://m2.material.io/design/motion/the-motion-system.html)
- Shared axis giúp các đối tượng có quan hệ không gian chuyển động cùng hướng. Thiệp đi xuống vào miệng phong bì, sau đó phong bì mới bay đi; không đổi hướng đột ngột giữa các nhịp. [Material: The motion system](https://m2.material.io/design/motion/the-motion-system.html)

## Kịch bản ba hồi đề xuất

| Hồi | Thời lượng đề xuất | Hành động nhìn thấy |
| --- | --- | --- |
| 1. Thu gọn chính biểu mẫu | 460 ms | Khóa gửi lặp; giữ màu giấy, viền, tiêu đề và tên người đăng ký làm mốc. Các trường gom thành nội dung tờ đăng ký, cùng bề mặt co về giữa vùng hiện tại. Không bật modal hay tạo một chiếc thiệp không liên hệ với form. |
| 2. Gấp thành thiệp | 540 ms | Một cánh giấy xoay quanh nếp gấp thật trong 320 ms; cánh thứ hai bắt đầu sau 220 ms và chạy 320 ms. Bóng nếp gấp rất nhẹ; giữ một phần chữ đến lúc bị cánh giấy che. Thiệp hoàn chỉnh dừng ngắn để nhận diện. |
| 3. Cho vào phong bì và gửi | 1.080 ms, ngoài thời gian chờ mạng | Thiệp hạ vào phong bì mở trong 420 ms; mặt trước phong bì che dần thiệp. Chỉ sau khi máy chủ xác nhận thành công mới đóng nắp 240 ms và gửi đi 420 ms, rồi hiện xác nhận bằng chữ ngay vùng này. |

Tổng phần diễn chuyển động khoảng 2,08 giây. Có thể gửi yêu cầu mạng đồng thời với hồi 1, nhưng không thể dùng hết thời lượng animation làm bằng chứng thành công. Nếu mạng chậm, giữ phong bì mở hoặc thiệp đứng yên, hiện “Đang gửi đăng ký…”. Nếu lỗi, mở lại biểu mẫu với nguyên dữ liệu và lỗi rõ ràng; không chạy cảnh gửi. Đây là yêu cầu nghiệp vụ của luồng đăng ký, không phải kết luận từ thư viện animation.

Thông số ban đầu: `cubic-bezier(.22,1,.36,1)` cho thu gọn/gấp; gửi đi dùng tăng tốc nhẹ. Thiệp rộng khoảng 220–280 px và luôn nhỏ hơn lòng phong bì; phong bì không vượt chiều rộng vùng form trên điện thoại. Không rung lặp, xoay toàn màn hình hay tung hạt trang trí.

## Cách dựng giấy, hiệu năng và khả năng tiếp cận

- Tạo cảnh 3D cục bộ với `perspective: 1200px`; giữ `transform-style: preserve-3d` trên từng lớp trung gian có con 3D. `perspective` quyết định khoảng cách nhìn tới mặt phẳng giấy. [MDN: perspective](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/perspective), [MDN: transform-style](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-style)
- Dùng `transform-origin` đúng mép nếp gấp và `rotateX`/`rotateY` cho cánh; hai mặt riêng với `backface-visibility: hidden` để tránh chữ phản chiếu. [MDN: transform-origin](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-origin), [MDN: backface-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backface-visibility)
- Tránh `opacity < 1`, `filter`, `clip-path`, `overflow: hidden` trên tổ tiên cần giữ không gian 3D: chúng có thể làm phẳng các mặt con. Nếu cần che thiệp bằng phong bì, dùng các mặt trước/sau riêng hoặc đặt phần cắt trên lá cuối, không trên cảnh gấp. [MDN: transform-style](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-style)
- Ưu tiên hoạt ảnh `transform` và `opacity`; đo hình học một lần trước khi chạy thay vì đổi vị trí/kích thước gây tính layout mỗi khung hình. [Chrome: Motion](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/motion)
- Với `prefers-reduced-motion: reduce`, thay gấp và bay bằng chuyển mờ 120–180 ms giữa trạng thái form/đang gửi/kết quả; trạng thái chữ vẫn phụ thuộc phản hồi thật của máy chủ. Việc phát hiện tùy chọn này có thể thực hiện bằng media query. [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)

## Tiêu chí kiểm tra

Xem chậm từng hồi để xác nhận không có khung hình trống hoặc giấy thay vật thể; thử màn hình hẹp, cuộn xuống giữa form và Safari để kiểm tra phối cảnh/lớp che. Thử mạng chậm, lỗi máy chủ, nhấn gửi hai lần, đóng vùng đăng ký giữa chuỗi và chế độ giảm chuyển động. Thành công phải được xác nhận bằng chữ; chuyển động không mang thông tin độc quyền.

## Bản triển khai

Bản triển khai dùng một mặt giấy bao quanh form thật: thu các hàng từ dưới lên trong 1.480 ms (lệch nhau 140 ms), co thành tờ phiếu trong 760 ms, gấp mặt dưới thành bìa trong 1.000 ms và hạ vào phong bì trong 800 ms. Bìa có mặt trước/sau riêng, giữ lại sau khi gấp. Sau khi máy chủ chấp nhận mới đóng nắp 640 ms rồi gửi đi 1.000 ms. Particle nhẹ chạy một lần ở các nhịp tạo thiệp, gấp và gửi; ẩn hoàn toàn khi giảm chuyển động. Các thời lượng này là quyết định thiết kế của dự án. Trong lúc chờ máy chủ, phong bì giữ mở; lỗi sẽ khôi phục form và dữ liệu. Chế độ giảm chuyển động bỏ các bước di chuyển.

Kiểm tra bằng trình duyệt với phản hồi giả lập: form 5/6 bước, màn hình hẹp, giảm chuyển động, lỗi mạng, thử lại cùng mã yêu cầu và chỉ gửi đi sau xác nhận. Không tạo dữ liệu thật trong quá trình kiểm tra.
