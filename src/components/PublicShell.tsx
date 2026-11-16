import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import SiteFooter from "./layout/SiteFooter";
import Brand from "./Brand";
export default function PublicShell({
  children,
  hideNavigation = false,
}: {
  children: ReactNode;
  hideNavigation?: boolean;
}) {
  return (
    <div className="public-site">
      <a className="skip-link" href="#public-content">
        Đến nội dung chính
      </a>
      <header className="public-header">
        <Link className="brand" href="/" aria-label="Đạo tràng Phật Hào – Biên Hòa">
          <Brand />
        </Link>
        {!hideNavigation && (
          <nav aria-label="Điều hướng chính">
            <Link href="/" className="public-home-link">
              <ArrowLeft size={15} />
              Đăng ký thông tin
            </Link>
          </nav>
        )}
      </header>
      <main id="public-content" className="public-main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
