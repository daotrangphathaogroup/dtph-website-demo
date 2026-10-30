# Design DNA · Pastel Workspace

Áp dụng ảnh mẫu ngày 30/10/2026 vào website Đạo Tràng Phật Hào.

- `pastel-dashboard.dna.json`: hồ sơ đầy đủ ba lớp design_system / design_style / visual_effects.
- `pastel-dashboard-reference.measurement.json`: đo màu bằng script chính thức của skill design-dna, lấy mẫu xác định 160.000 pixel, k = 8. Giữ nguyên hex, coverage và cấu hình đo.
- `pastel-dashboard-reference.samples.json`: các mẫu median 5×5 pixel để tách riêng các vùng pastel/sidebar/chart từ ảnh.

Nền gần trắng #FBFCFD, chữ/CTA #262728 và xanh đồ thị #3889C3 lấy từ phép đo. Nền pastel dùng màu từ các vùng ảnh gốc, được dựng bằng CSS gradient tĩnh, không dùng backdrop blur/WebGL/animation. Các màu chữ phụ được điều chỉnh độ tối để đạt tương phản: #626E74 đạt 5,2:1 và #306B94 đạt 5,69:1 trên surface #FEFEFE.

Token nằm trong `src/styles/tokens.css`. Các layer workspace, components, dashboard, forms và sheet dùng chung token. Logo, tiếng Việt, URL, dữ liệu và các quyền hiện có được giữ nguyên. Header vẫn liên tục, logo ở topbar; sidebar giữ thu gọn và drawer mobile. Mobile bỏ khung pastel ngoài để dành diện tích cho nội dung.

Dashboard giữ cả donut, phân bố và biểu đồ cột theo tháng. Bổ sung lựa chọn đường/vùng tô với dữ liệu tháng thực tế; không nội suy thêm lượt đăng ký hoặc thêm chỉ số tăng trưởng giả. SVG co giãn bằng ResizeObserver, tooltip dùng hover/focus và phím mũi tên. Không thêm dependency vào project.

Kiểm tra ngày 30/10/2026: TypeScript, 49 tests, production build, deployment trace và diff check đạt. Tests có ba trường hợp cho chart geometry: bảo toàn dữ liệu 12 tháng, dữ liệu rỗng/zero và thay đổi chiều rộng. Các test nghiệp vụ vẫn dùng database tạm, không reset dữ liệu local hoặc Supabase.

## Giới hạn kiểm chứng ảnh

Phiên này không có công cụ chụp trình duyệt. Chưa có ảnh render website nên chưa chạy `verify.mjs`, chưa có kết quả PASS/FAIL về ΔE hay độ phủ màu. Không dùng một hình mô phỏng thay cho ảnh render thực tế.

Khi có ảnh chụp website thực tế, chạy script trong skill với đường dẫn tuyệt đối:

```sh
node /Users/hoanganh/.codex/skills/design-dna/scripts/verify.mjs "/absolute/path/to/website-screenshot.png" "/Users/hoanganh/Workspace/Dao Trang Phat Hao/docs/design-dna/pastel-dashboard.dna.json"
```

Bộ đo dùng lại k = 8 từ DNA. Nếu báo FAIL cần kiểm tra màu sai và tỷ lệ nền/khung trong screenshot, không đổi dữ liệu thống kê chỉ để khớp ảnh tham khảo.

## Management workspace revision — 2026-10-30

The active design is now `management-workspace.dna.json`, derived from the user's neutral issue-management reference (`management-reference.measurement.json`). The earlier pastel profile is retained only as historical analysis.

This revision changes information architecture, not only component colors:
- Edge-to-edge gray shell; no gradient or decorative outer frame.
- Records are the default view. Review queue and statistics are separate modes with actual counts.
- Compact filter popup, removable active conditions, shared filtering across all three modes.
- Small inline counts replace statistic cards; analytic charts render only when requested.
- Practical home links and compact registration choices replace large promotional cards.
- Utility icon tooltips appear after 450ms hover or keyboard focus; Escape dismisses them. Floating labels do not shift data rows. Native titles remain available in modal top layers.
- Role restrictions, form schemas, approval logic and data are preserved.

Color verification was rerun against an actual Chromium render at 1200 × 1098. The automated whole-image palette comparison remains **FAIL** (see `management-verification.json`), not a claimed visual-fidelity pass. Its eight-cluster output merges the two broad neutral backgrounds, and source status accents have different area coverage in the real records table. Measured background, sidebar, foreground and amber tokens are applied directly; the design does not add decorative colored blocks to force screenshot coverage. The logo and synthetic portrait colors remain intact.

Visual and functional checks use actual local Chromium screenshots, including 320/390/760/988/1200/1440px widths. See the task report for final verification results. No production data or service configuration is changed.

Final validation: TypeScript passes; all 49 tests pass; optimized Next.js build passes. Local Chromium functional checks passed for filters and individual chip removal, Escape dismissal, search, CSV download, group sheet, review profile dialog, statistics, delayed tooltip, mobile drawer, and public forms. Widths 320, 390, 760 and 988px do not overflow the document. The mobile sheet name-header resize handle was corrected to stay within its scrolling container. Final browser run also checked console errors and uncaught page errors: none. Screenshots are stored under `.local/audits/management-redesign/`.

## Overview dashboard composition — 2026-10-30

The subsequent three-reference request applies only to the all-group **Tổng quan** page:
- Reference 1 supplies composition: inline group/ward/team/age filters, month and year, five metrics, composition/distribution charts, monthly registrations and member table.
- Reference 2 supplies the existing neutral workspace surfaces and restrained utility controls.
- Reference 3 supplies thin blue chart strokes, lightly fading area, subtle grids and white data tooltip. The exterior gradient is intentionally not imported into the management shell.

`OverviewFilters.tsx` controls the same combined filters as all existing statistics and records. `ManagementDashboard.tsx` renders the all-group dashboard at once, while scoped group pages retain their task modes. Pending records sit in a compact disclosure, opened and scrolled to from the pending metric. Counts and all twelve monthly values come from real approved/pending local data. No fabricated growth rates, smoothed values or decorative chart samples are added.

Chromium checks: simultaneous charts/metrics/table, combined team/month filtering, reset, distribution dimensions, keyboard chart tooltip, pending disclosure jump, no document overflow at 320/390/760/988/1440px, group modes preserved, no console or page errors. Automated suite: 50 tests.
