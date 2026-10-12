import Link from 'next/link';
import {CircleCheck,ArrowLeft} from 'lucide-react';
export default function RegistrationComplete({status}:{status:'pending'|'approved'}) {
 return <section className="registration-complete" role="status" aria-labelledby="registration-complete-title">
  <span className="completion-icon" aria-hidden="true"><CircleCheck size={38} strokeWidth={1.5}/></span>
  <div className="eyebrow">ĐẠO TRÀNG PHẬT HÀO</div>
  <h1 id="registration-complete-title">Đã hoàn thành đăng ký</h1>
  <p>{status==='pending'?'Thông tin đã được gửi thành công và đang chờ phía quản lý Đạo Tràng duyệt.':'Hồ sơ đã được ghi nhận vào danh sách huynh đệ.'}</p>
  <Link className="button primary" href="/"><ArrowLeft size={17}/>Quay về Tổng quát</Link>
 </section>;
}
