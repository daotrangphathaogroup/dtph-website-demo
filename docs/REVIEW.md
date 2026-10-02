# Checklist duyệt local

- [ ] Tổng quan: bố cục và ngôn ngữ phù hợp với Đạo Tràng.
- [ ] Thành viên: bảng có đủ thông tin, bộ lọc và độ thu gọn thuận tiện.
- [ ] Tra cứu: tên không dấu/mã, kết quả và hồ sơ tối thiểu hợp lý.
- [ ] Đăng ký: các trường, nhóm sinh hoạt, required, ảnh, kiểm tra SĐT và mã giới thiệu.
- [ ] Auth: SĐT/mã + mật khẩu → OTP; đổi mật khẩu → OTP mới.
- [ ] Hồ sơ: thành viên cập nhật được thông tin cơ bản.
- [ ] Lớp: Tâm Lý Đạo Đức thuộc Chúng thiếu nhi; đăng ký/hủy; quản lý lớp xem học viên được phân công.
- [ ] Quyền: thành viên không có bảng quản lý/cấu hình; quản lý lớp không quản lý toàn bộ thành viên.
- [ ] Cấu hình: bật/tắt required; chưa nhắc tài khoản cũ bổ sung.
- [ ] Mobile: menu, biểu mẫu, bảng cuộn ngang và hộp thoại.

36 thành viên, lớp, lịch học và số điện thoại đều là dữ liệu giả. Dữ liệu này phục vụ thử local. Backend đang chạy theo ARCHITECTURE.md; chưa dùng SMS/Supabase/R2 thật.

- [ ] Ba nhóm sinh hoạt: chọn trong hồ sơ, cột bảng, bộ lọc và xuất CSV.

- [ ] Không còn các thẻ thống kê, trạng thái sinh hoạt/chờ xác nhận, nút xác nhận hoặc thêm huynh đệ của quản lý.
- [ ] Câu chữ trên tổng quan, tìm kiếm, Auth, hồ sơ, lớp, cấu hình và thông báo phù hợp với Đạo Tràng.

- [ ] Đăng ký hai hồ sơ chung SĐT; đăng nhập bằng SĐT cần mã thành viên đích; OTP/SMS preview chỉ rõ tài khoản, mã khác account/purpose không dùng chéo được.
