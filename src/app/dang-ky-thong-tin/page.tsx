import Link from 'next/link';
import PublicShell from '../../components/PublicShell';
const groups=[['chung-thieu-nhi','Chúng thiếu nhi'],['chung-thanh-nien','Chúng thanh niên'],['dao-trang','Đạo tràng']];
export default function Registration(){return <PublicShell hideNavigation><div className="page-heading registration-heading"><div><h1>Đăng ký thông tin</h1><p>Chọn nhóm sinh hoạt để điền biểu mẫu phù hợp.</p></div><Link className="button primary registration-home" href="/">Quay về trang chủ</Link></div><div className="registration-choices">{groups.map(([slug,label])=><Link key={slug} href={`/dang-ky-thong-tin/${slug}`} className="panel registration-choice"><h2>{label}</h2></Link>)}</div></PublicShell>;}
