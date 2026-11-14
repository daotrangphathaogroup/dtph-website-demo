# Tổng quan phục vụ điều hành nhân sự Đạo tràng

Ngày nghiên cứu: 10/11/2026. Đây là đề xuất sản phẩm dựa trên schema hiện tại và nguồn tham khảo chính thức; chưa thay giao diện, đọc dữ liệu cá nhân hay đo độ đầy đủ của database thực.

## Kết luận

Mục tiêu của Tổng quan: giúp người quản lý nhận biết quy mô ba chúng, tìm việc đang chờ xử lý và quyết định phân công/liên lạc. Chọn ba biểu đồ chính cùng danh sách công việc, thay vì coi mọi trường dữ liệu đều cần một biểu đồ.

Mỗi thành phần phải có: câu hỏi → phép đo có thể giải thích → danh sách hồ sơ đứng sau con số → hành động đúng quyền. Nếu không có quyết định liên quan, chuyển sang phần phân tích bổ sung hoặc hồ sơ cá nhân.

## Cơ sở nghiên cứu và cách áp dụng

- [ONS: Dashboards](https://service-manual.ons.gov.uk/data-visualisation/guidance/dashboards): xác định nhu cầu người dùng, đưa thông tin quan trọng lên trước và cung cấp ngữ cảnh. Áp dụng: ưu tiên duyệt/phân công rồi mới tới phân bố mô tả.
- [NCVO: Supporting volunteers](https://www.ncvo.org.uk/help-and-guidance/involving-volunteers/supporting-and-managing-volunteers/supporting-volunteers/): làm rõ trách nhiệm hỗ trợ và duy trì trao đổi. Áp dụng cho nhân sự cộng đồng: hiển thị phân công chăm sóc; không xem việc gán tên là bằng chứng đã chăm sóc. Đây là suy luận thiết kế, không đồng nhất mọi huynh đệ với tình nguyện viên.
- [Government Data Quality Issues Framework](https://www.gov.uk/government/publications/implement-a-data-quality-action-plan/data-quality-issues-framework): gắn quy tắc chất lượng với mục đích, ảnh hưởng và ưu tiên. Áp dụng: kiểm tra khả năng liên lạc/phân công thay vì chấm điểm toàn bộ ô trống.
- [ONS: Bar charts](https://service-manual.ons.gov.uk/data-visualisation/chart-types/bar-charts) và [Stacked bars](https://service-manual.ons.gov.uk/data-visualisation/chart-types/stacked-bar-charts): dùng so sánh có trục chung, phân biệt số lượng và tỷ trọng. Áp dụng: cột ngang cho số hồ sơ và cơ cấu ba chúng; các tag chồng lấp không ghép thành một tổng.

Các nguồn trên hỗ trợ nguyên tắc. Thứ tự ưu tiên, các ngưỡng tuổi và phương án màn hình dưới đây là đề xuất riêng cho dự án, chưa phải kết luận từ khảo sát người quản lý thực tế hoặc hướng dẫn pháp lý/tôn giáo.

## Dữ liệu thực sự đang có

Nguồn kiểm tra: `src/lib/registration.ts`, `src/lib/registration-flow.ts`, `src/lib/recognition-tags.ts`, `src/lib/types.ts`, `src/lib/overview-analytics.ts`, `server/backend.mjs`, migration 007.

- Hồ sơ: ID, chúng, họ tên, pháp danh, giới tính, ngày sinh, ảnh, nơi ở/phường, tổ, điện thoại cá nhân/người thân, ngày tham gia, người giới thiệu, HĐ chăm sóc, ghi chú và nhiều thẻ ghi nhận tích cực.
- Thiếu nhi: tên PH, lớp 1–12 hoặc “Không”, biệt danh, tính cách. Nghề nghiệp/người giới thiệu bị ẩn ở UI nhóm này. Chưa được suy ra trình độ chỉ từ ngày sinh.
- Thanh niên/Đạo tràng: nghề nghiệp, vai trò. Vai trò hồ sơ không phải quyền đăng nhập Dev/Admin/Manager.
- Metadata frontend: trạng thái duyệt và submittedAt. DB còn có approved_at, approved_by, submitted_by, nhưng member projection hiện không trả chúng ra API.
- Chưa có nhật ký liên lạc/chăm sóc hiện hành, điểm danh từng buổi, lịch sử rời nhóm hoặc snapshot lịch sử thành viên. Bảng enrollments cũ là đăng ký lớp, không thay thế điểm danh.
- `status` là nhiều thẻ điểm tốt; không phải biến hoạt động. Việc không có tag không mang ý nghĩa tiêu cực.

## Phương án màn hình đầu tiên

### 1. Dải số tổng quan

Đề xuất bốn chỉ số:

1. **Hồ sơ đã duyệt**, có số ba chúng bên dưới. Đây là quy mô hồ sơ ghi nhận, không gắn nhãn “đang sinh hoạt”.
2. **Đăng ký chờ duyệt**, kèm thời gian chờ lâu nhất từ submittedAt hợp lệ. Chưa có SLA thì không tự đánh dấu “quá hạn sau 3 ngày”.
3. **Chưa phân công HĐ chăm sóc**, tính trên hồ sơ đã duyệt. Liên kết không tồn tại/chưa được duyệt giữ thành lỗi liên kết riêng.
4. **Cần bổ sung kênh liên lạc**, tách lý do người lớn thiếu SĐT cá nhân và thiếu nhi chưa có SĐT PH. Vế thiếu nhi là nhu cầu vận hành được đề xuất, không phải điều kiện bắt buộc hiện tại của form.

Mỗi chỉ số mở đúng danh sách đã lọc. Một hồ sơ có thể thuộc nhiều việc; không cộng các số việc thành tổng người.

### 2. Danh sách “Cần xử lý”

Danh sách ngắn, có lý do và hành động, ưu tiên hơn biểu đồ trang trí:

| Việc | Dữ liệu/cách tính | Giải quyết điều gì | Hành động |
|---|---|---|---|
| Phiếu đang chờ | pending, submittedAt; xếp cũ trước | Tránh bỏ sót người vừa đăng ký | Xem hồ sơ → Admin/Dev duyệt/từ chối; Manager chỉ xem |
| Chưa có người phụ trách | approved và caregiver trống | Trách nhiệm chăm sóc chưa được ghi nhận | Lọc theo chúng/tổ/phường → Admin/Dev chỉnh phân công |
| Chưa có kênh liên lạc phù hợp | Quy tắc riêng người lớn/thiếu nhi | Chuẩn bị danh sách cập nhật thông tin | Mở hồ sơ để xác minh/bổ sung, không đánh giá con người |
| Sắp tới mốc rà soát nhóm tuổi | Ngày sinh hợp lệ, sinh nhật 16 hoặc 41 trong cửa sổ đề xuất 90 ngày | Chuẩn bị trao đổi/chuyển sinh hoạt nếu phù hợp | Xem danh sách; không tự đổi chúng |

Cửa sổ 90 ngày là mặc định đề xuất cần thống nhất, không phải chính sách đã có. Phường khác tổ tự suy ra không được coi là lỗi: sản phẩm cho phép chọn lại tổ thủ công.

### 3. Ba biểu đồ/chế độ phân tích chính

#### A. Ma trận “Tổ × Chúng: quy mô và phân công chăm sóc”

- Hàng: Tổ 1, 2, 3, Chưa phân tổ. Cột: ba chúng.
- Mỗi ô: số hồ sơ đã duyệt; số chưa phân công. Ví dụ minh họa `24 hồ sơ · 6 chưa phân công`, không phải số liệu thật.
- Nếu có nền màu, dùng một đại lượng duy nhất: tỷ lệ chưa phân công. Luôn có số tuyệt đối để không làm nhóm nhỏ trông nghiêm trọng ngang nhóm lớn. Mẫu số bằng 0 hiển thị “—”.
- Câu hỏi: chỗ nào nhiều hồ sơ nhưng còn khoảng trống phân công? Nhấn ô mở đúng tổ/chúng, có lối lọc riêng “chưa phân công”.
- Lợi ích: tổng quan cả ba chúng và cơ cấu tổ trong cùng một hình, có đường đi trực tiếp tới việc cần làm.

#### B. Cột ngang “Số hồ sơ đang phân công cho từng HĐ chăm sóc”

- Nhóm theo caregiver ID hợp lệ, đếm distinct member ID. Cột có thể chia ba màu theo chúng; tên hiện để nhân sự nhận biết người phụ trách.
- Hiển thị tất cả qua cuộn hoặc Top N + số người phụ trách còn lại; luôn giữ thẻ “chưa phân công” riêng.
- Câu hỏi: việc phân công đang tập trung ở ai? Có cần trao đổi để phân bổ lại không?
- Không gọi là chất lượng chăm sóc, năng suất hoặc quá tải: thiếu dữ liệu quỹ thời gian, năng lực, nhu cầu từng hồ sơ và số lần liên lạc. Không đặt mục tiêu mọi người có số lượng bằng nhau.

#### C. Cột ngang xếp chồng “Huynh đệ theo khu vực và chúng”

- Mỗi phường/khu vực là một hàng, ba phần màu là ba chúng. Mặc định số người; chế độ % chỉ dùng khi muốn so cơ cấu.
- Có “Chưa rõ khu vực”. Nếu dùng Top N, phải có “Khu vực khác” và đường xem toàn bộ; không loại im lặng phần đuôi.
- Câu hỏi: ai đang ở gần nhau, khu vực nào cần điều phối liên lạc/sinh hoạt hoặc phân công thêm?
- Nhấn hàng mở hồ sơ khu vực; có lọc xem chưa phân công. Số dân địa phương, tọa độ và tuyến đi không có nên không vẽ độ phủ dân cư/bản đồ choropleth.

### 4. Phân tích bổ sung, không chiếm chỗ mặc định

- Độ tuổi và lớp: phục vụ kế hoạch sinh hoạt theo lứa/lớp, ưu tiên trong trang Thiếu nhi. “Không” là đáp án hợp lệ, khác với ô trống. Giới tính chỉ trở thành chart chính nếu có quyết định tổ chức cụ thể.
- Nghề nghiệp/vai trò: dùng trong trang nhóm khi cần tìm người phù hợp cho một công việc; nghề nghiệp không chứng minh kỹ năng hoặc sự sẵn sàng. “Huynh đệ mới” và “Thành viên không thường xuyên” trong roleOptions chưa phải lịch sử sự kiện/activity log.
- Ghi nhận điểm tốt: sáu cột độc lập đếm số người có mỗi tag, nếu quản lý cần rà lại các ghi nhận. Không xếp hạng người/tổ bằng tổng tag; không coi chưa có tag là cần sửa.
- Người giới thiệu: danh sách phục vụ hỏi thêm bối cảnh/kết nối người mới. Chưa đưa “top người giới thiệu” vào mặc định vì thiếu nguồn chiến dịch, ngày ghi nhận đúng và kết quả tham gia thực.
- Hồ sơ ghi nhận theo tháng: chỉ đưa vào sau khi phân biệt ngày gửi phiếu, ngày tham gia và lô import. Tên chart phải mô tả đúng sự kiện, giữ tháng rỗng và tháng hiện tại chưa đủ kỳ; không cộng cùng tháng của nhiều năm rồi gọi là xu hướng gần đây.

## Những phép đo hiện chưa có cơ sở

- Tỷ lệ tham gia/điểm danh, người không hoạt động, tỷ lệ duy trì/rời nhóm, chất lượng/tần suất chăm sóc, danh sách “lâu chưa được liên hệ”, hiệu quả giới thiệu, dự báo rời nhóm.
- Tăng trưởng thành viên đang hoạt động từ số hồ sơ tăng; hồ sơ tồn tại không chứng minh còn tham gia.
- Điểm “tinh tấn”/đạo đức/chăm sóc tổng hợp từ tag, ghi chú hay tính cách. Không có nền tảng dữ liệu/định nghĩa để biến các trường này thành điểm số.
- Tỷ lệ chuyển đổi hoàn tất form: chưa có sự kiện bắt đầu/bỏ dở. Số approved hiện tại cũng không phải số được duyệt trong kỳ.

## Hợp đồng đo lường và tương tác

1. Snapshot mặc định: toàn bộ hồ sơ đã duyệt tại ngày xem; nhóm/tổ/phường là bộ lọc toàn trang. Hàng chờ duyệt nằm ngoài mẫu số approved.
2. Bộ lọc ngày đăng ký chỉ tác động phân tích phiếu nhập mới, hoặc phải đổi nhãn rõ thành “hồ sơ ghi nhận trong kỳ”. Không khiến tổng hồ sơ đạo tràng biến thành một cohort mà người xem không nhận biết.
3. Tuổi tính theo ngày Việt Nam. Chúng lưu trong hồ sơ là nhóm hiện tại được ghi nhận; nhóm suy từ tuổi dùng để đề nghị rà soát, không thay đổi dữ liệu.
4. Đếm distinct ID; đánh giá caregiver bằng liên kết approved thực, không chỉ chuỗi khác rỗng. Trường không biết giữ thành unknown; không biến thành 0/“không hoạt động”.
5. Kiểm tra chất lượng theo từng mục đích. Pháp danh/biệt danh/nghề nghiệp/tag thiếu không mặc nhiên là lỗi. Thiếu ảnh bắt buộc là vấn đề hồ sơ, nhưng không đánh trọng số bằng thiếu kênh liên lạc.
6. Mỗi chart giải thích mẫu số, phạm vi và ngày cập nhật; tooltip có số chính xác và nút xem hồ sơ. Thông tin thiết yếu không được chỉ hiện bằng hover/màu. Trên di động nhấn để xem, có bảng dữ liệu tương đương.
7. Admin/Dev chỉnh sửa/duyệt, Manager xem/lọc. Không đưa SĐT, ghi chú hay tên PH thành nhãn chart/tooltip toàn trang. Caregiver là huynh đệ được phân công, không mặc định là tài khoản quản trị.
8. Thông tin cập nhật và nguồn dữ liệu cần hiển thị rõ, đặc biệt khi xem dữ liệu mẫu. Chưa có rule xác nhận cập nhật thì không gọi hồ sơ cũ là “lỗi thời”.

## Thứ tự làm và kiểm chứng

1. Thống nhất “hồ sơ ghi nhận”, phạm vi phân công chăm sóc và mục đích liên lạc; profile độ đầy đủ dữ liệu bằng số tổng hợp, không xuất PII.
2. Làm bốn chỉ số, hàng chờ và ma trận tổ/chúng; kiểm tra click từ số tới đúng người, không trộn pending vào tổng approved.
3. Thêm hai cột ngang phân công/khu vực; thống nhất ba màu chúng dùng xuyên suốt, màu cảnh báo chỉ cho việc cần xử lý.
4. Thử với nhân sự bằng nhiệm vụ: tìm phiếu chờ lâu nhất; tìm thanh niên Tổ 2 chưa phân công; tìm thiếu nhi một khu vực chưa có SĐT PH. Đánh giá tìm đúng danh sách, hiểu đúng mẫu số và số bước thao tác. Chưa đặt mốc thời gian đạt tùy ý khi chưa có baseline.
5. Nếu cần quản lý chăm sóc thực: bổ sung một nhật ký tối thiểu gồm memberId, người thực hiện, thời điểm, loại trao đổi, kết quả/hẹn tiếp. Có nhật ký mới đề xuất liên hệ đến hạn. Điểm danh/duy trì cần sự kiện buổi sinh hoạt và trạng thái tham gia/ngừng theo thời gian riêng.
6. Nếu cần thời gian xử lý duyệt: DB đã có approved_at/approved_by/submitted_by; cần API và nguồn ngày tin cậy, phân biệt phiếu public với hồ sơ staff tự duyệt. Không cần suy diễn từ status hiện tại.

Nội dung nghiên cứu nguồn chi tiết: `DASHBOARD_PRIMARY_SOURCES_2026-11-10.md`. Không có thay đổi mã giao diện trong bước nghiên cứu này.
