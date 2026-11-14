'use client';
import {useMemo,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {ArrowDown,ArrowUpRight,Check,Clock3,FilterX,HeartHandshake,MapPin,Phone,RefreshCw,UsersRound} from 'lucide-react';
import type {Member,MemberGroup} from '../../lib/types';
import type {RegistrationSchema} from '../../lib/registration';
import {groupLabels} from '../../lib/types';
import {memberWard,todayInVietnam} from '../../lib/dashboard';
import {emptyOperationFilters,filterOperations,matchesWork,operationsReport,operationGroups,pendingDate,workLabels} from '../../lib/operations';
import type {OperationFilters,WorkKind} from '../../lib/operations';
import {Button,EmptyState,IconButton} from '../../components/ui/primitives';
import {useChartMotion} from '../../hooks/useChartMotion';
import DashboardMemberList from './DashboardMemberList';
const shortLabels=['Thiếu nhi','Thanh niên','Đạo tràng'];
const colors=['var(--children-color)','var(--youth-color)','var(--congregation-color)'];
const fmt=(n:number)=>n.toLocaleString('vi-VN');
function Panel({title,description,children,className=''}:{title:string;description:string;children:ReactNode;className?:string}){
  const motion=useChartMotion();
  return <section ref={motion} className={`ops-panel ${className}`}><header><h2>{title}</h2><p>{description}</p></header>{children}</section>;
}
function GroupKey(){return <div className="ops-key">{shortLabels.map((name,i)=><span key={name}><i style={{background:colors[i]}}/>{name}</span>)}</div>;}
function Stack({counts,max}:{counts:number[];max:number}){return <><span className="ops-bar-track" aria-hidden="true">{counts.map((n,i)=><span key={i} style={{width:`${max?n/max*100:0}%`,background:colors[i]}}/>)}</span><span className="ops-bar-values">{counts.map((n,i)=><span key={i}><i style={{background:colors[i]}}/><span className="sr-only">{shortLabels[i]}: </span>{n}</span>)}</span><span className="ops-bar-tooltip" aria-hidden="true">{counts.map((n,i)=><span key={i}><i style={{background:colors[i]}}/>{shortLabels[i]}<b>{n}</b></span>)}</span></>;}
type Props={members:Member[];pending:Member[];schemas:Record<MemberGroup,RegistrationSchema>;canEdit:boolean;onOpen:(member:Member,edit:boolean)=>void;pendingPanel:(members:Member[])=>ReactNode;lastUpdated:string;onRefresh:()=>Promise<void>};
export default function OperationalOverview({members,pending,schemas,canEdit,onOpen,pendingPanel,lastUpdated,onRefresh}:Props){
  const today=todayInVietnam();
  const [filters,setFilters]=useState<OperationFilters>({...emptyOperationFilters});
  const [work,setWork]=useState<WorkKind>('all'),[caregiver,setCaregiver]=useState(''),[showPending,setShowPending]=useState(false),[refreshing,setRefreshing]=useState(false),[showAllCarers,setShowAllCarers]=useState(false),[showAllWards,setShowAllWards]=useState(false);
  const records=useRef<HTMLElement>(null),review=useRef<HTMLDivElement>(null);
  const approved=useMemo(()=>members.filter(m=>m.registrationStatus==='approved'),[members]);
  const filtered=useMemo(()=>filterOperations(approved,filters),[approved,filters]);
  const report=useMemo(()=>operationsReport(filtered,approved,today),[filtered,approved,today]);
  const waiting=useMemo(()=>filterOperations(pending.filter(m=>m.registrationStatus==='pending'),filters).sort((a,b)=>{
    const x=pendingDate(a,today),y=pendingDate(b,today);return x===y?a.id.localeCompare(b.id):x-y;
  }),[pending,filters,today]);
  const wardOptions=useMemo(()=>[...new Set([...approved,...pending].map(memberWard).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi')),[approved,pending]);
  const list=useMemo(()=>report.rows.filter(m=>matchesWork(report.flags.get(m.id)!,work)&&(!caregiver||report.flags.get(m.id)!.caregiver===caregiver)),[report,work,caregiver]);
  const activeCaregiver=report.caregivers.find(c=>c.id===caregiver);
  const active=filters.group!=='all'||filters.team!=='all'||filters.ward!=='all';
  function scrollTo(ref:{current:HTMLElement|null}){requestAnimationFrame(()=>{ref.current?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});ref.current?.focus({preventScroll:true});});}
  function chooseWork(kind:WorkKind){setWork(kind);setCaregiver('');scrollTo(records);}
  function change<K extends keyof OperationFilters>(key:K,value:OperationFilters[K]){setFilters(old=>({...old,[key]:value}));setWork('all');setCaregiver('');}
  function reset(){setFilters({...emptyOperationFilters});setWork('all');setCaregiver('');}
  async function refresh(){setRefreshing(true);try{await onRefresh();}finally{setRefreshing(false);}}
  const oldest=waiting.find(m=>Number.isFinite(pendingDate(m,today)));
  const oldestLabel=oldest?new Date(pendingDate(oldest,today)).toLocaleDateString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}):null;
  const focusLabel=caregiver?`Phân công cho ${activeCaregiver?.name??'HĐ đã chọn'}`:workLabels[work];
  const careRows=showAllCarers?report.caregivers:report.caregivers.slice(0,7);
  const wardRows=showAllWards?report.wards:report.wards.slice(0,7);
  const otherWards=report.wards.slice(7).reduce((s,w)=>s+w.total,0);
  const unknownStatuses=members.filter(m=>m.registrationStatus!=='approved').length;
  return <div className="ops-dashboard">
    <div className="ops-context"><span><i/>Hồ sơ đã duyệt · {new Date(today+'T12:00:00+07:00').toLocaleDateString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}</span><small>Các chỉ số phản ánh hồ sơ được ghi nhận</small></div>
    <div className="ops-filters" role="region" aria-label="Bộ lọc tổng quan">
      <label>Chúng<select aria-label="Lọc chúng tổng quan" value={filters.group} onChange={e=>change('group',e.target.value as OperationFilters['group'])}><option value="all">Cả ba chúng</option>{operationGroups.map(g=><option key={g} value={g}>{groupLabels[g]}</option>)}</select></label>
      <label>Tổ<select aria-label="Lọc tổ tổng quan" value={filters.team} onChange={e=>change('team',e.target.value)}><option value="all">Tất cả tổ</option>{[1,2,3].map(n=><option key={n} value={n}>Tổ {n}</option>)}<option value="unknown">Chưa phân tổ</option></select></label>
      <label>Địa chỉ (mới)<select aria-label="Lọc khu vực tổng quan" value={filters.ward} onChange={e=>change('ward',e.target.value)}><option value="all">Tất cả khu vực</option>{wardOptions.map(w=><option key={w}>{w}</option>)}<option value="unknown">Chưa rõ khu vực</option></select></label>
      <div className="ops-filter-actions">{active&&<Button variant="ghost" onClick={reset}><FilterX size={15}/>Xóa lọc</Button>}<IconButton label="Làm mới số liệu" busy={refreshing} onClick={()=>void refresh()}><RefreshCw size={17}/></IconButton></div>
    </div>
    {active&&<p className="ops-scope-note">Đang xem: {[filters.group==='all'?'Cả ba chúng':groupLabels[filters.group],filters.team==='all'?'Tất cả tổ':filters.team==='unknown'?'Chưa phân tổ':`Tổ ${filters.team}`,filters.ward==='all'?'Tất cả khu vực':filters.ward==='unknown'?'Chưa rõ khu vực':filters.ward].join(' · ')}</p>}
    <section className="ops-metrics" aria-label="Chỉ số điều hành">
      <button className={`ops-metric ${work==='all'&&!caregiver?'is-selected':''}`} onClick={()=>chooseWork('all')}><span><UsersRound size={17}/>Hồ sơ đã duyệt</span><strong>{fmt(report.rows.length)}</strong><div className="ops-mini-groups">{report.groups.map((g,i)=><small key={g.group}><i style={{background:colors[i]}}/>{shortLabels[i]} <b>{fmt(g.total)}</b></small>)}</div></button>
      <button className="ops-metric ops-metric-pending" aria-expanded={showPending} onClick={()=>{setShowPending(true);scrollTo(review);}}><span><Clock3 size={17}/>Đăng ký chờ duyệt</span><strong>{fmt(waiting.length)}</strong><small>{oldestLabel?`Phiếu cũ nhất: ${oldestLabel}`:waiting.length?'Chưa rõ ngày gửi':'Không có phiếu chờ duyệt'}<ArrowDown size={14}/></small></button>
      <button className={`ops-metric ${work==='unassigned'?'is-selected':''}`} onClick={()=>chooseWork('unassigned')}><span><HeartHandshake size={17}/>Chưa phân công</span><strong>{fmt(report.counts.unassigned)}</strong><small>Chưa ghi nhận HĐ chăm sóc<ArrowUpRight size={14}/></small></button>
      <button className={`ops-metric ${work==='contact'?'is-selected':''}`} onClick={()=>chooseWork('contact')}><span><Phone size={17}/>Cần xác minh liên lạc</span><strong>{fmt(report.counts.contact)}</strong><small>SĐT cá nhân hoặc SĐT phụ huynh<ArrowUpRight size={14}/></small></button>
    </section>
    <div className="ops-review" ref={review} tabIndex={-1}>
      <button className="ops-review-toggle" aria-expanded={showPending} aria-controls="ops-pending-content" onClick={()=>setShowPending(v=>!v)}><span><span className={`ops-state-dot ${waiting.length?'is-pending':''}`}/><b>Tiếp nhận đăng ký</b><em>{waiting.length} chờ duyệt</em></span><span>{showPending?'Thu gọn':'Xem danh sách'}<ArrowDown size={14}/></span></button>
      <div id="ops-pending-content" hidden={!showPending}>{showPending&&(waiting.length?pendingPanel(waiting):<EmptyState title="Không có đăng ký chờ duyệt" description="Phiếu chờ trong phạm vi bộ lọc sẽ xuất hiện tại đây."/>)}</div>
    </div>
    <div className="ops-section-title"><div><span>PHÂN CÔNG & ĐIỀU PHỐI</span><h2>Nhìn rõ từng chúng, từng tổ</h2></div></div>
    <Panel className="ops-matrix-panel" title="Tổ × Chúng" description="Số hồ sơ đã duyệt và khoảng trống phân công trong phạm vi đang xem.">
      <div className="ops-matrix-scroll"><table className="ops-matrix"><caption className="sr-only">Ma trận số hồ sơ và số chưa phân công theo tổ và chúng</caption><thead><tr><th scope="col">Tổ sinh hoạt</th>{operationGroups.map((g,i)=><th scope="col" key={g}><i style={{background:colors[i]}}/>{groupLabels[g]}</th>)}</tr></thead><tbody>{report.matrix.map(row=><tr key={row.team}><th scope="row">{row.team==='unknown'?'Chưa phân tổ':`Tổ ${row.team}`}</th>{row.cells.map(cell=><td key={cell.group} className={cell.total?'':'is-empty'}><button disabled={!cell.total} className="ops-cell-total" aria-label={`${row.team==='unknown'?'Chưa phân tổ':`Tổ ${row.team}`}, ${groupLabels[cell.group]}: ${cell.total} hồ sơ`} onClick={()=>{setFilters(old=>({...old,group:cell.group,team:row.team}));setWork('all');setCaregiver('');scrollTo(records);}}><strong>{fmt(cell.total)}</strong><span>hồ sơ</span></button>{cell.unassigned>0?<button className="ops-cell-gap" aria-label={`Xem ${cell.unassigned} chưa phân công, ${groupLabels[cell.group]}, ${row.team==='unknown'?'chưa phân tổ':`Tổ ${row.team}`}`} onClick={()=>{setFilters(old=>({...old,group:cell.group,team:row.team}));setWork('unassigned');setCaregiver('');scrollTo(records);}}>{cell.unassigned} chưa phân công <ArrowUpRight size={12}/></button>:cell.total>0?<span className="ops-cell-covered">{cell.links?`${cell.links} liên kết cần kiểm tra`:<>Đã có phân công <Check size={12}/></>}</span>:<span className="ops-cell-covered">Chưa có hồ sơ</span>}</td>)}</tr>)}</tbody></table></div>
      <footer>Chưa phân công là hồ sơ để trống HĐ chăm sóc. Liên kết không hợp lệ được tách riêng; phân công chưa chứng minh việc chăm sóc đã diễn ra.</footer>
    </Panel>
    <div className="ops-chart-grid">
      <Panel title="Phân công cho HĐ chăm sóc" description={`${fmt(report.assigned)} hồ sơ có liên kết hợp lệ · số hồ sơ được giao, không phải đánh giá năng suất.`}>
        <GroupKey/><div className="ops-bars">{careRows.map(c=><button className="ops-bar-row" key={c.id} aria-label={`Xem ${c.total} hồ sơ phân công cho ${c.name}; ${c.counts.map((n,i)=>`${shortLabels[i]} ${n}`).join(", ")}`} onClick={()=>{setCaregiver(c.id);setWork('all');scrollTo(records);}}><span className="ops-bar-label">{c.name}</span><Stack counts={c.counts} max={report.caregivers[0]?.total??0}/><b>{c.total}</b></button>)}{!careRows.length&&<EmptyState title="Chưa có phân công hợp lệ" description="Khi hồ sơ được gắn HĐ chăm sóc, phân bố sẽ hiện ở đây."/>}</div>
        {report.caregivers.length>7&&<Button variant="ghost" className="ops-show-all" onClick={()=>setShowAllCarers(v=>!v)}>{showAllCarers?'Thu gọn':`Xem ${report.caregivers.length-7} HĐ còn lại`}</Button>}
        <footer>Chưa có dữ liệu về quỹ thời gian và nhu cầu chăm sóc để kết luận quá tải.</footer>
      </Panel>
      <Panel title="Địa chỉ (mới) × Chúng" description="Xem nơi ở được ghi nhận để phối hợp liên lạc và sinh hoạt.">
        <GroupKey/><div className="ops-bars">{wardRows.map(w=><button className="ops-bar-row" key={w.ward||'unknown'} aria-label={`Xem ${w.total} hồ sơ tại ${w.ward||'Chưa rõ khu vực'}; ${w.counts.map((n,i)=>`${shortLabels[i]} ${n}`).join(", ")}`} onClick={()=>{change('ward',w.ward||'unknown');scrollTo(records);}}><span className="ops-bar-label"><MapPin size={12}/>{w.ward||'Chưa rõ khu vực'}</span><Stack counts={w.counts} max={report.wards[0]?.total??0}/><b>{w.total}</b></button>)}{!wardRows.length&&<EmptyState title="Chưa có hồ sơ trong bộ lọc" description="Thử xóa bộ lọc để xem các khu vực."/>}</div>
        {report.wards.length>7&&<Button variant="ghost" className="ops-show-all" onClick={()=>setShowAllWards(v=>!v)}>{showAllWards?'Thu gọn':`Xem khu vực khác · ${fmt(otherWards)} hồ sơ`}</Button>}
        <footer>Số lượng hồ sơ, không phải tỷ lệ dân cư hoặc mức độ tham gia. Nhấn một hàng để xem danh sách.</footer>
      </Panel>
    </div>
    <section ref={records} tabIndex={-1} className="ops-records" aria-labelledby="ops-records-title">
      <div className="ops-section-title"><div><span>HỒ SƠ & VIỆC CẦN XỬ LÝ</span><h2 id="ops-records-title">{focusLabel} <em>{fmt(list.length)}</em></h2></div>{(work!=='all'||caregiver)&&<Button variant="secondary" onClick={()=>{setWork('all');setCaregiver('');}}>Bỏ lọc công việc</Button>}</div>
      <div className="ops-work-tabs" role="group" aria-label="Lọc công việc">{(Object.keys(workLabels) as WorkKind[]).map(kind=><button key={kind} aria-pressed={work===kind&&!caregiver} onClick={()=>{setWork(kind);setCaregiver('');}}>{workLabels[kind]}<span>{report.counts[kind]}</span></button>)}</div>
      {work==='contact'&&<p className="ops-explanation">Kiểm tra SĐT cá nhân của người lớn và SĐT PH của thiếu nhi. SĐT PH hiện là tùy chọn; danh sách này gợi ý xác minh thông tin, không phải lỗi đăng ký.</p>}
      {work==='transition'&&<p className="ops-explanation">Gợi ý rà soát theo tuổi hiện tại hoặc sinh nhật 16/41 trong 90 ngày tới. Nhân sự xác nhận trước khi thay đổi chúng.</p>}
      {work==='links'&&<p className="ops-explanation">Đã ghi một HĐ chăm sóc nhưng không liên kết tới hồ sơ đã duyệt hợp lệ, hoặc liên kết tới chính mình.</p>}
      {work!=='all'&&list.length>0&&<div className="ops-action-list">{list.slice(0,5).map(m=><div key={m.id}><span><b>{m.name}</b><small>{groupLabels[m.group]} · {work==='contact'?report.flags.get(m.id)!.contact:work==='transition'?report.flags.get(m.id)!.transition:workLabels[work]}</small></span><Button variant="secondary" onClick={()=>onOpen(m,canEdit)}>{canEdit?'Chỉnh sửa hồ sơ':'Xem hồ sơ'}<ArrowUpRight size={14}/></Button></div>)}{list.length>5&&<p>{list.length-5} hồ sơ còn lại trong bảng bên dưới.</p>}</div>}
      <DashboardMemberList key={`${filters.group}:${filters.team}:${filters.ward}:${work}:${caregiver}`} members={list} hasMembers={approved.length>0} schemas={schemas} effectiveGroup={filters.group==='all'?undefined:filters.group} canEdit={canEdit} asOf={today} lastUpdated={lastUpdated} onOpen={onOpen} queryReset={0} pageReset={0}/>
    </section>
    <p className="ops-method">Đếm theo ID hồ sơ · Thẻ điểm tốt không được dùng để suy ra mức độ hoạt động.{unknownStatuses>0&&` ${unknownStatuses} hồ sơ chưa xác định là đã duyệt không được tính.`}</p>
  </div>;
}
