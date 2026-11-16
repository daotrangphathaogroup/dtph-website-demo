// Stable identifiers are stored in profiles; names/colors can change independently.
export const recognitionTags=[
 {id:'tinh-tan',label:'Tinh tấn',color:'#3273ff',ink:'#1c53bb',background:'#edf3ff'},
 {id:'cong-qua',label:'Tích cực công quả',color:'#16b978',ink:'#08784c',background:'#eafaf2'},
 {id:'trung-thanh-su-phu',label:'Trung thành với Sư Phụ',color:'#934dff',ink:'#7431c7',background:'#f5efff'},
 {id:'san-sang-nhan-nhiem-vu',label:'Sẵn sàng nhận nhiệm vụ',color:'#00b5d8',ink:'#00748b',background:'#eafaff'},
 {id:'ngai-viec',label:'Ngại việc',color:'#fa537d',ink:'#bb2950',background:'#fff0f4'},
] as const;
// Retired tags remain readable/removable on existing profiles, but cannot be newly assigned.
const retiredTags=[
 {id:'cham-chi',label:'Chăm chỉ',color:'#f6aa00',ink:'#946000',background:'#fff8df'},
 {id:'hoa-dong',label:'Hòa đồng',color:'#934dff',ink:'#7431c7',background:'#f5efff'},
 {id:'trach-nhiem',label:'Có trách nhiệm',color:'#fa537d',ink:'#bb2950',background:'#fff0f4'},
 {id:'giup-do',label:'Sẵn lòng giúp đỡ',color:'#00b5d8',ink:'#00748b',background:'#eafaff'},
] as const;
export function selectedRecognitionTags(value:unknown){
 const ids=Array.isArray(value)?value:[];
 return [...recognitionTags,...retiredTags].filter(tag=>ids.includes(tag.id));
}
export function recognitionTagText(value:unknown){return selectedRecognitionTags(value).map(tag=>tag.label).join(' · ');}
