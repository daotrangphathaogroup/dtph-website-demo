import type { Challenge } from '../lib/api';
export default function OtpPreview({challenge}:{challenge:Challenge}){
 return <div className="otp-hint"><p>Tài khoản xác thực: <b>{challenge.memberId}</b></p><p className="small">SĐT nhận mã: {challenge.phone.includes('•')?challenge.phone:challenge.phone.slice(0,3)+'••••'+challenge.phone.slice(-3)}</p>{challenge.code&&<><p>Mã OTP mô phỏng: <b>{challenge.code}</b></p><div className="sms-preview"><span>Nội dung SMS mô phỏng từ backend</span><p>{challenge.message}</p></div></>}<p className="small">{challenge.code?'Chưa gửi SMS thật.':'Mã xác thực đã được gửi qua SMS.'} Mã chỉ áp dụng cho {challenge.memberId}, dùng một lần và hết hạn sau 5 phút.</p></div>;
}
