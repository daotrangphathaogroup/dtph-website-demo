# Từ biểu mẫu thật thành một tờ giấy liên tục

Ngày nghiên cứu: 04/11/2026. Chỉ tham khảo nguồn chính chủ. Không sửa mã sản phẩm. Thông số và kịch bản dưới đây là đề xuất thiết kế của tác giả, chưa được kiểm chứng qua thử nghiệm người dùng.

## Quyết định đề xuất

Dùng **một mặt giấy xuyên suốt**: biểu mẫu hiện tại → biểu mẫu in thu nhỏ trên giấy 280 × 320 px → gấp nửa dưới lên → phong bì và bay đang có. Không tách section thành thẻ nhỏ, không xếp chồng, không đổi chồng giấy sang một thẻ khác. Tờ giấy cuối vẫn chứa chính các phần thông tin vừa điền, đúng thứ tự; chỉ phần giao diện điều khiển được làm nhẹ. Đây là quan hệ nhìn thấy được: người dùng gửi chính tờ đăng ký của mình.

## Cơ sở từ nguồn chính thức

- **Giữ nhận diện:** Material khuyên dùng phần tử chung để dẫn mắt, giữ tiêu điểm rõ và neo nội dung vào chuyển động của bề mặt. Chuyển cảnh không có bề mặt chung tạo tiêu điểm mới và được đánh dấu không khuyến nghị. Áp dụng: đường biên giấy tồn tại liên tục; giữ một dòng chữ thật dễ nhận ra đến đoạn gấp. [Material — Choreography](https://m1.material.io/motion/choreography.html)
- **Đổi hình bao, bảo toàn chữ:** Material cho phép chiều rộng và chiều cao mặt bao đổi với nhịp khác nhau; nội dung cần giữ tỷ lệ để tránh kéo méo. Áp dụng: giấy thu về hình cuối, còn toàn bộ nội dung thu đồng đều hai trục. Không scaleY riêng các section. [Material — Transforming material](https://m1.material.io/motion/transforming-material.html)
- **Nhân quả dễ hiểu:** Apple khuyên chuyển động có mục đích, phản hồi theo kỳ vọng, ngắn và chính xác. Áp dụng: bấm gửi làm biểu mẫu trở thành tờ đăng ký; một chồng thẻ trung gian không giúp giải thích thao tác này. [Apple HIG — Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- **Vận tốc:** Material yêu cầu tăng/giảm tốc trơn; thời lượng phụ thuộc quãng đường, vận tốc và mức thay đổi diện tích. Áp dụng: cùng một tiến trình điều khiển hình bao và nội dung; giảm tốc trước khi bắt đầu gấp, không teleport hoặc đổi hướng giữa chừng. [Material — Duration & easing](https://m1.material.io/motion/duration-easing.html)

Các kết luận “áp dụng” là suy luận thiết kế cho sản phẩm. Material v1 còn quy định vật liệu của hệ thống đó không gấp; vì thế tài liệu này chỉ mượn nguyên tắc liên tục, không viện dẫn Material như quy chuẩn cho gấp giấy vật lý. Nếp gấp ở đây là ràng buộc đã được người dùng duyệt. [Material — Material properties](https://m1.material.io/material-design/material-properties.html)

## Một chuỗi duy nhất, thời gian do tác giả đề xuất

Mốc 0 bắt đầu sau khi biểu mẫu hợp lệ. Khóa gửi lặp nhưng giữ nguyên DOM và giá trị.

| Mốc | Điều nhìn thấy | Quan hệ với nhịp tiếp theo |
| --- | --- | --- |
| 0–180 ms | Nút gửi phản hồi; viền điều khiển, nền input và khoảng đệm bắt đầu nhẹ đi ngay tại chỗ. Nội dung và section không rời mặt giấy. | Biểu mẫu đang chuyển sang dạng giấy, không sinh vật thể mới. |
| 120–360 ms | Thu khoảng trống giữa các trường và section; giữ thứ tự đọc và các giá trị hiện có. Không thêm nhãn thẻ, không cho section lướt chồng lên nhau. | Giảm diện tích trống trước khi thu toàn bộ nội dung. |
| 220–900 ms | Cùng mặt giấy thu và dịch trực tiếp về vị trí đầu vào của đoạn gấp. Nội dung thật thu đồng đều để nằm trọn trong giấy 280 × 320 px. Tiêu đề hoặc một dòng nhận diện thật tiếp tục đi cùng giấy. | Có thể theo dõi toàn bộ đường đi từ form sang giấy; không có crossfade thay vật. |
| 900–980 ms | Kết thúc giảm tốc tại đúng hình học giấy đã duyệt: rộng 280 px, cao 320 px, top 24 px trong hệ tọa độ cảnh gấp. Giữ chữ trên cả hai nửa. | Đây chính là frame đầu của đoạn gấp, không phải một thẻ mới xuất hiện. |
| Từ 980 ms | Chạy nguyên đoạn gấp đã duyệt: nửa dưới cao 160 px quay lên quanh đường giữa; chữ đi theo mặt giấy và bị che bởi nếp gấp. Sau đó giữ nguyên phong bì và bay. | Việc chữ biến khỏi tầm nhìn có nguyên nhân vật lý nhìn thấy được. |

980 ms chỉ là mốc thử ban đầu cho nhịp dẫn; không phải khuyến nghị thời lượng từ Apple hoặc Google. Các pha chồng thời gian để tránh cảm giác diễn từng cảnh độc lập. Không thêm nhún hoặc nảy ở bàn giao.

## Các điểm triển khai cần giữ

- Root biểu mẫu và các node trường vẫn là những node đang mount; thay đổi phong cách hiển thị trên chính chúng. Không clone input, snapshot, bản form giả, portal hay popup.
- Dùng một hệ tọa độ cho đo đầu và đích. Giữ chỗ ngoài cảnh để trang không nhảy; chọn vùng cảnh nhìn thấy được khi gửi, tránh tự kéo trang về đầu một form dài.
- Với kích thước nội dung sau thu khoảng trống là W × H, tỷ lệ thu đều là `s = min(vùng_nội_dung_rộng / W, vùng_nội_dung_cao / H, 1)`. Chấp nhận chữ nhỏ hoặc giấy có thêm khoảng trắng; không ép H thành 320 bằng biến dạng chữ và không cắt mất phần cuối để giả vờ vừa giấy. Cần đo bố cục cuối trước khi tính s.
- Đường biên giấy phải thấy ở mọi frame; chỉ giảm chrome trang trí, không fade toàn bộ giá trị đầu vào. Nếu mã gấp dùng lớp mặt giấy riêng, bàn giao ở hình học trùng khít với nội dung thật còn hiện, tuyệt đối không đổi nội dung tại ranh giới đó.
- Cùng một tiến trình điều khiển độ thu, vị trí và nội dung. Vận tốc tiến về 0 trước khi gấp để tránh một cú dừng hoặc đổi hướng đột ngột. Giữ nguyên keyframe và thời lượng gấp, phong bì, bay.

## Nghiệm thu bằng xem chậm

Theo dõi một giá trị thật từ frame đầu đến lúc bị nửa giấy gấp che. Nếu nó tự biến mất rồi một vật khác xuất hiện, chuỗi chưa đạt. Kiểm tra ở 0%, 25%, 50%, 75% và bàn giao: luôn chỉ một bề mặt giấy; không có section chồng chữ, khoảng trắng thay vật, nhảy tọa độ hoặc chữ bị bóp dẹt. Kiểm tra cả form dài khi nút gửi nằm ở cuối viewport.

## Cách áp dụng

Dùng một mặt giấy liên tục với form thật luôn được giữ trong DOM. Các điều khiển chuyển sang biểu diễn in của chính giá trị đã nhập, trong cùng section; section dàn thành các dòng trên nửa dưới tờ phiếu. Nửa giấy này chính là wrapper chứa form, xoay lên để lộ mặt bìa, thay vì chồng mục bị mờ rồi được thay bằng một tấm thiệp khác. Tờ giấy thu trực tiếp về 280×320 và giữ nguyên kích thước trước nếp gấp; không còn đoạn chồng 210 px nở thành tờ giấy 320 px. Toàn bộ inline style đo/tạm được hoàn lại khi lỗi. Bản áp dụng giữ thời lượng mở đầu 2.240 ms và thời gian ổn định 760 ms để nối đúng nhịp gấp đã được người dùng chấp nhận; khác thời lượng nhanh đề xuất ban đầu. Các con số là quyết định thiết kế của dự án.
