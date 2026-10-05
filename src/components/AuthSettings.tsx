import {useState} from 'react';
import type {AuthFeatures} from '../lib/api';
const options:{key:keyof AuthFeatures;title:string;description:string}[]=[
 {key:'smsOtp',title:'Xác thực qua SMS',description:'Yêu cầu OTP khi đăng ký, đăng nhập và đổi mật khẩu.'},
 {key:'emailOtp',title:'Xác thực qua email',description:'Tạm tắt. Sẽ bổ sung sau khi chọn dịch vụ gửi email.'},
 {key:'googleLogin',title:'Đăng nhập bằng Google',description:'Hiển thị nút và cho phép đăng nhập bằng tài khoản Google.'}
];
export default function AuthSettings({features,capabilities,onChange}:{features:AuthFeatures;capabilities:AuthFeatures;onChange:(key:keyof AuthFeatures,enabled:boolean)=>Promise<void>}){
 const [pending,setPending]=useState<keyof AuthFeatures|null>(null);const [error,setError]=useState('');
 return <section className="panel auth-settings-panel"><div className="panel-heading"><div><h2>Tính năng xác thực</h2><p>Khi tắt SMS và email, tài khoản sử dụng mật khẩu. Email và SĐT vẫn dùng để đăng nhập và liên hệ.</p></div></div><div className="requirements-list">{options.map(({key,title,description})=><div className="requirement-row" key={key}><div><b>{title}</b><span>{description}{!capabilities[key]&&key!=='emailOtp'?' Chưa cấu hình dịch vụ.':''}</span></div><span className="requirement-state">{pending===key?'Đang lưu…':features[key]?'Đang bật':'Đang tắt'}</span><button role="switch" aria-label={title} aria-checked={features[key]} className={`toggle ${features[key]?'on':''}`} disabled={pending!==null||(!features[key]&&!capabilities[key])} onClick={async()=>{setPending(key);setError('');try{await onChange(key,!features[key]);}catch(e){setError((e as Error).message);}finally{setPending(null);}}}><span/></button></div>)}</div>{error&&<p className="error" role="alert">{error}</p>}</section>;
}
