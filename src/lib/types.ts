export type Role = 'admin' | 'class_manager' | 'member';
export type MemberGroup = 'children' | 'youth' | 'congregation';
export const groupLabels: Record<MemberGroup, string> = { children: 'Chúng thiếu nhi', youth: 'Chúng thanh niên', congregation: 'Đạo tràng' };
export type Member = { id: string; name: string; birthday: string; phone: string; address: string; area: string; group: MemberGroup; referrer: string; joined: string; avatar: string };
export type Field = 'avatar' | 'name' | 'birthday' | 'phone' | 'address' | 'referrer' | 'joined' | 'password' | 'group';
export type Requirements = Record<Field, boolean>;
export type Enrollment = { memberId: string; classId: string; date: string };
export type Store = { members: Member[]; requirements: Requirements; enrollments: Enrollment[] };
export const fieldLabels: Record<Field,string> = { avatar:'Ảnh đại diện',name:'Họ và tên',birthday:'Ngày sinh',phone:'Số điện thoại',address:'Địa chỉ',referrer:'Mã người giới thiệu',joined:'Ngày đăng ký',password:'Mật khẩu',group:'Chúng / Nhóm sinh hoạt' };

export const defaultRequirements:Requirements={avatar:false,name:true,birthday:false,phone:true,address:true,referrer:false,joined:true,password:true,group:true};
