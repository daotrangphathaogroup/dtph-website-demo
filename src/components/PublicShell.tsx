import Link from 'next/link';
import type {ReactNode} from 'react';
import Brand from './Brand';
export default function PublicShell({children}:{children:ReactNode}){return <div className="public-site"><header className="public-header"><Link className="brand" href="/"><Brand/></Link><nav aria-label="Điều hướng chính"><Link href="/">Trang chủ</Link><Link href="/dang-ky-thong-tin">Đăng ký thông tin</Link><Link href="/quan-tri">Quản trị</Link></nav></header><main className="public-main">{children}</main></div>;}
