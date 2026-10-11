import Link from 'next/link';
import PublicShell from './PublicShell';
export default function RegistrationPlaceholder({title}:{title:string}){return <PublicShell><Link href="/dang-ky-thong-tin" className="text-button">← Chọn nhóm sinh hoạt</Link><div className="page-heading"><div><h1>Đăng ký thông tin · {title}</h1></div></div><section className="panel public-placeholder"><h2>Biểu mẫu đang được chuẩn bị</h2><p>Các thông tin đăng ký dành cho {title} sẽ được cập nhật sau khi Đạo Tràng thống nhất nội dung.</p></section></PublicShell>;}
