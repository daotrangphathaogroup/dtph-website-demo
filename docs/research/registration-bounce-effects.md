# Hiệu ứng bounce cho luồng đăng ký: giấy → thẻ → phong bì

Ngày tra cứu: 2026-11-04. Phạm vi: khuyến nghị chuyển động; không thay đổi mã sản phẩm.

## Điều nguồn chính thức xác nhận

- Chuyển động nên giải thích trạng thái, phản hồi hành động, ngắn gọn và có mục đích; tránh hiệu ứng dư thừa và tránh bắt người dùng chờ hoạt cảnh hoàn tất. Đây là nguyên tắc của Apple, không phải chỉ định phải thêm bounce cho biểu mẫu. [Apple HIG — Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- Motion phân biệt spring vật lý (`stiffness`, `damping`, `mass`, có tiếp nhận vận tốc đang có) với spring theo thời lượng (`duration`, `bounce`). `bounce: 0` không nảy; `visualDuration` giúp đồng bộ thời điểm đối tượng trông như đã tới đích. Các tham số vật lý ghi đè `duration`/`bounce`. [Motion — Transitions](https://motion.dev/docs/react-transitions)
- Nên ưu tiên animate `transform` và `opacity`; thuộc tính gây layout/paint cần đo chi phí. Không rải `will-change` sẵn khắp giao diện: tạo layer có thể phát sinh vấn đề hiệu năng khác. [Google web.dev — High-performance CSS animations](https://web.dev/articles/animations-guide)
- `transform` khác `none` tạo stacking context và containing block cho phần tử con absolute/fixed; thứ tự individual transforms là translate → rotate → scale → transform. [MDN — transform](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform)
- Nhiều animation cùng tác động một thuộc tính mặc định dùng `replace`, nghĩa là giá trị animation thay thế giá trị nền. Không thể mặc nhiên coi hai animation `transform` sẽ cộng vào nhau. [MDN — animation-composition](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-composition)
- `prefers-reduced-motion` phản ánh yêu cầu giảm chuyển động không thiết yếu của hệ điều hành. WCAG 2.3.3 (AAA) yêu cầu có thể vô hiệu hóa motion do tương tác, trừ khi thiết yếu; đây không phải yêu cầu rằng mọi animation đều phải bị xóa. [MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion), [W3C — Understanding SC 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)

## Đề xuất thiết kế của người viết

Toàn bộ thông số và dàn cảnh dưới đây là đề xuất cho dự án, chưa phải kết quả thử nghiệm người dùng, cũng không phải thông số bắt buộc từ Apple/Google/Motion.

| Nhịp | Hiệu ứng đề xuất | Mục đích và giới hạn |
| --- | --- | --- |
| Giấy thu thành thẻ | Chuyển động chính 380–500 ms; vượt đích 2–3%, rồi ổn định một lần | Giữ quan hệ liên tục giữa nội dung đã điền và thẻ xác nhận; không nảy từng trường nhập |
| Thẻ chạm vị trí nghỉ | Squash/stretch rất nhẹ: `scaleX(1.025) scaleY(.975)` → `.99/1.01` → `1/1`, 180–240 ms | Gợi một lần chạm; biên độ nhỏ để chữ không méo rõ; ưu tiên shell trang trí thay vì scale nội dung đọc |
| Va chạm | Một vòng ripple hình ellipse, scale `.7 → 1.45`, opacity `.18 → 0`, 280–380 ms | Chỉ phát đúng thời điểm thẻ/phong bì chạm điểm nghỉ; không tạo sóng cả màn hình, không lặp |
| Thẻ đã ổn định | Một dải sáng xiên mờ quét qua mặt thẻ, 420–520 ms | Gợi chất liệu giấy phủ nhẹ và hoàn tất; gradient tĩnh trên pseudo-element, animate translate/opacity; tránh nhấp nháy và loop |
| Thẻ đi vào phong bì | Hạ thẻ theo trục dọc; phong bì nhận lực nén 1–2% rồi hồi lại | Dùng cùng điểm va chạm; phần thẻ sau khi vào túi phải bị che đúng lớp, không hiện xuyên nắp |
| Gửi phong bì | Nén chuẩn bị 80–110 ms, tăng tốc rời cảnh 350–450 ms; 2 vệt đuôi mảnh xuất hiện trễ 30–50 ms và tan nhanh | Vệt chỉ giúp đọc hướng bay; không blur toàn cảnh, không sao chép chữ/người dùng vào vệt |
| Kết quả | Dòng trạng thái thành công hiện khi có kết quả nghiệp vụ thật | Animation không quyết định việc gửi đã thành công; giữ thông báo bằng chữ, trạng thái lỗi và thao tác thử lại |

Chọn một hệ điều khiển: nếu dự án đã dùng Motion, thử `bounce: .12–.20`, `visualDuration: .4–.5` cho thẻ; không trộn thêm bộ tham số vật lý trong cùng transition. Nếu đang dùng CSS/keyframes, mô phỏng một lần overshoot nhỏ bằng các mốc tỉ lệ/di chuyển có chủ ý, không thêm thư viện chỉ để có bounce. Các con số này là điểm bắt đầu để xem thực tế, không tương đương vật lý giữa CSS và Motion.

## Quyền điều khiển transform và xếp lớp

Đề xuất tách lớp theo trách nhiệm: wrapper ngoài giữ vị trí/layout/đường bay; shell bên trong giữ squash/stretch; mặt giấy giữ fold/flip; pseudo-element riêng giữ dải sáng. Mỗi lớp chỉ có một bên điều khiển `transform`. Không để CSS keyframes và thư viện motion đồng thời ghi `transform` trên cùng node; không dùng `animation-composition: add` để vá mà chưa kiểm tra thứ tự biến đổi. Đây là kiến trúc đề xuất suy ra từ quy tắc composition và transform ở trên.

Đặt mặt sau phong bì, thẻ, mặt túi trước và nắp trong cùng một scene có thứ tự lớp rõ ràng. Vì stacking context con được xử lý như một đơn vị, tăng `z-index` của thẻ trong một context thấp không tự đưa thẻ lên trên context anh em. [MDN — Stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context)

Đề xuất chỉ clip dải sáng trong mặt thẻ và clip phần giấy trong túi phong bì; tránh `overflow: hidden` ở wrapper bounce vì có thể cắt bóng/ripple. Ripple và trails dùng `pointer-events: none`, không có nội dung cần đọc và không tham gia focus. Đo dropped frames khi gradient, bóng, clip và các lớp 3D chạy cùng lúc; không coi transform là bảo đảm luôn mượt.

## Reduced motion và kiểm tra

Đề xuất với `prefers-reduced-motion: reduce`: bỏ bay xa, xoay 3D, bounce, squash/stretch, ripple, sweep và trails; chuyển thẳng giữa trạng thái bằng opacity ngắn 100–150 ms hoặc cập nhật tức thì. Giữ nguyên nội dung xác nhận và hành vi gửi, không chờ `animationend` mới tiến trạng thái. Lắng nghe thay đổi tùy chọn trong khi trang đang mở. Đây là phương án áp dụng của dự án dựa trên tài liệu MDN/W3C đã dẫn, không phải ngưỡng thời gian do tiêu chuẩn quy định.

Kiểm tra tối thiểu: chỉ một lần nảy có suy giảm; không lộ thẻ xuyên túi; không cắt bóng ở cạnh container/mobile; không chặn thao tác bằng lớp trang trí; gửi lỗi không phát thành công; bật reduced motion vẫn hoàn tất toàn bộ luồng; không có animation trang trí chạy vô hạn sau thành công.

## Áp dụng

Bản triển khai dùng keyframes có overshoot suy giảm cho mặt gấp, nắp, dấu và điểm đặt thiệp; không thêm thư viện animation. Ánh sáng quét được clip trong mặt giấy; lớp glow và ribbon đặt phía sau phong bì, ripple đặt ở lớp trang trí riêng. Nhịp nén/hồi của phong bì hoàn tất trước nhịp bay để không giành quyền điều khiển transform. Hiệu ứng mới giữ nguyên thời lượng gửi và cổng xác nhận máy chủ, tự kết thúc khi giao diện chuyển sang biên nhận, đồng thời ẩn toàn bộ dưới reduced motion. Các thời lượng là lựa chọn thiết kế của dự án.
