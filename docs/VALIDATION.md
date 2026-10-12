# Kiểm tra backend local — 02/10/2026

## Kết quả hiện tại: chuyển sang Next.js

- Next.js 16.3.8 App Router; giao diện và `/api/*` chạy cùng tiến trình tại port 5173.
- `npm run build` đạt, bao gồm TypeScript và kiểm tra tracing không chứa database local, file môi trường hoặc dữ liệu kiểm thử.
- `npm test`: 18 tests đạt. Test Route Handler xác minh JSON, OTP, cookie HttpOnly, quyền truy cập, OTP dùng một lần, body lỗi và giới hạn dung lượng.
- Kiểm tra trình duyệt: giao diện tổng quan với logo/màu mới hiển thị, phiên quản lý và hồ sơ PH00037 cùng ảnh đại diện vẫn được giữ lại. `/api/health` trả trạng thái local hoạt động.
- Vercel dùng framework Next.js. Supabase/R2/SMS thật chưa kết nối hoặc triển khai; kiểm thử cloud adapter hiện dùng tài nguyên giả lập.
- Ảnh kiểm tra: `docs/previews/nextjs-overview.jpg`.

## Lịch sử kiểm tra trước khi chuyển Next.js

`npm run build` đạt: TypeScript và Vite build thành công.

`npm test` đạt: 10 tests (9 tình huống integration và test bao ngoài), dùng HTTP và database PostgreSQL tạm, không thay đổi dữ liệu local người dùng đang thử.

Các tình huống đã kiểm tra:

- Bootstrap chưa đăng nhập không trả hồ sơ, ghi từ origin khác bị chặn.
- Chung SĐT cần mã thành viên; OTP từ chối sai account/purpose và dùng lại.
- API che thông tin riêng theo quyền, chặn sửa hồ sơ/config trái phép và giả role.
- Đăng ký lớp đồng thời không trùng; quản lý lớp chỉ hủy cho đúng lớp được phân công.
- Đăng ký tài khoản mới với SĐT có sẵn; chỉ kích hoạt sau OTP, mật khẩu lưu hash.
- OTP giới hạn 5 lần sai, hết hạn, cooldown gửi lại và hủy mã cũ.
- Đổi mật khẩu gắn đúng session, grant một lần, thu hồi session khác; mật khẩu mới có hiệu lực.
- Lưu hồ sơ/cấu hình, server chuyển PNG sang WebP, ảnh yêu cầu đăng nhập.
- Đóng/mở lại PostgreSQL giữ hồ sơ, tài khoản mới, cấu hình, phiên và mật khẩu đã đổi.

Kiểm tra trình duyệt:

- Đăng nhập SĐT chung 0901200000 yêu cầu mã; nhập PH00001 nhận SMS mô phỏng đúng mã thành viên.
- Nhập OTP từ backend mở tổng quan với quyền quản lý tổng.
- Bảng quản lý tải 36 hồ sơ từ API, hiển thị ngày đúng YYYY-MM-DD chuyển sang tiếng Việt.
- Biểu mẫu hồ sơ tải dữ liệu backend; bấm Lưu thông tin nhận thông báo thành công.
- Backend được khởi động lại trên database local; tiến trình thứ hai bị chặn để bảo vệ dữ liệu PGlite.

SMS thật, Supabase Auth/RLS và Cloudflare R2 chưa tích hợp. Thử giao diện trên mobile của giai đoạn frontend vẫn được giữ; chưa chạy lại toàn bộ các luồng trên mọi kích thước sau khi nối backend. Quên mật khẩu và xác minh SĐT mới khi thay số là bước production tiếp theo.

## Cập nhật logo và giao diện — 02/10/2026

- Logo gốc `public/logo-ctn.png` có nền trong suốt, dùng chung ở sidebar, header mobile, Auth và favicon.
- Màu đỏ trầm/vàng ấm/nền ngà áp dụng vào điều hướng, nút, bảng, biểu mẫu, hộp thoại và OTP.
- Build TypeScript/Vite đạt.
- Browser desktop: logo tải thành công, tổng quan và bảng quản lý hiển thị đúng.
- Browser mobile 390px: menu mở/đóng, logo hiển thị trên header; document width 390px, bảng cuộn trong vùng riêng.
- Ảnh kiểm tra: `docs/previews/brand-overview.jpg`, `docs/previews/brand-mobile.jpg`.

## Chuẩn bị triển khai Vercel / Supabase / R2 — 02/10/2026

- `npm run build`: đạt.
- `npm test`: 17 tests đạt; giữ các integration tests local và thêm tests production/providers.
- PostgreSQL adapter: transaction dùng một client, SET LOCAL search_path trong transaction và rollback; TLS verification bật.
- Migration production thử trên PostgreSQL nhúng: schema private, RLS các bảng, anon/authenticated bị chặn, không có hồ sơ mẫu.
- Đăng ký qua nhánh production: SMS provider fake nhận mã đúng account, HTTP không có code/message/SĐT đầy đủ, cookie Secure và OTP không dùng lại.
- R2 adapter fake: key avatars/, WebP, private; Twilio adapter fake: SĐT +84 và nội dung có mã thành viên.
- Rate limits production ghi DB; health kiểm tra được schema/connection qua query.
- Chưa deploy thật, chưa chạy migration trên Supabase thật, chưa tạo bucket/key R2 hoặc gửi SMS thật: chưa có tài khoản/project/kết nối cloud.

## SMS tạm tắt để thử nghiệm trên cloud

Bổ sung SMS_PROVIDER=preview: không gọi dịch vụ SMS, trả mã OTP có giới hạn cho UI và thông báo chỉ dùng dữ liệu thử. Disabled vẫn đóng đăng ký/OTP, Twilio không trả mã OTP qua API. Kiểm thử riêng dùng database tạm xác minh đăng ký, đăng nhập, mật khẩu bắt buộc, OTP không dùng chéo tài khoản/phiên, chống replay, đổi mật khẩu và chuyển về disabled.

## Tối ưu cập nhật cấu hình và đăng ký lớp

- Đo hai request public trên deployment cũ: health khoảng 1,95 giây, bootstrap không đăng nhập khoảng 1,00 giây; đây là mẫu đo đơn lẻ, không phải benchmark ổn định.
- Response header deployment cũ ghi vùng Functions iad1. Connection string cấu hình trên máy chỉ vùng ap-northeast-1; vercel.json đã chuyển Functions sang hnd1 (Tokyo), cần deploy lại để áp dụng.
- Toggle bắt buộc/tùy chọn và đăng ký/hủy lớp cập nhật UI ngay, hiển thị trạng thái đang lưu, chặn gửi lặp cùng mục và rollback đúng mục nếu thất bại.
- Các thao tác trên dùng một request ghi; bỏ bootstrap toàn bộ dữ liệu sau mỗi lần lưu. API trả trạng thái đã lưu/ngày đăng ký thật để đồng bộ UI.
- Session/quyền và thao tác ghi chạy trong một transaction mỗi request; bootstrap cũng dùng một transaction thay vì từng query mở transaction riêng. Giữ search_path theo SET LOCAL và các kiểm tra phân quyền.
- npm test: 22 tests đạt; bổ sung kiểm tra rollback không ghi đè thay đổi độc lập, chặn bấm lặp, ngày đăng ký không đổi khi đăng ký lặp, một transaction mỗi endpoint và quyền/OTP hiện có.
- npm run build đạt, bao gồm TypeScript và kiểm tra loại trừ dữ liệu local/secret khỏi gói triển khai.
- Chưa đo lại production sau thay đổi vì chưa deploy bản này.

## Trang quản lý lớp và học viên

- Trang lớp thông thường giữ bố cục gọn; chỉ admin hoặc quản lý được phân công tldd-01 thấy nút Quản lý lớp học. Bootstrap trả managedClassIds từ database để quyết định phạm vi.
- Trang quản lý riêng có bảng học viên: mã, tên/ảnh, ngày sinh, SĐT, khu vực, ngày tham gia lớp; tìm kiếm không dấu, bộ lọc, sắp xếp, thu gọn hàng, phân trang và CSV toàn bộ kết quả/những dòng đã chọn.
- Ngày tham gia lớp lấy từ enrollments.date, không nhầm với members.joined. Hồ sơ chi tiết hiển thị cả hai ngày.
- Xem/chỉnh sửa học viên dùng hồ sơ chung của huynh đệ. Endpoint PATCH /api/classes/:classId/members/:id kiểm tra quản lý được phân công và học viên đang đăng ký lớp đó. Quản lý lớp không được sửa qua endpoint quản lý tổng, không đổi quyền/mật khẩu. Giới hạn đổi SĐT production vẫn áp dụng.
- Hủy đăng ký cần xác nhận; giữ hồ sơ chung. Thao tác đăng ký/hủy tiếp tục cập nhật nhanh với rollback khi API thất bại.
- npm test: 23 tests đạt, gồm kiểm tra phân quyền lớp, học viên ngoài lớp, lớp khác, hồ sơ được lưu và quyền sau hủy đăng ký. Build Next.js/TypeScript và deployment trace đạt.
- Kiểm tra browser local: mở trang từ nút quản lý, tìm kiếm, mở biểu mẫu chỉnh sửa, xác nhận hủy và chọn giữ đăng ký. Không thay dữ liệu hồ sơ qua kiểm tra giao diện. Screenshot docs/previews/class-management.jpg.

## Email và đăng nhập bằng email — 05/10/2026

Thêm email tùy chọn vào đăng ký/hồ sơ, bảng quản lý huynh đệ/học viên, hồ sơ chi tiết và CSV. Cấu hình đăng ký có toggle bắt buộc email. Backend trim/lowercase và PostgreSQL unique index đảm bảo mỗi email không rỗng thuộc tối đa một tài khoản; nhiều email trống được phép, SĐT dùng chung giữ nguyên. API báo 409 rõ ràng khi trùng email.

Kiểm thử mới xác minh đăng ký trùng, khác hoa/thường/khoảng trắng, cùng SĐT với email khác, định dạng sai, đăng nhập email + mật khẩu, cập nhật email trùng, email cũ không đăng nhập sau đổi, ẩn email khỏi người không có quyền, email trống và toggle bắt buộc. Kiểm tra trực tiếp constraint database và chạy lại migration không làm mất email đã lưu. Production fixtures áp dụng cả migration email.

Backend local áp dụng migration vào database cũ khi khởi động; API bootstrap xác nhận emailRequired=false. Kiểm tra UI browser chưa thực hiện được do chính sách truy cập URL của browser session chặn. Cloud chưa áp dụng migration hoặc deploy trong lượt này; cần migration trước khi push mã để tránh thiếu cột.

## Đăng nhập Google — 05/10/2026

- `npm test`: 27 tests đạt. Kiểm tra state/cookie, PKCE, nonce/email_verified sau xác minh SDK, callback và liên kết dùng một lần, giới hạn mật khẩu, chống liên kết theo email đơn thuần, giữ quyền và định danh Google khi đổi email hồ sơ. Migration production bật RLS cho bảng OAuth mới.
- `npm run build` đạt, gồm TypeScript và kiểm tra deployment trace.
- Chưa thử đăng nhập Google thật vì chưa có GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET. Các kiểm tra OAuth sử dụng provider/token verifier giả lập; không gọi Google bằng tài khoản người dùng.
- Hướng dẫn cấu hình và phạm vi tính năng: `docs/GOOGLE_LOGIN.md`.

## Tạm tắt dịch vụ xác thực — 05/10/2026

Mặc định ba công tắc SMS/email/Google tắt; cấu hình chỉ quản lý tổng được thay đổi và lưu trong app_meta. Test production kiểm tra đăng ký/đăng nhập không gửi tin hoặc tạo OTP, email unique/SĐT dùng chung, đổi mật khẩu cần mật khẩu hiện tại và thu hồi phiên khác, cập nhật SĐT, bật lại OTP, vô hiệu mã cũ khi tắt và không cho bật dịch vụ chưa sẵn sàng. Bộ kiểm tra hiện có 28 tests. Xác thực email chưa tích hợp nên công tắc chưa cho bật. Không cần migration bổ sung cho công tắc.

## Khu vực và Tổ — 08/10/2026

- 30 tests đạt, gồm ánh xạ đủ 20 khu vực, không trùng phường, phân đủ ba Tổ, lọc Tổ và dữ liệu cũ chưa phân tổ.
- API registration/profile tests xác nhận backend tính lại Tổ theo phường, bỏ qua Tổ client gửi, thay phường đổi Tổ, từ chối khu vực mới không có trong danh sách và giữ hồ sơ cũ.
- TypeScript đạt. Không cần migration mới; Tổ suy ra từ phường. Danh sách và giới hạn đọc ảnh ở `docs/AREAS_AND_TEAMS.md`.

## Tái cấu trúc cổng nhân sự — 11/10/2026 (kết quả hiện tại)

Các kết quả OTP/Google/tài khoản huynh đệ bên trên là lịch sử, không còn mô tả kiến trúc hiện hành.

- 16 tests mới/được giữ lại đạt. Bộ test cũ cho auth huynh đệ đã thay bằng kiểm tra tài khoản staff độc lập, quyền quản lý tổng/lớp, từ chối phiên cũ, các endpoint cũ trả 404, tạo tài khoản không tạo hồ sơ, rate limit, Origin, cookie, logout/hết hạn, migration giữ dữ liệu và credentials một lần, persistence local, TLS và quyền bảng production.
- `npm run build` đạt với các route public và quản trị thực, gồm TypeScript và deployment trace không chứa dữ liệu/secret local.
- HTTP local: /, /dang-ky-thong-tin, ba trang nhóm, /quan-tri/dang-nhap, /quan-tri/tai-khoan trả 200. Các trang đăng ký không chứa trường mật khẩu. Bootstrap công khai không trả hồ sơ.
- Migration local tự áp dụng và giữ database hiện có; migration Supabase chưa chạy trên cloud trong tác vụ này. Các form public chưa nhận dữ liệu vì trường dữ liệu sẽ chốt sau.

## 11/10/2026 — Dev/Admin/Manager và trang chính chung

18 tests: kiểm tra public chỉ nhận tên/nhóm, Manager xem tất cả nhưng không ghi, Admin ghi hồ sơ nhưng không quản lý tài khoản, Dev tạo/list/reset/delete; đổi mật khẩu riêng cần mật khẩu hiện tại; thu hồi phiên khi reset/delete/change; singleton Dev, giữ dữ liệu migration, TLS/RLS/origin/rate limit và persistence. Mô hình quyền này thay thế kiểm tra quản lý theo lớp trước đó.

## 12/10/2026 — Biểu mẫu riêng theo nhóm

26 tests: 18 kiểm tra quyền/cấu hình cũ và 8 kiểm tra đăng ký, schema độc lập, trường thiếu nhi chỉ Admin/Dev ghi, số/năm/ngày/điện thoại/Tổ, retry không tạo trùng, không tạo tài khoản, WebP và ảnh private, lưu qua migration rerun và thêm trường JSONB không đổi cấu trúc bảng. Build/typecheck thành công. Kiểm tra trực quan form thiếu nhi và thanh niên, không gửi hồ sơ thử vào dữ liệu local thật.

## 12/10/2026 — Duyệt đăng ký

27 tests và build/typecheck: đăng ký công khai pending theo cả ba nhóm, không hiện trong danh sách chính/tìm kiếm/đăng ký lớp; Admin/Dev duyệt và lưu audit một lần, Manager không có quyền duyệt; mọi staff đăng ký được approved ngay; payload giả role/status không vượt quyền; retry bằng Manager không tự duyệt yêu cầu public, retry sau duyệt trả trạng thái mới; migration rerun không tự duyệt pending.
