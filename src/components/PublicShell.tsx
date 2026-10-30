import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import Brand from "./Brand";
export default function PublicShell({
  children,
  completion = false,
  hideNavigation = false,
  formPage = false,
}: {
  children: ReactNode;
  completion?: boolean;
  hideNavigation?: boolean;
  formPage?: boolean;
}) {
  return (
    <div
      className={`public-site ${completion ? "completion-page" : ""} ${formPage ? "registration-form-page" : ""}`}
    >
      <a className="skip-link" href="#public-content">
        Đến nội dung chính
      </a>
      <header className="public-header">
        {completion ? (
          <div className="brand">
            <Brand />
          </div>
        ) : (
          <Link className="brand" href="/" aria-label="Đạo Tràng Phật Hào">
            <Brand />
          </Link>
        )}
        {!completion && !hideNavigation && (
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
    </div>
  );
}
