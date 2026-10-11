# Khu vực và Tổ sinh hoạt — 08/10/2026

Danh sách phân Tổ lấy từ 20 tên khu vực đọc rõ trong ảnh Đạo Tràng cung cấp. Không tự bổ sung tên bị che trên bản đồ hoặc thay đổi theo địa giới hành chính hiện hành. Danh sách cần Đạo Tràng xác nhận/bổ sung khi có thông tin rõ hơn.

| Tổ | Khu vực |
|---|---|
| Tổ 1 | Bửu Long, Tân Hạnh, Hóa An, Bửu Hòa, Tân Vạn, Thống Nhất, Hiệp Hòa |
| Tổ 2 | Tân Phong, Trảng Dài, Hố Nai, Tân Biên, Tân Hòa, Tân Hiệp |
| Tổ 3 | Long Bình, An Bình, Long Bình Tân, An Hòa, Long Hưng, Phước Tân, Tam Phước |

Huynh đệ chọn phường trong biểu mẫu đăng ký/chỉnh sửa; Tổ tự tính, không cho nhập thủ công. Danh sách quản lý huynh đệ và học viên có cột Tổ, bộ lọc Tổ 1/2/3/Chưa phân tổ, bộ lọc phường và cột Tổ trong CSV. Hồ sơ và trang cá nhân cũng hiển thị Tổ.

Danh sách chung ở `src/lib/areas.ts`, dùng cho frontend và backend. Database tiếp tục lưu phường trong `members.area`; Tổ được suy ra khi đọc dữ liệu và trả về API. Không lưu hai giá trị có thể mâu thuẫn, không cần migration SQL mới. Backend kiểm tra phường khi đăng ký hoặc thay khu vực, bỏ qua Tổ do client gửi lên.

Hồ sơ cũ chỉ ghi tỉnh/thành phố được giữ nguyên, hiển thị Chưa phân tổ, tiếp tục chỉnh sửa các thông tin khác. Khi huynh đệ chọn phường, hệ thống tự phân Tổ. Không gán phường hoặc Tổ tùy ý cho dữ liệu cũ. Dữ liệu mẫu/local hiện có không bị reset.
