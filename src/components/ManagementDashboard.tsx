'use client';
import {useMemo,useState} from 'react';
import type {ReactNode} from 'react';
import {BarChart3,List,Clock3,UsersRound,Network} from 'lucide-react';
import {EmptyState,SegmentedControl} from './ui/primitives';
import type {Member,MemberGroup} from '../lib/types';
import type {RegistrationSchema} from '../lib/registration';
import {wards,currentWard} from '../lib/areas';
import {distribution,emptyDashboardFilters,filterDashboard,memberTeam,memberWard,monthlyRegistrations,registrationDate,todayInVietnam} from '../lib/dashboard';
import type {DashboardFilters as Filters} from '../lib/dashboard';
import {useGroupViewTransition} from '../hooks/useGroupViewTransition';
import OperationalOverview from '../features/dashboard/OperationalOverview';
import DashboardFilters from '../features/dashboard/DashboardFilters';
import DashboardCharts from '../features/dashboard/DashboardCharts';
import type {Dimension} from '../features/dashboard/DashboardCharts';
import DashboardMemberList from '../features/dashboard/DashboardMemberList';
const currentWards = [...new Set(wards.map(currentWard))].filter(Boolean);
const formatCount = new Intl.NumberFormat('vi-VN').format;

type Props={members:Member[];pending:Member[];schemas:Record<MemberGroup,RegistrationSchema>;scope?:MemberGroup;canEdit:boolean;onOpen:(m:Member,edit:boolean)=>void;pendingPanel:(members:Member[])=>ReactNode;lastUpdated:string;onRefresh:()=>Promise<void>};
export default function ManagementDashboard(props:Props){
  return props.scope?<GroupDashboard {...props} scope={props.scope}/>:<OperationalOverview {...props}/>;
}
function GroupDashboard({members,pending,schemas,scope,canEdit,onOpen,pendingPanel,lastUpdated,onRefresh}:Props & {scope:MemberGroup}){
  const [filters,setFilters]=useState<Filters>({...emptyDashboardFilters}),[dimension,setDimension]=useState<Dimension>('ward'),[refreshing,setRefreshing]=useState(false),[resets,setResets]=useState({page:0,query:0});
  const {view, selectView, stage} = useGroupViewTransition();
  const asOf=todayInVietnam();
  const approved=useMemo(()=>filterDashboard(members,filters,scope,asOf),[members,filters,scope,asOf]);
  const waiting=useMemo(()=>filterDashboard(pending,filters,scope,asOf),[pending,filters,scope,asOf]);
  const source=useMemo(()=>[...members,...pending].filter(m=>m.group===scope),[members,pending,scope]);
  const years=useMemo(()=>[...new Set([new Date().getFullYear().toString(),...source.map(m=>registrationDate(m).slice(0,4)).filter(Boolean)])].sort().reverse(),[source]);
  const wardOptions=useMemo(()=>[...new Set([...currentWards,...source.map(memberWard).filter(Boolean)])].sort((a,b)=>a.localeCompare(b,'vi')),[source]);
  const composition=useMemo(()=>{
    const items=[1,2,3].map(team=>({label:`Tổ ${team}`,count:approved.filter(m=>memberTeam(m)===String(team)).length}));
    if(approved.some(m=>!['1','2','3'].includes(memberTeam(m))))items.push({label:'Chưa phân tổ',count:approved.filter(m=>!['1','2','3'].includes(memberTeam(m))).length});
    return items;
  },[approved]);
  const detailKey = scope === 'children' ? 'schoolClass' : 'position';
  const profileBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const member of approved) {
      const value = String(member.profileData?.[detailKey] ?? '').trim();
      const label = detailKey === 'schoolClass' && value
        ? value === 'Không' ? 'Không đi học' : `Lớp ${value}`
        : value || 'Chưa cập nhật';
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts].map(([label, count]) => ({label, count})).sort((a,b)=>
      b.count-a.count || a.label.localeCompare(b.label,'vi',{numeric:true})
    );
  }, [approved, detailKey]);
  const bars=useMemo(()=>distribution(approved,dimension,asOf),[approved,dimension,asOf]);
  const months=useMemo(()=>monthlyRegistrations(approved),[approved]);
  function change<K extends keyof Filters>(key:K,value:Filters[K]){setFilters(old=>({...old,[key]:value}));setResets(old=>({...old,page:old.page+1}));}
  function reset(){setFilters({...emptyDashboardFilters});setResets(old=>({page:old.page+1,query:old.query+1}));}
  async function refresh(){setRefreshing(true);try{await onRefresh();}finally{setRefreshing(false);}}
  const total=approved.length;
  const period=filters.year==='all'?(filters.month===null?'Mọi thời điểm':`Tháng ${filters.month}, tất cả các năm`):filters.month===null?`Cả năm ${filters.year}`:`Tháng ${filters.month}/${filters.year}`;
  const views = useMemo(() => [
    {value: 'list' as const, label: <><List size={16} aria-hidden="true" />Danh sách <span>{formatCount(total)}</span></>},
    {value: 'pending' as const, label: <><Clock3 size={16} aria-hidden="true" />Chờ duyệt <span className={waiting.length ? 'group-pending-count' : undefined}>{formatCount(waiting.length)}</span></>},
    {value: 'statistics' as const, label: <><BarChart3 size={16} aria-hidden="true" />Thống kê</>},
  ], [total, waiting.length]);
  return <div className="management-dashboard group-dashboard" data-group={scope}>
    <section className="group-summary" aria-label="Hồ sơ theo bộ lọc">
      <div className="group-indicators">
        <button type="button" className="group-indicator" onClick={()=>selectView('list')}>
          <span className="group-indicator-icon"><UsersRound size={19} aria-hidden="true" /></span>
          <div><span>Hồ sơ đã duyệt</span><strong>{formatCount(total)}</strong></div>
        </button>
        <button type="button" className="group-indicator" onClick={()=>selectView('pending')}>
          <span className="group-indicator-icon"><Clock3 size={19} aria-hidden="true" /></span>
          <div><span>Đăng ký chờ duyệt</span><strong>{formatCount(waiting.length)}</strong></div>
        </button>
      </div>
      <div className="group-team-summary">
        <h2><Network size={16} aria-hidden="true" /> Phân bố theo tổ</h2>
        <div className="group-team-track" aria-hidden="true">
          {composition.map((item, index) => item.count > 0 && <span key={item.label} data-tier={index} style={{flexGrow: item.count}} />)}
        </div>
        <div className="group-team-values">
          {composition.map((item, index) => <span key={item.label} data-tier={index}><i aria-hidden="true" />{item.label} <b>{formatCount(item.count)}</b></span>)}
        </div>
      </div>
    </section>
    <div className="group-workbar">
      <SegmentedControl label="Chế độ quản lý" value={view} onChange={selectView} items={views}/>
      <DashboardFilters filters={filters} scope={scope} wardOptions={wardOptions} years={years} period={period} refreshing={refreshing} onChange={change} onReset={reset} onRefresh={()=>void refresh()}/>
    </div>
    <div className="group-view-stage" ref={stage}>
    {view==='pending'&&<div className="dashboard-pending">{waiting.length?pendingPanel(waiting):<EmptyState title="Không có đăng ký chờ duyệt" description="Các đăng ký mới phù hợp với bộ lọc sẽ hiển thị tại đây."/>}</div>}
    {view==='statistics'&&<div className="statistics-view">
      <section className="group-profile-distribution dashboard-card">
        <header className="dashboard-card-heading">
          <div><h2>{scope === 'children' ? 'Lớp học' : 'Vai trò trong chúng'}</h2><p>Hồ sơ đã duyệt theo bộ lọc</p></div>
        </header>
        {profileBreakdown.length ? <ul>{profileBreakdown.map(item=><li key={item.label}>
          <span>{item.label}</span><b>{formatCount(item.count)}</b>
          <span className="group-detail-track" aria-hidden="true"><i style={{width: `${total ? item.count / total * 100 : 0}%`}} /></span>
        </li>)}</ul> : <EmptyState title="Chưa có dữ liệu" description="Thông tin được tổng hợp từ hồ sơ đã duyệt."/>}
      </section>
      <DashboardCharts scope={scope} total={total} composition={composition} bars={bars} months={months} pendingMonths={monthlyRegistrations(waiting)} month={filters.month} period={period} dimension={dimension} onDimension={setDimension}/></div>}
    <div hidden={view!=='list'} className="group-records"><DashboardMemberList members={approved} hasMembers={members.length>0} schemas={schemas} scope={scope} effectiveGroup={scope} canEdit={canEdit} asOf={asOf} lastUpdated={lastUpdated} onOpen={onOpen} queryReset={resets.query} pageReset={resets.page}/></div>
    </div>
  </div>;
}
