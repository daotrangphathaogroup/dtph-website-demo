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
