# Gom các phần biểu mẫu thành một tờ giấy: phương án thay nhịp thu chiều cao

Ngày tra cứu: 2026-11-04. Phạm vi: nghiên cứu chuyển động; không sửa mã sản phẩm. Ràng buộc thiết kế: dùng chính DOM biểu mẫu đang hiển thị, không popup, không bản sao nội dung; giữ nguyên đoạn gấp thẻ, vào phong bì và bay hiện có. Các tên phương án dưới đây là cách mô tả của người viết, không phải tên pattern chuẩn của thư viện.

## Kết luận đề xuất

Chọn **các phần trượt dọc và xếp chồng về cùng một điểm neo**, sau đó đường viền của biểu mẫu thu quanh chồng giấy và bàn giao trực tiếp sang đoạn gấp thẻ đang có. Người xem cần nhìn thấy các khối thông tin thật rời vị trí cũ rồi tụ lại trước khi chúng bị che. Nhịp đầu dùng chuyển động có điểm dừng rõ, không overshoot, không squash/stretch và không nảy. Đây là khuyến nghị cho dự án, chưa phải kết quả thử nghiệm người dùng.

Cơ sở: Material khuyên giữ một tiêu điểm liên tục, chọn các thành phần chia sẻ quan trọng và tránh nhiều đường di chuyển cắt nhau. Khi nội dung khác nhau, có thể neo nó vào chuyển động dọc của bề mặt chung. Những nguyên tắc này hỗ trợ hướng gom dọc, nhưng Material không quy định phải xếp biểu mẫu thành chồng giấy. [Material — Choreography](https://m1.material.io/motion/choreography.html)

## So sánh ba cách

| Phương án | Cảm nhận dự kiến và tính liên tục | Hạn chế | Đánh giá cho yêu cầu này |
| --- | --- | --- | --- |
| Trượt dọc, xếp thành chồng giấy | Các section thật dịch về cùng một vùng; mép còn lệch nhẹ trong chốc lát giúp đọc được “nhiều phần → một bộ giấy”. Tiêu đề hoặc dấu nhận diện cùng root bề mặt tồn tại xuyên suốt. | Nếu tất cả cùng về một tọa độ ngay lập tức, chỉ thấy chữ đè nhau; cần lớp che và thứ tự z rõ ràng. | Phù hợp nhất: dễ đọc đường đi, không cần bóp chiều cao nội dung. |
| Gấp accordion theo trục ngang của giấy | Các section quay `rotateX` quanh mép trên/dưới để tạo các nếp zíc zắc; hình thức giấy rõ. | Một section dài không tương đương một panel giấy đều; chữ quay khuất, mặt sau và bóng phức tạp. Dễ khiến đoạn mở đầu cạnh tranh với màn gấp thẻ đã được chấp nhận. | Chỉ nên chọn nếu muốn cả biểu mẫu thật sự là một tờ giấy nhiều nếp; không phải lựa chọn đầu. |
| Hợp nhất theo shared axis Y | Các section cùng trượt theo Y rồi mờ đi; bề mặt chung chuyển sang hình thẻ. | Nhẹ và ít rối nhưng dễ bị hiểu là đổi màn hình/xóa nội dung, thiếu dấu hiệu vật lý “gom các phần”. | Dùng như lớp nền điều phối cho phương án xếp chồng, hoặc phương án giảm chuyển động; đứng riêng thì yếu hơn. |

Bảng là phân tích thiết kế của người viết. Shared axis của Material diễn tả các phần tử đi/vào có quan hệ không gian hoặc điều hướng cùng chuyển động trên X/Y/Z; nó không tự tạo quan hệ nhiều section hợp thành một tờ giấy. [Material — The motion system](https://m2.material.io/design/motion/the-motion-system.html)

Với accordion 3D, `transform-style: preserve-3d` quyết định việc con tồn tại trong không gian 3D; `opacity < 1`, `overflow: hidden` và một số thuộc tính nhóm trên tổ tiên có thể ép phẳng. `backface-visibility` điều khiển mặt sau khi phần tử quay. Vì vậy không thể chỉ thêm `rotateX` vào các khối đang fade/clip và mặc định nếp gấp sẽ đúng. [MDN — transform-style](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-style), [MDN — backface-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backface-visibility)

## Dàn cảnh khuyến nghị (thông số do người viết đề xuất)

1. **Đo và giữ sân khấu:** sau khi form hợp lệ, lấy tọa độ section và điểm neo thuộc chính root biểu mẫu. Giữ kích thước vùng bao hiện tại trong lúc gom để trang không giật. Chọn điểm neo gần vùng đang nhìn thấy khi bấm gửi, thường gần phần cuối form; không tự kéo người xem lên đầu biểu mẫu dài.
2. **Gom dọc khoảng 480–620 ms:** các section thật chủ yếu dịch `translateY` về cùng điểm neo, giữ trục X thẳng hàng. Có thể stagger 15–20 ms để thấy hướng gom; không đợi từng khối chạy xong. Khối xa bắt đầu sớm hơn hoặc đi nhanh hơn để không kéo dài toàn chuỗi. Giữ một mốc nhận diện dễ thấy. Nội dung chỉ bị che hoặc giảm opacity khi đã đi phần lớn quãng đường; tránh fade ngay lúc bắt đầu.
3. **Khép thành một mặt giấy khoảng 120–180 ms:** sau khi các khối đã tụ, bỏ lệch mép cuối và thu bề mặt chung về kích thước đầu vào của đoạn gấp hiện tại. Có thể chồng phần cuối nhịp này với nhịp gom; tổng mở đầu mục tiêu khoảng 600–760 ms. Đừng scaleY toàn bộ form để ép chữ thành một vệt.
4. **Bàn giao:** điểm cuối phải trùng tọa độ, kích thước và hướng của thẻ ở frame mở đầu đoạn gấp đang có. Giữ nguyên các keyframe/timing gấp thẻ, phong bì và bay. Thay riêng nhịp dẫn vào; không thêm bounce mới ở ranh giới bàn giao.

Các thời lượng, easing không nảy, thứ tự gom và độ lệch mép là tác giả đề xuất cho giao diện này. Chưa có nguồn chính thức hoặc thử nghiệm xác nhận bộ số trên tối ưu. Stagger ngắn phù hợp với lời khuyên choreography của Material về nhịp xuất hiện có hướng, nhưng trường hợp gom biểu mẫu ở đây là suy luận áp dụng, không phải mẫu gốc của tài liệu. [Material — Choreography](https://m1.material.io/motion/choreography.html)

## Cách giữ đúng DOM và vị trí

Đề xuất giữ nguyên root cùng các section đã mount và giá trị input; animation thao tác transform trên các node đó. Có thể đưa section về vị trí absolute trong chính scene sau khi chụp tọa độ, trong khi wrapper ngoài giữ chỗ. Không dựng modal, portal mới chứa form thứ hai, ảnh chụp form, bản clone input hay crossfade sang một bản form giả. Phần giấy trang trí không chứa bản sao dữ liệu người dùng.

FLIP là kỹ thuật phù hợp để duy trì vị trí khi đổi bố cục: đo trạng thái trước, áp bố cục cuối, bù vị trí rồi animate phần bù về 0. GSAP Flip hỗ trợ nhiều phần tử, stagger, `absolute` và `nested`; tài liệu lưu ý absolute có thể làm nội dung phía dưới sụp nếu container không giữ chỗ, và Flip không hỗ trợ transforms 3D. Đây là khả năng tham khảo; không có lý do bắt buộc thêm GSAP nếu dự án đang điều khiển được chuyển động bằng CSS/Web Animations. [GSAP — Flip](https://gsap.com/docs/v3/Plugins/Flip/)

Motion layout animation dùng transform và có thể làm méo con do scale; `layout="position"` chỉ animate vị trí. Nếu dùng Motion, ưu tiên node thật với layout position hoặc transform đo sẵn, tránh cấu hình `layoutId` thành cặp form cũ/mới vì trường hợp cả hai còn hiện sẽ tự crossfade. [Motion — Layout animation](https://motion.dev/docs/react-layout-animations)

Tọa độ `getBoundingClientRect()` tính theo viewport và đổi theo scroll. Phải tính các section và điểm đích trong cùng một hệ tọa độ; khi resize/scroll xảy ra giữa nhịp, đo lại hoặc kết thúc an toàn thay vì dùng delta cũ. [MDN — getBoundingClientRect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)

## Điều kiện nghiệm thu hình ảnh

- Frame đầu giữ đúng giao diện form vừa điền; không có card mới hiện ra từ nơi khác.
- Nhìn thấy ít nhất vài section thật di chuyển dọc về một vùng trước khi bị che; không chỉ thấy container ngắn lại.
- Chữ không bị ép dẹt; các đường đi không cắt nhau; chỉ một điểm tụ rõ ràng.
- Giữ chỗ đến khi hoàn tất để phần cuối trang không nhảy; kiểm tra form dài/mobile với nút gửi đang ở cuối viewport.
- Frame bàn giao không nhảy vị trí hoặc ló một bản thẻ thứ hai; đoạn gấp và bay giữ nguyên.
- Với reduced motion, bỏ quãng dịch dài/3D ở nhịp gom; cập nhật trực tiếp hoặc opacity ngắn, vẫn giữ nguyên dữ liệu và luồng nghiệp vụ. Đây là cách áp dụng đề xuất theo tùy chọn hệ thống. [MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)

## Bản áp dụng

Chọn xếp chồng dọc bằng các section thật, dùng Web Animations hiện có. Một nhịp chuẩn bị 420 ms làm nhãn từng tờ rõ; sau đó các tờ trượt về cùng trục X, lần lượt xếp lớp từ dưới lên, với độ lệch mép 7 px. Giữ phần cuối chuyển sang kích thước tờ phiếu trước khi vào các keyframe gấp đã có. Nhịp gom 2.240 ms là lựa chọn điều chỉnh cho yêu cầu người dùng muốn quan sát chậm hơn; khác với thời lượng nhanh đề xuất ban đầu ở trên. Giữ lại một nhịp ổn định nhỏ 5 px, không bóp scaleY nội dung. Khi lỗi, hoàn lại inline style đã chụp và nguyên các input; không clone form hoặc mở popup animation.
