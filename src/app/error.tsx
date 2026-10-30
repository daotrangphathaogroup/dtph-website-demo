"use client";
import Brand from "../components/Brand";
// Keep the last-resort boundary independent of the feature and UI modules it protects.
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="public-site">
      <header className="public-header">
        <a className="brand" href="/" aria-label="Đạo Tràng Phật Hào">
          <Brand />
        </a>
      </header>
      <main className="public-main">
        <div className="page-heading">
          <div>
            <h1>Chưa thể mở trang</h1>
            <p>Vui lòng thử tải lại nội dung.</p>
          </div>
        </div>
        <section className="panel public-placeholder">
          <p role="alert">
            Đã xảy ra lỗi khi hiển thị trang. Bạn có thể thử lại hoặc quay về
            trang chủ.
          </p>
          <div className="form-actions">
            <a className="button secondary" href="/">
              Đăng ký thông tin
            </a>
            <button type="button" className="button primary" onClick={reset}>
              Thử lại
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
