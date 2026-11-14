# Rà soát và dọn mã — 09/11/2026

Branch: `chore/site-audit-cleanup`, tạo từ bản local đang có thay đổi. Không reset, thay database, đổi mật khẩu, commit hay push.

## Thay đổi

- Xóa ba component không còn đường gọi: ClassManagement, HomeOverview và RegistrationForm theo từng chúng. Các URL đăng ký cũ vẫn chuyển về luồng đăng ký hiện tại.
- Xóa 226 dòng CSS chỉ phục vụ giao diện lựa chọn chúng, form cũ và trạng thái hoạt động bốn mức đã thay bằng tag. Giữ CSS form, portrait, error và hoàn thành đăng ký đang còn dùng/được kiểm thử.
- Rút gọn utils về initials; bỏ hai cờ PublicShell không còn caller; bỏ tham số profileFieldLabel không dùng ở tất cả caller.
- QuickSearch dùng dữ liệu nhân sự đã tải và hàm filterSheet chung, bỏ fallback gọi API public, state lỗi mạng và timer cũ. useDeferredValue giữ ô nhập phản hồi; kết quả giữ nguyên đối tượng Member để mở hồ sơ trực tiếp. Không đổi quyền API cũ.
- Sửa điều kiện tránh chạy press animation trong form gửi phong bì: `.intake-delivering` thay selector chưa từng tồn tại. Bỏ selector animation tài khoản không có producer.
- Bỏ dòng ignore toàn bộ tests. Bộ kiểm thử giả lập có thể được đưa vào version control; vẫn loại khỏi gói triển khai. Thêm hai render-contract test cho tìm kiếm và PublicShell.

Đo trên chín file trước đó sạch: giảm ròng 22.446 byte nguồn, khoảng 440 dòng. Đây là kích thước mã nguồn, không phải số liệu bundle hay FPS.

## Giữ lại có chủ đích

Các package runtime đều có caller. Migration, dữ liệu DATA/local/cloud, API lớp học và helper CSV còn được kiểm thử được giữ để tránh phá tương thích hoặc dữ liệu. Không gộp/reformat hàng loạt backend hay viết lại animation phong bì.

## Kiểm tra

- Kiểm tra kiểu TypeScript tĩnh toàn bộ src, strict + noUnusedLocals + noUnusedParameters: 0 lỗi. Trình phân tích chỉ đọc nguồn, không import/chạy mã ứng dụng, không emit hoặc tải plugin dự án.
- Phân tích cú pháp 13 stylesheet bằng PostCSS có sẵn: 0 lỗi; git diff --check đạt.
- Một lượt review độc lập tìm caller/CSS và kiểm tra diff không phát hiện lỗi nguồn chặn phát hành.
- Hai test mới đã viết nhưng chưa chạy. Build, unit/integration/browser và kiểm chứng bảo mật động không được chạy trong đợt này do yêu cầu sandbox của security-audit chưa đáp ứng. Kết quả test ở các đợt trước không được coi là kết quả của branch này.

## Báo cáo bảo mật

Hồ sơ audit nằm ngoài repository: `/Users/hoanganh/security-audit-skill/dtph-website/run-1/`. Bản kết quả và giới hạn cuối được ghi trong REPORT.md, FINDINGS-DETAIL.md, NEEDS-VALIDATION.md, findings.json và coverage-ledger.json. Không đưa credential hoặc dữ liệu hồ sơ thật vào báo cáo.
