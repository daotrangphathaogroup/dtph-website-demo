import {teamAreas} from '../../src/lib/areas.ts';
// Synthetic local-only records. Nothing here is imported from real member files.
export function generateDemoProfiles({seed=20261027,asOf='2026-10-27'}={}){
 let state=seed>>>0;const random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;},pick=items=>items[Math.floor(random()*items.length)],integer=(min,max)=>min+Math.floor(random()*(max-min+1));
 const family=['Nguyễn','Trần','Lê','Phạm','Hoàng','Võ','Đặng','Bùi','Đỗ','Phan','Huỳnh','Vũ'];
 const male=['Minh Trí','Quang Huy','Đức An','Nhật Minh','Gia Bảo','Tuấn Kiệt','Thiện Tâm','Hoàng Nam','Hữu Phước','Minh Quân'];
 const female=['Ngọc Hân','Thanh An','Diệu Linh','Bảo Trân','Ngọc Mai','Khánh Linh','Thảo Vy','Minh Anh','Thanh Tâm','Quỳnh Như'];
 const dharma=['Tâm An','Thiện Minh','Diệu Hòa','Thiện Trí','Tâm Đức','Diệu Hạnh','Minh Tâm','Tịnh An','Tuệ Minh','Thiện Phúc'];
 const adultJobs=['Nhân viên văn phòng','Giáo viên','Kỹ sư','Công nhân','Kinh doanh','Nội trợ','Hưu trí','Bác sĩ','Tài xế','Lao động tự do','Không','Khác: Thiết kế'];
 const [year,month,day]=asOf.split('-').map(Number),rows=[];
 for(const [group,approvedCount]of [['children',90],['youth',120],['congregation',150]]){
  for(let i=0;i<approvedCount+4;i++){
   const pending=i>=approvedCount,gender=pick(['Nam','Nữ']),name=pick(family)+' '+pick(gender==='Nam'?male:female),team=integer(1,3),ward=pick(teamAreas[team]);
   const birthYear=year-(group==='children'?integer(6,16):group==='youth'?integer(18,34):integer(35,78));
   const occupation=group==='children'?'Học sinh':group==='youth'?pick(['Sinh viên','Nhân viên văn phòng','Kỹ sư','Giáo viên','Kinh doanh','Công nhân','Không']):pick(adultJobs);
   const joinedYear=pending?year:pick([year,year,year,year,year-1,year-2]),joinedMonth=pending?month:integer(1,joinedYear===year?month:12),joinedDay=integer(1,joinedYear===year&&joinedMonth===month?Math.min(day,28):28);
   const joined=`${joinedYear}-${String(joinedMonth).padStart(2,'0')}-${String(joinedDay).padStart(2,'0')}`;
   const birthday=`${birthYear}-${String(integer(1,12)).padStart(2,'0')}-${String(integer(1,28)).padStart(2,'0')}`;
   const profileData={name,dharmaName:random()<.15?'':pick(dharma),gender,birthday,occupation,address:ward,team,phone:group==='children'&&random()<.5?'':'090000'+String(integer(1,9999)).padStart(4,'0'),relativePhone:'091000'+String(integer(1,9999)).padStart(4,'0'),introducedBy:'',notes:'[DỮ LIỆU MẪU LOCAL] Hồ sơ giả lập để thử giao diện; không phải người thật.',status:'',...(group==='children'?{schoolClass:String(integer(1,12)),caregiver:'',parentName:pick(family)+' '+pick([...male,...female]),personality:pick(['Điềm tĩnh','Hoạt bát','Thân thiện','Cần thời gian làm quen']),nickname:pick(['Mây','Nắng','Sóc','Gấu','Mít','Bông'])}:{caregiver:'',position:''})};
   rows.push({group,profileData,registrationStatus:pending?'pending':'approved',joined,submittedAt:joined+`T${String(integer(1,14)).padStart(2,'0')}:${String(integer(0,59)).padStart(2,'0')}:00.000Z`,avatarIndex:integer(0,11)});
  }
 }
 return rows;
}
