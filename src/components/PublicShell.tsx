import Link from 'next/link';
import type {ReactNode} from 'react';
import Brand from './Brand';
export default function PublicShell({children,completion=false}:{children:ReactNode;completion?:boolean}){return <div className={`public-site ${completion?'completion-page':''}`}><header className="public-header">{completion?<div className="brand"><Brand/></div>:<Link className="brand" href="/"><Brand/></Link>}{!completion&&<nav aria-label="Điều hướng chính"><Link href="/">Trang chủ</Link><Link href="/dang-ky-thong-tin">Đăng ký thông tin</Link></nav>}</header><main className="public-main">{children}</main></div>;}
