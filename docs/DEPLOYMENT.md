# Triển khai project lên Vercel + Supabase + Cloudflare R2

Đối chiếu tài liệu chính thức ngày 02/10/2026. Hướng dẫn dành cho mã nguồn hiện tại: Next.js App Router, Node.js 24, PostgreSQL qua `pg`, R2 qua AWS SDK, SMS qua Twilio. Chưa thực hiện triển khai thật.

## 1. Hiểu các dịch vụ cần cấu hình

| Dịch vụ | Công việc trong project |
|---|---|
| Vercel | Chạy giao diện Next.js và API `/api/*` |
| Supabase | Lưu PostgreSQL trong schema riêng `phat_hao` |
| Cloudflare R2 | Lưu ảnh đại diện WebP trong bucket private |
| Twilio | Gửi SMS OTP cho đăng ký, đăng nhập, đổi mật khẩu |

Auth do backend ứng dụng quản lý, không dùng Supabase Auth. Không cần Supabase anon/publishable/service-role key, không cần bật Phone Auth trên Supabase. Backend lưu mật khẩu đã hash, phiên đăng nhập và OTP; SĐT không unique, nhiều tài khoản vẫn dùng chung một số. SMS có mã thành viên, OTP chỉ dùng cho đúng tài khoản và mục đích tương ứng.

Mặc định các công tắc xác thực SMS, email và Google đều tắt. Đăng ký/đăng nhập dùng mật khẩu, không cần mua API gửi tin. Quản lý tổng có thể thay đổi trong **Cấu hình đăng ký → Tính năng xác thực**; cấu hình lưu trong `app_meta`, không cần migration riêng cho công tắc. Email vẫn unique, SĐT vẫn được dùng chung; cả hai là thông tin liên hệ/chỉ danh đăng nhập, chưa được xác minh quyền sở hữu khi công tắc tắt. Dữ liệu local và tài khoản mẫu không tự chuyển lên cloud.

## 2. Chuẩn bị máy và mã nguồn

Mở Terminal:

```sh
cd /Users/hoanganh/Workspace/dtph-website-test01
node -v
npm ci
npm test
npm run build
```

Dùng Node.js 24.x để khớp `package.json`. Build phải kết thúc thành công và có dòng:

```text
Deployment trace checked: no local database, environment files or test data.
```

Project đã có `.gitignore`, `.vercelignore` và Next tracing exclusions cho dữ liệu local/secret. Không đưa `.local/` lên cloud. Nếu sao lưu database local, dừng tiến trình Next.js rồi sao chép cả `.local/`; sau đó có thể chạy lại `npm run dev`.

Hướng dẫn dùng Vercel CLI, không bắt buộc có GitHub repo. Khi có repo Git riêng, có thể kết nối Vercel để tự deploy các lần cập nhật sau.

## 3. Tạo Supabase project và lấy connection strings

1. Mở https://supabase.com/dashboard, chọn tổ chức rồi tạo project mới dành cho Đạo Tràng.
2. Đặt tên, lưu Database Password trong trình quản lý mật khẩu. Đây là mật khẩu PostgreSQL, khác mật khẩu đăng nhập Supabase và tài khoản huynh đệ.
3. Chọn khu vực gần người dùng. Nếu chọn Singapore, bước Vercel Functions cũng nên chọn khu vực gần database.
4. Chờ database khởi tạo, mở **Connect**.
5. Copy connection string **Transaction pooler** để dùng cho `DATABASE_URL` trên Vercel.
6. Copy connection string **Session pooler** để dùng cho `MIGRATION_DATABASE_URL` trên máy. Direct connection cũng dùng được nếu mạng máy hỗ trợ kết nối đó.

Hai chuỗi có dạng sau; phải copy host chính xác từ project của bạn:

```dotenv
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@POOLER_HOST:6543/postgres
MIGRATION_DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@POOLER_HOST:5432/postgres
```

Thay PASSWORD bằng Database Password đã URL-encode nếu có ký tự đặc biệt. Không suy ra pooler host từ tên vùng. Shared pooler hỗ trợ IPv4, còn Direct connection thường dùng IPv6 nếu chưa có IPv4 add-on. Transaction mode phù hợp cho serverless. [Tài liệu kết nối Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).

Backend hiện dùng transaction và `SET LOCAL search_path`, không dùng prepared statements có tên. Pool hiện giới hạn 3 kết nối mỗi instance; khi tăng tải cần theo dõi giới hạn database và cân nhắc hạ pool, không tăng tùy ý.

Trong **Database Settings → SSL Configuration**, có thể bật Enforce SSL. Backend hiện xác minh chứng chỉ TLS. Nếu gặp lỗi CA, tải certificate của project và điền `DATABASE_SSL_CA`; không sửa code để tắt `rejectUnauthorized`. [Tài liệu SSL Supabase](https://supabase.com/docs/guides/platform/ssl-enforcement).

## 4. Tạo file cấu hình riêng trên máy

Nếu chưa có `.env.production`, copy `.env.example` và đặt tên bản sao là `.env.production` trong thư mục project. Nếu đã có file thì chỉnh file hiện có, không ghi đè các giá trị đang dùng. Điền trước hai connection strings ở bước trên.

File này dùng cho migration/cấp quyền trên máy; Vercel cần được nhập biến riêng ở bước 8. File đã bị Git/Vercel ignore. Không gửi file hoặc mật khẩu qua chat.

Tạo `OTP_SECRET` bằng lệnh sau trên máy rồi copy kết quả vào file:

```sh
node -e 'console.log(require("node:crypto").randomBytes(32).toString("hex"))'
```

Secret này giữ nguyên giữa các lần deploy, tối thiểu 32 ký tự. Đổi secret sẽ làm các OTP đang chờ mất hiệu lực.

Nếu cần CA, biến có thể dùng PEM một dòng với ký tự `\n`:

```dotenv
DATABASE_SSL_CA="-----BEGIN CERTIFICATE-----\nNOI_DUNG_CERTIFICATE\n-----END CERTIFICATE-----"
```

Giữ nguyên nội dung certificate đã tải. Khi nhập vào Vercel có thể paste PEM nhiều dòng; backend xử lý được cả newline thật và `\n`.

Nếu log báo `SELF_SIGNED_CERT_IN_CHAIN`, kiểm tra `DATABASE_SSL_CA` trên Vercel Production: giá trị phải là toàn bộ PEM của certificate đã tải, gồm BEGIN/END và phần nội dung thật ở giữa. Không nhập đường dẫn file, tên file, dấu ngoặc kép bao ngoài hoặc nội dung placeholder. Lưu biến rồi redeploy.

Project dùng `pg` với cấu hình SSL trong code. Không thêm `sslmode`, `sslrootcert`, `sslcert` hoặc `sslkey` vào query string của DATABASE_URL/MIGRATION_DATABASE_URL: các tham số này có thể ghi đè SSL object và làm mất CA được cung cấp. [Tài liệu SSL node-postgres](https://node-postgres.com/features/ssl).

## 5. Tạo bảng trên Supabase

Trong Terminal tại thư mục project:

```sh
npm run db:migrate
```

Kết quả mong đợi:

```text
Supabase schema migration completed. No demo members created.
```

Lệnh đọc `MIGRATION_DATABASE_URL` từ `.env.production` và chạy `supabase/migrations/202610020001_initial.sql`. Chỉ chạy vào đúng project mới dành cho ứng dụng.

Cách khác nếu không kết nối được từ máy: mở **SQL Editor** của đúng Supabase project, tạo query, paste toàn bộ nội dung file migration và Run. Chọn một trong hai cách.

Kiểm tra bằng SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'phat_hao'
ORDER BY table_name;

SELECT id, name, group_id FROM phat_hao.classes;
SELECT count(*) AS member_count FROM phat_hao.members;
```

Trước khi có người đăng ký, `member_count` phải là 0. Lớp Tâm Lý Đạo Đức đã được tạo. Migration tạo schema riêng, bật RLS và thu hồi quyền của PUBLIC/anon/authenticated. Không thêm `phat_hao` vào exposed schemas của Data API. Backend hiện kết nối bằng tài khoản postgres có quyền cao và kiểm tra quyền người dùng ở API; connection string phải chỉ nằm ở server.

Không chạy script seed local lên Supabase. Lệnh migration này dùng khởi tạo schema hiện tại; thay đổi schema tương lai cần migration mới.

## 6. Tạo R2 bucket và thông tin S3

1. Mở Cloudflare Dashboard, chọn đúng tài khoản.
2. Vào **Storage & databases → R2 → Overview**; kích hoạt R2 nếu tài khoản chưa bật, kiểm tra điều kiện thanh toán hiển thị trong dashboard.
3. Chọn **Create bucket**, tên ví dụ `phat-hao-avatars`.
4. Dùng bucket thông thường với endpoint toàn cầu; adapter hiện chưa có cấu hình endpoint cho bucket có jurisdiction riêng.
5. Giữ bucket private: không bật r2.dev/Public Development URL hoặc Custom Domain public.
6. Quay lại Overview, mục API Tokens chọn **Manage**.
7. Tạo **Account API token** hoặc **User API token** với quyền **Object Read & Write**, chọn **Apply to specific buckets only** và đúng bucket vừa tạo.
8. Lưu **Access Key ID**, **Secret Access Key** và **Account ID**. Secret Access Key chỉ hiện lúc tạo. [Hướng dẫn S3](https://developers.cloudflare.com/r2/get-started/s3/), [thông tin xác thực R2](https://developers.cloudflare.com/r2/api/tokens/).

Điền vào `.env.production`:

```dotenv
R2_ACCOUNT_ID=ACCOUNT_ID_CUA_BAN
R2_ACCESS_KEY_ID=ACCESS_KEY_ID_CUA_BAN
R2_SECRET_ACCESS_KEY=SECRET_ACCESS_KEY_CUA_BAN
R2_BUCKET=phat-hao-avatars
```

Account ID khác Zone ID và Access Key ID. Không dùng Cloudflare Global API Key thay cho S3 credentials. Backend tự tạo endpoint `https://ACCOUNT_ID.r2.cloudflarestorage.com` và ghi object dưới `avatars/`. Browser tải ảnh qua API có xác thực; kiến trúc này không cần bật bucket public hay cấu hình browser CORS cho R2.

## 7. Cấu hình SMS để mở đăng ký/đăng nhập

Adapter hiện hỗ trợ Twilio. Nếu chọn nhà cung cấp Việt Nam khác thì cần thêm adapter trước.

Trên Twilio, lấy Account SID/Auth Token và cấu hình sender hoặc Messaging Service được phép gửi SMS tới số Việt Nam. Kiểm tra thử khả năng gửi tới SĐT thật trước khi mở website cho huynh đệ. Điều kiện sender/đăng ký phụ thuộc tuyến gửi; không giả định một số Twilio bất kỳ sẽ dùng được. [Hướng dẫn SMS Việt Nam](https://www.twilio.com/en-us/guidelines/vn/sms).

Điền:

```dotenv
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACCOUNT_SID_CUA_BAN
TWILIO_AUTH_TOKEN=AUTH_TOKEN_CUA_BAN
TWILIO_MESSAGING_SERVICE_SID=MESSAGING_SERVICE_SID_CUA_BAN
```

Hoặc bỏ Messaging Service SID và dùng `TWILIO_FROM` của sender đã được Twilio cho phép. Trong adapter hiện tại, Messaging Service SID được ưu tiên nếu cả hai cùng có giá trị. Adapter gọi Messages API với To/Body và một trong hai cách chọn sender. [Twilio Messages API](https://www.twilio.com/docs/messaging/api/message-resource).

Để tạm thử đăng ký/đăng nhập/đổi mật khẩu mà không gửi SMS, đặt `SMS_PROVIDER=preview` trên Vercel Production rồi deploy mã mới, sau đó bật công tắc SMS trong Cấu hình đăng ký. Mã OTP sẽ hiển thị trong bước xác thực cùng thông báo thử nghiệm; không cần Twilio credentials. Mật khẩu, cookie, giới hạn OTP và quyền tài khoản vẫn được kiểm tra, nhưng đây không còn là xác thực hai yếu tố thật. Health trả `sms: "preview"`, `ready: false` để phân biệt với SMS thật. Khi mở sử dụng thật, chuyển lại `twilio` và cung cấp credentials/sender.

`SMS_PROVIDER=disabled` tắt dịch vụ gửi SMS. Khi công tắc SMS tắt (mặc định), đăng ký/đăng nhập hoạt động trực tiếp bằng mật khẩu; đổi mật khẩu yêu cầu mật khẩu hiện tại. Khi công tắc SMS bật mà provider không sẵn sàng, OTP bị chặn. Tắt công tắc sẽ vô hiệu các challenge/grant chưa sử dụng và ẩn UI OTP.

## 8. Tạo Vercel project và nhập biến môi trường

Trong Terminal:

```sh
npx vercel@latest login
npx vercel@latest link
```

Chọn đúng tài khoản/team, tạo project mới hoặc link project đã có; thư mục gốc là thư mục hiện tại. `link` chỉ liên kết project, chưa deploy. [Vercel link](https://vercel.com/docs/cli/link).

Mở project trên Vercel Dashboard, kiểm tra **Settings → Build and Deployment**:

| Mục | Giá trị |
|---|---|
| Framework Preset | Next.js |
| Root Directory | Gốc project |
| Node.js Version | 24.x |
| Build Command | `npm run build` |
| Install Command | Mặc định hoặc `npm ci` |
| Output Directory | Mặc định Next.js, không override thành `dist` |

Vercel hiện hỗ trợ Node.js 24.x; `engines.node` trong project cũng là 24.x. [Node.js trên Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [Next.js trên Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).

Mở **Settings → Functions → Function Regions**, chọn vùng gần Supabase; nếu database ở Singapore và dashboard cho chọn Singapore thì dùng vùng đó. [Cấu hình vùng Functions](https://vercel.com/docs/functions/configuring-functions/region).

Xác định domain production trong **Settings → Domains**. Dùng domain ổn định đã được Vercel gán hoặc domain riêng, không dùng URL riêng của một deployment làm domain chính nếu nó thay đổi ở lần deploy tiếp.

Mở **Settings → Environment Variables**, thêm các biến sau, chọn môi trường **Production**:

| Biến | Nội dung |
|---|---|
| `APP_ORIGIN` | Origin HTTPS chính xác của domain production |
| `DATABASE_URL` | Transaction pooler 6543 của Supabase |
| `DATABASE_SSL_CA` | PEM certificate nếu cần; có thể bỏ khi không cần |
| `OTP_SECRET` | Secret đã tạo ở bước 4 |
| `R2_ACCOUNT_ID` | Account ID Cloudflare |
| `R2_ACCESS_KEY_ID` | S3 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | S3 Secret Access Key |
| `R2_BUCKET` | Tên bucket chính xác |
| `SMS_PROVIDER` | `twilio`, `preview` (thử nghiệm) hoặc `disabled` |
| `TWILIO_ACCOUNT_SID` | Bắt buộc khi dùng Twilio |
| `TWILIO_AUTH_TOKEN` | Bắt buộc khi dùng Twilio |
| `TWILIO_MESSAGING_SERVICE_SID` | Messaging Service SID, hoặc thay bằng `TWILIO_FROM` |

Ví dụ `APP_ORIGIN=https://ten-site-cua-ban.vercel.app`, không có `/` cuối, không có đường dẫn. Đây là giá trị mẫu; thay bằng domain thực tế của bạn. Backend chỉ cho phép mutation từ origin này. Không đưa `MIGRATION_DATABASE_URL` lên Vercel, không thêm tiền tố `NEXT_PUBLIC_` vào secret, không cần đặt `APP_BACKEND` hay `NODE_ENV` trên Vercel.

Các thay đổi biến môi trường cần deployment mới để có hiệu lực. [Quản lý biến môi trường](https://vercel.com/docs/environment-variables/managing-environment-variables).

## 9. Deploy và kiểm tra API

Sau khi migration và environment đã xong:

```sh
npm test
npm run build
npx vercel@latest deploy --prod
```

CLI upload source, Vercel cài dependencies/build và trả URL. Kiểm tra trạng thái Ready và domain production thực tế. Nếu domain khác `APP_ORIGIN`, sửa biến theo domain đúng rồi deploy lại trước khi thử đăng ký.

Đừng coi `vercel` không có `--prod` là luôn an toàn để tạo Preview: tài liệu hiện tại nói lần deploy đầu của project mới là Production kể cả không có cờ. Với các lần sau, `--prod` chỉ định Production. [Vercel deploy](https://vercel.com/docs/cli/deploy).

Mở `https://DOMAIN_THAT_CUA_BAN/api/health`. Khi SMS đã cấu hình, kết quả mong đợi:

```json
{
  "ok": true,
  "database": "Supabase PostgreSQL",
  "sms": "configured",
  "ready": true
}
```

Khi công tắc SMS tắt, `sms` là `disabled`, `ready` là true vì đăng nhập dùng mật khẩu. Health chỉ xác nhận query database và trạng thái cấu hình SMS; không chứng minh đã gửi SMS hay upload R2 thành công. Cần thử từng luồng ở bước tiếp theo.

## 10. Tạo quản lý tổng đầu tiên

1. Trên website production, đăng ký tài khoản người phụ trách bằng SĐT thật.
2. Nhập OTP nhận được, hoàn tất xác minh. Ghi lại mã thành viên của tài khoản vừa đăng ký; không mặc định luôn là PH00001.
3. Trong `.env.production` trên máy, đảm bảo `DATABASE_URL` là đúng database production.
4. Chạy, thay mã ví dụ bằng mã đã xác minh:

```sh
npm run admin:promote -- PH00001
```

5. Đăng xuất và đăng nhập lại tài khoản, kiểm tra các mục quản lý huynh đệ/cấu hình đăng ký.

Script chỉ cấp quyền cho tài khoản đã xác minh. Không dùng các tài khoản/mật khẩu mẫu local cho production. Khi công tắc SMS tắt, tài khoản hoàn tất đăng ký trực tiếp bằng mật khẩu; trường verified trong schema hiện tại biểu thị tài khoản đã kích hoạt, không chứng minh SĐT/email đã xác minh.

## 11. Nghiệm thu trước khi mời huynh đệ sử dụng

- Đăng ký và đăng nhập tài khoản thật, nhận được SMS có đúng mã thành viên.
- Đăng ký hai tài khoản cùng SĐT; đăng nhập bằng mã riêng; đăng nhập bằng số chung phải chọn đúng mã. OTP tài khoản A không dùng cho B.
- Đổi mật khẩu qua OTP, mật khẩu mới có hiệu lực, phiên khác bị thu hồi.
- Cập nhật hồ sơ và upload ảnh; object `.webp` xuất hiện trong R2, ảnh hiển thị lại sau đăng nhập.
- Supabase có các bản ghi tương ứng trong schema `phat_hao`.
- Tài khoản huynh đệ không được truy cập dữ liệu/quyền quản lý tổng.
- Đăng ký/hủy lớp Tâm Lý Đạo Đức và kiểm tra quyền quản lý lớp.

## 12. Domain riêng và Preview

Nếu dùng domain riêng, mở Vercel **Settings → Domains**, thêm domain, cấu hình đúng A/CNAME được dashboard hiển thị tại nơi quản lý DNS. Không chép IP/CNAME của một hướng dẫn cũ. Khi domain valid/HTTPS hoạt động, đổi `APP_ORIGIN` sang domain chính và deploy lại; cấu hình các domain phụ redirect về domain chính. [Domain Vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain).

Project chỉ chấp nhận một origin cho mutation. Preview cần môi trường riêng với `APP_ORIGIN` đúng URL được dùng; khuyến nghị staging project/domain ổn định và database/bucket riêng. Không copy toàn bộ production secrets sang mọi Preview theo mặc định, không cho phép wildcard mọi URL vercel.app.

## 13. Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| Build báo Vite/dist hoặc không có script | Kiểm tra link đúng thư mục, framework Next.js, bỏ Output Directory override |
| API 503, log Missing production configuration | Điền đủ biến bắt buộc cho đúng environment rồi redeploy |
| Login/register 403 | Domain đang mở không khớp `APP_ORIGIN`; dùng domain chính hoặc sửa/redeploy |
| Relation/table does not exist | Migration chưa chạy hoặc đang trỏ nhầm Supabase project |
| Password authentication failed | Kiểm tra Database Password, username/host lấy từ Connect và URL-encoding |
| ENETUNREACH | Direct IPv6 không dùng được trên mạng; dùng shared pooler |
| Lỗi certificate | Cung cấp CA của project trong `DATABASE_SSL_CA`, giữ TLS verification |
| OTP không gửi | Kiểm tra SMS_PROVIDER, Twilio credentials/sender, số đích và delivery logs của Twilio |
| OTP cũ không dùng được | OTP có thời hạn, giới hạn thử và resend vô hiệu mã trước; dùng đúng mã/tài khoản |
| Upload/read avatar lỗi | Kiểm tra Account ID, bucket, S3 credentials/quyền bucket và endpoint thông thường |
| Sửa env mà lỗi vẫn còn | Deployment cũ vẫn dùng cấu hình cũ; deploy lại và mở đúng domain |

Vercel Runtime Logs giúp tìm lỗi server; Twilio logs giúp xác minh gửi/phát SMS; R2 Objects giúp xác minh ảnh đã upload.

## 14. Các phần chưa có trong bản hiện tại

Chưa có quên mật khẩu/email, nhắc bổ sung trường bắt buộc, UI tạo thêm lớp/phân quyền, pagination server hoặc tự dọn ảnh orphan. Khi bật công tắc SMS, production chặn đổi SĐT vì chưa có luồng xác minh số mới; khi tắt, cho phép cập nhật SĐT liên hệ; các trường hồ sơ khác vẫn cập nhật được. Các kiểm thử local/adapter không thay thế nghiệm thu trên dịch vụ thật.

Đây là hướng dẫn triển khai bản đang có. Build local thành công không đồng nghĩa cloud đã sẵn sàng; chỉ xác nhận hoàn tất sau khi kiểm tra database, SMS, R2 và các quyền trên deployment thực tế.

## Vùng chạy hiện tại của project

`vercel.json` hiện đặt `regions: ["hnd1"]` (Tokyo) để gần database được cấu hình ở `ap-northeast-1`. Nếu chuyển Supabase sang vùng khác, đổi vùng Functions tương ứng rồi deploy lại. Tránh để Functions ở Mỹ khi database ở châu Á: từng lượt truy vấn sẽ phải đi xa. [Bảng vùng Vercel](https://vercel.com/docs/regions).

## Bổ sung email — 05/10/2026

Trước khi deploy mã có email, chạy migration `supabase/migrations/202610050001_member_email.sql` trong SQL Editor của đúng project, hoặc chạy `npm run db:migrate` trên máy với `.env.production` đúng. Script migration hiện chạy các file SQL theo thứ tự tên; các migration đang có được viết idempotent để không xóa/reset dữ liệu.

Migration thêm members.email, unique index cho email không rỗng không phân biệt hoa/thường/khoảng trắng đầu cuối, và cấu hình email mặc định tùy chọn. Nhiều tài khoản cũ không có email vẫn hoạt động; SĐT dùng chung không thay đổi. Không cần biến môi trường email mới. Sau migration mới commit/push để Vercel tự deploy.

Đăng nhập hỗ trợ email + mật khẩu, SĐT + mật khẩu hoặc mã huynh đệ + mật khẩu. Khi bật công tắc SMS, OTP dùng SMS hoặc SMS_PROVIDER=preview; mặc định công tắc tắt nên không yêu cầu OTP; chưa có gửi/xác minh email hay khôi phục mật khẩu qua email. Email là thông tin riêng tư, chỉ người có quyền xem hồ sơ đầy đủ được nhận từ API.

## Đăng nhập Google

Xem [GOOGLE_LOGIN.md](./GOOGLE_LOGIN.md) để cấu hình Google Auth Platform, callback, hai biến môi trường server-only và migration Google. Không cần Gmail SMTP hoặc chuyển sang Supabase Auth.
