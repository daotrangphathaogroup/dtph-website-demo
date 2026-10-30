# Frontend redesign · 27/10/2026

## Audit

Next.js 16.3.8 App Router, React 19, TypeScript. Đã đọc frontend đang hoạt động trước khi sửa. App.tsx cũ gộp navigation, refresh/phiên, duyệt và modal. CSS cũ gồm 1.827 dòng lịch sử và theme 348 dòng, nhiều selector ghi đè.

Giữ URL, API, schema, phân quyền, cookie và luồng nghiệp vụ. Không sửa backend, src/lib hoặc dependency manifest. Không thay đổi hồ sơ, tài khoản hoặc ảnh trong local/Supabase/R2; kiểm tra đăng nhập chỉ tạo và kết thúc phiên local. Tests dùng database tạm. ClassManagement cũ không được App import; giữ nguyên nguồn.

## Kiến trúc

- `src/App.tsx`: điều phối màn hình và các thao tác nghiệp vụ; next/dynamic tách dashboard, search, accounts, password và hồ sơ.
- `src/components/layout/WorkspaceShell.tsx`: topbar/logo/sidebar/drawer/account menu.
- `src/components/ui/`: Button/IconButton, Card/Header, Field, Badge, SearchField, SegmentedControl, Feedback, Empty/Loading/Skeleton, Pagination, Dialog.
- `src/features/dashboard/`: filters, charts, member list. Search trong list không render lại cả dashboard.
- `src/features/members/`: pending registrations, profile dialog, sheet toolbar.
- `src/features/home/`: nội dung trang chủ.
- `src/hooks/usePortalData.ts`: bootstrap/polling cũ, gộp refresh đồng thời.
- `src/hooks/useMemberSheet.ts`: search/filter/sort/select/CSV/preferences; pointer updates gom qua requestAnimationFrame, lưu preferences sau 200 ms và khi rời bảng.
- `src/styles.css`: một entry import tokens/base/components/workspace/dashboard/sheet/forms. Bỏ CSS lịch sử và theme override.

## Thiết kế

Palette đúng yêu cầu: #F5F5F7 / #FFFFFF / #ECEEF2 / #17181B / #777B85 / #111111 / #DCE6F8 / #E8E9ED. Giữ logo. Geist tự phục vụ qua Next, Latin + tiếng Việt, swap và fallback metrics. Spacing 4 px, weight 400/500/600, góc 6/8/12 px. Không thêm UI/animation library; không backdrop-filter hay will-change. Gradient chỉ dùng để vẽ biểu đồ.

Giữ Sidebar/Header/Main và thứ tự thống kê → charts → chờ duyệt → danh sách. Tablet charts một cột; mobile drawer, form một cột và bảng cuộn bên trong. Phân trang giới hạn tối đa 100 dòng, không cần virtualization. Giữ cột sticky, resize chuột/bàn phím, chọn cột/mật độ, CSV và lưu tùy chỉnh.

## Tính năng bảo toàn

Public: trang chủ, quick search debounce, 3 form schema, ảnh/camera/crop WebP, Không/Khác và workplace conditional, tự chọn/sửa Tổ, chọn đúng huynh đệ theo ID, hoàn tất một nút về trang chủ. Staff: login, refresh focus/30 giây, logout/password. Dashboard: toàn bộ/riêng từng chúng, tất cả bộ lọc kết hợp, số liệu thực, charts, list/sheet/search/sort/pagination/CSV. Admin/Dev: xem/sửa, duyệt/từ chối và giữ hồ sơ. Dev: tạo/list/reset password/delete nhân sự, không đọc mật khẩu hiện tại.

## Accessibility và trạng thái

Skip link, aria-current, form labels, table caption/scope, chart labels và live regions. Native dialog ở giữa, focus containment/Escape/return focus/body lock. Mobile drawer focus trap + aria-modal + inert phía sau; account menu Escape/outside click. Shared loading/empty/error/success. Trang 404 và runtime error cùng visual language; error boundary độc lập feature/UI modules. Tôn trọng reduced motion.

## Đo production local trước/sau

Warm-up một request/route, lấy median TTFB của 7 request; tính gzip mặc định của script/CSS trực tiếp trong HTML. Có cả framework/runtime; không gồm dynamic chunks sau tương tác. Không đo execution/render trình duyệt.

| Route | JS gzip KB trước → sau | CSS gzip KB trước → sau | TTFB median ms trước → sau |
| --- | --- | --- | --- |
| `/` | 200.6 → 193.3 | 16.6 → 11.2 | 2.57 → 2.46 |
| `/dang-ky-thong-tin` | 177.6 → 178.5 | 16.6 → 11.2 | 2.09 → 2.2 |
| `/dang-ky-thong-tin/chung-thieu-nhi` | 185.3 → 191.1 | 16.6 → 11.2 | 1.76 → 1.94 |
| `/quan-tri` | 178.9 → 185.8 | 16.6 → 11.2 | 1.82 → 1.87 |

CSS nén giảm 32,3%; JS ban đầu trang chủ giảm 3,6%. JS form/login tăng do component/trạng thái mới; không tuyên bố mọi route nhẹ hơn. Geist thêm 2 WOFF2 tổng 37,3 KB lần đầu (trước đó dùng system font). Tổng tải lạnh vì thế không thể kết luận giảm chỉ từ JS/CSS. Font được cache, trình duyệt không gọi Google. TTFB loopback không đại diện mạng/API hay UX thực tế.

Đo lại bằng `npm run build`, `npm run start`, rồi `node scripts/measure-frontend.mjs .local/audits/after-redesign.json`. JSON trước/sau trong `.local/audits/` (gitignore), không có dữ liệu cá nhân.

## Kiểm chứng

- TypeScript, production build, deployment trace và diff check: đạt. Không đóng gói local DB/env/fixtures.
- 46 tests đạt: 40 nghiệp vụ + 6 SSR contract frontend (navigation theo role, form, sheet 25 dòng, quyền duyệt/xem/sửa, dashboard, hoàn tất). Contract render không thay thế click/focus/resize trong browser thật.
- HTTP smoke test: tất cả route hiện có trả 200, trang không tồn tại trả 404 có giao diện chung; public bootstrap không lộ hồ sơ; đăng nhập/đăng xuất Dev local đạt, giữ 360 hồ sơ và 12 đăng ký chờ duyệt.
- Format check đạt. Project chưa cấu hình ESLint; không tuyên bố chạy ESLint.
- Browser QA bị chặn: tab hiện là error page dạng data: và công cụ từ chối URL policy. Không dùng đường vòng vượt chặn.
- Chưa kiểm chứng visual responsive trong browser thật; chưa đo Lighthouse/CLS/LCP/INP. Không công bố đạt 90/0.1/2.5s/200ms. Cần đo browser production trên desktop/tablet/mobile với dữ liệu đại diện trước khi xác nhận các ngưỡng này.
