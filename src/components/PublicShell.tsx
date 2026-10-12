import Link from 'next/link';
import type {ReactNode} from 'react';
import Brand from './Brand';
export default function PublicShell({children,completion=false,hideNavigation=false,formPage=false}:{children:ReactNode;completion?:boolean;hideNavigation?:boolean;formPage?:boolean}){return <div className={`public-site ${completion?'completion-page':''} ${formPage?'registration-form-page':''}`}><header className="public-header">{completion?<div className="brand"><Brand/></div>:<Link className="brand" href="/"><Brand/></Link>}{!completion&&!hideNavigation&&<nav aria-label="Điều hướng chính"><Link href="/">Trang chủ</Link><Link href="/dang-ky-thong-tin">Đăng ký thông tin</Link></nav>}</header><main className="public-main">{children}</main></div>;}
