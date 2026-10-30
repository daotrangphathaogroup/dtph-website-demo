import Link from "next/link";
import { ChevronRight, ClipboardPen, KeyRound } from "lucide-react";
export default function HomeOverview({ isStaff }: { isStaff: boolean }) {
  return (
    <section className="home-directory" aria-label="Cổng thông tin Đạo Tràng">
      <p>Đăng ký hồ sơ sinh hoạt tại Đạo Tràng Phật Hào.</p>
      <Link href="/dang-ky-thong-tin" className="home-task">
        <ClipboardPen size={20} aria-hidden="true" />
        <span>
          <strong>Đăng ký thông tin</strong>
          <small>
            Dành cho Chúng thiếu nhi, Chúng thanh niên và Đạo tràng.
          </small>
        </span>
        <ChevronRight size={18} aria-hidden="true" />
      </Link>
      {!isStaff && (
        <Link href="/quan-tri" className="home-task">
          <KeyRound size={20} aria-hidden="true" />
          <span>
            <strong>Đăng nhập quản trị</strong>
            <small>Dành cho nhân sự quản lý hồ sơ huynh đệ.</small>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
