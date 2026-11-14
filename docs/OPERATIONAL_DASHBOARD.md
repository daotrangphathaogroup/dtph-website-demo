# Tổng quan điều hành · 10/11/2026

Triển khai từ đề xuất `research/DASHBOARD_PROPOSAL_2026-11-10.md` trên branch `chore/site-audit-cleanup`. Không sửa schema/database, quyền, dữ liệu thật hoặc luồng đăng ký.

## Bố cục và thao tác

- Bộ lọc chung: chúng, tổ, khu vực. Mặc định toàn bộ hồ sơ đã duyệt; không có bộ lọc tháng/năm làm sai nghĩa tổng hồ sơ.
- Bốn chỉ số: hồ sơ đã duyệt (chi tiết ba chúng), phiếu chờ duyệt (ngày gửi cũ nhất hợp lệ), chưa phân công và kênh liên lạc cần xác minh.
- Tiếp nhận đăng ký: mở khi cần; bảng cũ dùng lại quyền xem/duyệt/từ chối. Phiếu được xếp ngày gửi tăng dần, ngày thiếu/không hợp lệ ở cuối. Không dùng ngày tham gia thay ngày gửi.
- Ma trận Tổ × Chúng: số hồ sơ và nút mở những người chưa phân công trong từng ô. Chọn ô áp dụng chúng/tổ, giữ khu vực đang chọn và đưa tới danh sách.
- Cột ngang phân công theo người phụ trách và khu vực theo ba chúng. Cùng một thang so sánh trong từng biểu đồ. Hiển thị số từng chúng, tooltip hover/focus; Top7 có nút xem phần còn lại, không bỏ im lặng các nhóm nhỏ.
- Danh sách việc: toàn bộ, chưa phân công, liên lạc, liên kết sai, rà soát tuổi, chưa phân tổ. Chỉ số/biểu đồ mở đúng dữ liệu bảng và bỏ được riêng bộ lọc công việc. Mỗi lần đổi phạm vi reset lựa chọn/tìm kiếm/phân trang bảng để tránh danh sách lọc ngầm.
- Manager xem hồ sơ. Admin/Dev được mở chỉnh sửa; quyền ghi/duyệt vẫn do backend quyết định.

## Quy tắc dữ liệu

`src/lib/operations.ts` tính một báo cáo chung cho các biểu đồ và drilldown:

- Distinct ID, chỉ registrationStatus=approved. Pending/rejected/thiếu trạng thái không tính vào tổng.
- Caregiver trống = chưa phân công. Có ID nhưng không trỏ đến người đã duyệt hoặc tự trỏ = liên kết cần kiểm tra. Danh mục caregiver lấy từ toàn bộ hồ sơ đã duyệt, kể cả khi người chăm sóc nằm ngoài chúng/tổ/khu vực đang lọc.
- Ba phần có tổng khớp: đã phân công hợp lệ + chưa phân công + liên kết cần kiểm tra = hồ sơ đã duyệt.
- Người lớn: SĐT cá nhân. Thiếu nhi: SĐT PH; đây là gợi ý xác minh vận hành vì trường vẫn là tùy chọn. Định dạng hợp lệ chưa chứng minh gọi được. Không ép nhập pháp danh, nghề nghiệp hoặc tag.
- Tổ ghi trong hồ sơ được tôn trọng; khác tổ gợi ý từ phường không bị báo sai. Tổ/khu vực chưa rõ có nhóm riêng.
- Rà soát tuổi: nhóm tuổi hiện tại không khớp chúng được ghi nhận, hoặc tròn16/41 trong90 ngày tới. Tính theo ngày Việt Nam, không tự chuyển chúng. Cửa sổ90 ngày là gợi ý hiển thị.
- Không tính hoạt động, năng suất, chất lượng chăm sóc hay điểm đạo đức từ tag hoặc số phân công; không vẽ tăng trưởng từ ngày import.

## Tổ chức mã và hiệu năng

OperationalOverview thay Tổng quan cũ; GroupDashboard giữ danh sách/chờ duyệt/thống kê của từng chúng. Xóa các component OverviewSummary/OverviewFilters/OverviewAnalytics/AtlasCharts, model7chart cũ và stylesheet chỉ dùng bởi chúng. Giữ phần style khung trang dùng chung. Không thêm dependency chart.

Chuyển động dùng hook hiện có, chỉ reveal panel/thanh, có giảm chuyển động; không chạy animation từng ô hoặc biến cả bảng thành lớp transform lớn. Bảng chờ chưa mount khi đóng. Tooltip có số đọc được trực tiếp, không buộc hover để biết dữ liệu.

## Kiểm tra

- 82 unit/render/integration tests đạt, gồm quy tắc mô hình mới và quyền backend với dữ liệu giả.
- Typecheck và diff whitespace đạt.
- Playwright fixture-only Chromium/WebKit: số liệu, lọc và drilldown ma trận/người chăm sóc/công việc, mở phần TopN còn lại, pending, xem hồ sơ, Manager không có duyệt/từ chối, trang từng chúng, reduced motion và dữ liệu rỗng; không có request ghi thật.
- Responsive320/390/760/1100/1360/1600px. Ma trận có cuộn ngang riêng ở màn hình nhỏ, trang không tràn.
- Điều hướng trong development với fixture360 hồ sơ đã duyệt và CPU4×: về Tổng quan ghi nhận khoảng ngắt167ms; tối đa183ms trong chuỗi thử. Đây là phép đo local, không bảo đảm cho mọi thiết bị/dataset.

Các screenshot QA dùng dữ liệu giả nằm trong `.local/audits/operations-*`. Chưa triển khai cloud hoặc thay đổi dữ liệu Supabase.

Bản production build và deployment trace check đã đạt. Local được khôi phục bằng `npm run dev` (backend local), xác nhận `/api/bootstrap` thật trả200; không chuyển sang `npm start` vốn yêu cầu cấu hình cloud.

## Đề xuất tiếp theo cho Tổng quan thu gọn

Tổng quan có hai khối chính: cơ cấu hồ sơ đã duyệt của ba chúng và hàng chờ duyệt. Các mục dưới đây là đề xuất triển khai tiếp.

1. **Ưu tiên — phiếu chờ lâu nhất.** Đặt ngay cạnh tổng số phiếu chờ. Hiện số ngày chờ và chúng tương ứng. Tính từ `submittedAt` theo ngày Việt Nam. Nếu có phiếu nhưng thiếu thời điểm gửi hợp lệ, ghi rõ số phiếu chưa rõ ngày gửi. Khi mở danh sách, xếp phiếu có ngày gửi hợp lệ từ cũ đến mới để nhân sự xử lý theo thứ tự.
2. **Xu hướng đăng ký mới theo tuần.** Dùng cột chồng ba màu cho 8 tuần gần nhất để thấy tuần nào có nhiều phiếu mới và đến từ chúng nào. Chỉ đếm phiếu có ngày gửi hợp lệ. Nếu có hồ sơ nhập hàng loạt, cần phân biệt nguồn nhập với đăng ký qua form trước khi đưa vào chuỗi.
3. **Thời gian xử lý phiếu.** Khi có đủ lịch sử, dùng trung vị thời gian từ gửi đến duyệt để theo dõi tốc độ xử lý. Backend có `approved_at` nhưng chưa trả trường đó trong dữ liệu dashboard. Loại hồ sơ duyệt tự động hoặc nhập hàng loạt khỏi phép đo thủ công khi xác định được nguồn.
4. **Rà soát độ đầy đủ dữ liệu sau khi nhập.** Dùng một thanh ngang tỷ lệ hồ sơ thiếu ngày sinh, địa chỉ hoặc kênh liên lạc theo từng chúng trong đợt làm sạch dữ liệu. Các nhóm thiếu có thể chồng lấp. SĐT phụ huynh và các trường tùy chọn không được tính là lỗi bắt buộc.
