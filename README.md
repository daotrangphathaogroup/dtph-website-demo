# Cổng thông tin Đạo Tràng Phật Hào

Next.js App Router + TypeScript, API Route Handler dùng nghiệp vụ backend Node.js, database PostgreSQL chạy nhúng bằng PGlite. Dữ liệu được lưu trên ổ đĩa, không còn dùng localStorage. Bản local không cần Docker, Supabase account hoặc dịch vụ SMS.

## Chạy local

Yêu cầu Node.js 24 trở lên.

```sh
npm install
npm run dev
```

Mở **http://127.0.0.1:5173/**. Lệnh này chạy Next.js tại port 5173, gồm giao diện và `/api/*`. Không cần mở backend port 3001 riêng. Chỉ chạy một tiến trình Next.js trên cùng database local.

## Tài khoản mẫu

| Mã | Vai trò | Mật khẩu ban đầu |
|---|---|---|
| PH00001 | Quản lý tổng | PhatHao@123 |
| PH00002 | Quản lý lớp Tâm Lý Đạo Đức | PhatHao@123 |
| PH00003 | Huynh đệ | PhatHao@123 |

PH00001 và PH00003 cùng SĐT **0901200000**. Đăng nhập bằng số này phải nhập thêm mã thành viên. Có thể đăng nhập trực tiếp bằng mã. OTP do backend tạo và được hiển thị trên màn xác thực để thử; nội dung SMS có mã thành viên. Chưa gửi SMS thật.

Sau khi đăng ký, dùng mật khẩu đã nhập để đăng nhập lại. Đổi mật khẩu có hiệu lực thật trong database local; mật khẩu mẫu cũ không còn dùng được cho tài khoản đã đổi. Không có bộ chọn vai trò hay nút bỏ qua đăng nhập.

## Các luồng hoạt động

- Đăng ký sinh hoạt → cấp mã bằng sequence → xác thực OTP → kích hoạt tài khoản và đăng nhập.
- Đăng nhập mã/SĐT + mật khẩu → OTP riêng của tài khoản → cookie phiên HttpOnly.
- Cập nhật hồ sơ, ảnh đại diện được backend chuyển lại thành WebP và lưu trên máy.
- Đổi mật khẩu qua OTP mới và grant một lần; đăng xuất các phiên khác.
- Đăng ký/hủy lớp; quản lý lớp xem liên hệ học viên lớp được phân công, hủy đăng ký của học viên.
- Quản lý tổng xem/sửa hồ sơ, lọc/sắp xếp/CSV và cấu hình trường bắt buộc.
- Ba nhóm: Chúng thiếu nhi, Chúng thanh niên, Đạo tràng. Lớp Tâm Lý Đạo Đức thuộc Chúng thiếu nhi.

## Dữ liệu và kiểm thử

- `.local/postgres/`: database PostgreSQL, giữ lại khi tắt/mở backend.
- `.local/avatars/`: ảnh WebP local, mô phỏng nơi lưu object trên R2.
- `server/migrations/001_initial.sql`: schema, khóa ngoại, index và sequence.
- `server/seed.mjs`: 36 hồ sơ giả và quyền thử nghiệm; chỉ seed khi database chưa có hồ sơ.
- `npm test`: integration tests với database tạm riêng; không sửa database đang dùng.
- `npm run build`: kiểm tra TypeScript, build Next.js và kiểm tra gói API không chứa database local/file môi trường.

Không đưa `.local/` vào Git. Dữ liệu frontend cũ trong localStorage không tự nhập vào database. Khi cần sao lưu local, dừng backend rồi sao chép cả thư mục `.local/`.

Đây là backend để thử local. SMS và lưu ảnh R2 vẫn được mô phỏng; chưa kết nối Supabase Auth/PostgreSQL hay Cloudflare R2 thật. `npm run dev` dùng database local; `npm run build` + `npm start` dùng adapter cloud và cần các biến môi trường Supabase/R2/SMS. Xem [kiến trúc đang chạy](docs/ARCHITECTURE.md) và [kế hoạch production](docs/PRODUCTION-PLAN.md).

## Chuẩn bị triển khai cloud

Đã có `vercel.json`, Next.js Route Handler, adapter Supabase PostgreSQL, R2 private và SMS Twilio; cấu hình mẫu ở `.env.example`. Xem [hướng dẫn triển khai](docs/DEPLOYMENT.md). Các tài nguyên cloud chưa được tạo/kết nối; chỉ đã chuẩn bị mã và kiểm thử adapter. Auth vẫn do backend quản lý. Không chuyển dữ liệu local lên cloud tự động.
