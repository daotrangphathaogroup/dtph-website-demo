import Link from 'next/link';
import PublicShell from '../../components/PublicShell';
const groups=[['chung-thieu-nhi','Chúng thiếu nhi','5–16 tuổi'],['chung-thanh-nien','Chúng thanh niên','15–40 tuổi'],['dao-trang','Đạo tràng','40 tuổi trở lên']];
export default function Registration(){return <PublicShell hideNavigation><div className="page-heading registration-heading"><div><h1>Đăng ký thông tin</h1><p>Chọn nhóm sinh hoạt để điền biểu mẫu phù hợp.</p></div><Link className="button primary registration-home" href="/">Quay về trang chủ</Link></div><div className="registration-choices">{groups.map(([slug,label,ageRange])=><Link key={slug} href={`/dang-ky-thong-tin/${slug}`} className="panel registration-choice"><div><h2>{label}</h2><p>{ageRange}</p></div></Link>)}</div></PublicShell>;}
