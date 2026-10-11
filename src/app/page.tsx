import Link from 'next/link';
import PublicShell from '../components/PublicShell';
export default function Home(){return <PublicShell><div className="page-heading"><div><div className="eyebrow">ĐẠO TRÀNG PHẬT HÀO</div><h1>Trang chủ</h1><p>Thông tin sinh hoạt của Đạo Tràng.</p></div></div><section className="panel public-placeholder"><h2>Cổng thông tin Đạo Tràng</h2><p>Nội dung trang chủ sẽ được cập nhật.</p><Link className="button primary" href="/dang-ky-thong-tin">Đăng ký thông tin</Link></section></PublicShell>;}
