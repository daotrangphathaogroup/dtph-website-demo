'use client';
import {useMemo,useState} from 'react';
import type {ReactNode} from 'react';
import {BarChart3,List,Clock3} from 'lucide-react';
import {EmptyState} from './ui/primitives';
import type {Member,MemberGroup} from '../lib/types';
import type {RegistrationSchema} from '../lib/registration';
import {wards} from '../lib/areas';
import {distribution,emptyDashboardFilters,filterDashboard,memberTeam,memberWard,monthlyRegistrations,registrationDate,todayInVietnam} from '../lib/dashboard';
import type {DashboardFilters as Filters} from '../lib/dashboard';
import {useDashboardEntrance} from '../hooks/useDashboardEntrance';
import OperationalOverview from '../features/dashboard/OperationalOverview';
import DashboardFilters from '../features/dashboard/DashboardFilters';
import DashboardCharts from '../features/dashboard/DashboardCharts';
import type {Dimension} from '../features/dashboard/DashboardCharts';
import DashboardMemberList from '../features/dashboard/DashboardMemberList';
type Props={members:Member[];pending:Member[];schemas:Record<MemberGroup,RegistrationSchema>;scope?:MemberGroup;canEdit:boolean;onOpen:(m:Member,edit:boolean)=>void;pendingPanel:(members:Member[])=>ReactNode;lastUpdated:string;onRefresh:()=>Promise<void>};
export default function ManagementDashboard(props:Props){
  return props.scope?<GroupDashboard {...props} scope={props.scope}/>:<OperationalOverview {...props}/>;
}
function GroupDashboard({members,pending,schemas,scope,canEdit,onOpen,pendingPanel,lastUpdated,onRefresh}:Props & {scope:MemberGroup}){
  const [filters,setFilters]=useState<Filters>({...emptyDashboardFilters}),[dimension,setDimension]=useState<Dimension>('ward'),[refreshing,setRefreshing]=useState(false),[resets,setResets]=useState({page:0,query:0});
  const [view,setView]=useState<'list'|'pending'|'statistics'>('list');
  const asOf=todayInVietnam();
  const approved=useMemo(()=>filterDashboard(members,filters,scope,asOf),[members,filters,scope,asOf]);
  const waiting=useMemo(()=>filterDashboard(pending,filters,scope,asOf),[pending,filters,scope,asOf]);
  const source=useMemo(()=>[...members,...pending].filter(m=>m.group===scope),[members,pending,scope]);
  const years=useMemo(()=>[...new Set([new Date().getFullYear().toString(),...source.map(m=>registrationDate(m).slice(0,4)).filter(Boolean)])].sort().reverse(),[source]);
  const wardOptions=useMemo(()=>[...new Set([...wards,...source.map(memberWard).filter(Boolean)])].sort((a,b)=>a.localeCompare(b,'vi')),[source]);
  const composition=useMemo(()=>{
    const items=[1,2,3].map(team=>({label:`Tổ ${team}`,count:approved.filter(m=>memberTeam(m)===String(team)).length}));
    if(approved.some(m=>!['1','2','3'].includes(memberTeam(m))))items.push({label:'Chưa phân tổ',count:approved.filter(m=>!['1','2','3'].includes(memberTeam(m))).length});
    return items;
  },[approved]);
  const bars=useMemo(()=>distribution(approved,dimension,asOf),[approved,dimension,asOf]);
  const months=useMemo(()=>monthlyRegistrations(approved),[approved]);
  const motionRevision=useMemo(()=>({members,pending,filters}),[members,pending,filters]);
  const entrance=useDashboardEntrance(motionRevision),chartEntrance=useDashboardEntrance(motionRevision,view==='statistics');
  function change<K extends keyof Filters>(key:K,value:Filters[K]){setFilters(old=>({...old,[key]:value}));setResets(old=>({...old,page:old.page+1}));}
  function reset(){setFilters({...emptyDashboardFilters});setResets(old=>({page:old.page+1,query:old.query+1}));}
  async function refresh(){setRefreshing(true);try{await onRefresh();}finally{setRefreshing(false);}}
  const total=approved.length;
  const period=filters.year==='all'?(filters.month===null?'Mọi thời điểm':`Tháng ${filters.month}, tất cả các năm`):filters.month===null?`Cả năm ${filters.year}`:`Tháng ${filters.month}/${filters.year}`;
  return <div ref={entrance} className="management-dashboard">
    <DashboardFilters filters={filters} scope={scope} wardOptions={wardOptions} years={years} period={period} refreshing={refreshing} onChange={change} onReset={reset} onRefresh={()=>void refresh()}/>
    <div className="management-summary" aria-label="Hồ sơ theo bộ lọc"><span><strong>{total.toLocaleString('vi-VN')}</strong> hồ sơ đã duyệt</span>{composition.map(item=><span key={item.label}>{item.label} <b>{item.count}</b></span>)}</div>
    <nav className="management-views" aria-label="Chế độ quản lý">
      <button type="button" aria-pressed={view==='list'} onClick={()=>setView('list')}><List size={16}/>Danh sách <span>{total}</span></button>
      <button type="button" aria-pressed={view==='pending'} onClick={()=>setView('pending')}><Clock3 size={16}/>Chờ duyệt <span className={waiting.length?'pending-count':''}>{waiting.length}</span></button>
      <button type="button" aria-pressed={view==='statistics'} onClick={()=>setView('statistics')}><BarChart3 size={16}/>Thống kê</button>
    </nav>
    {view==='pending'&&<div className="dashboard-pending">{waiting.length?pendingPanel(waiting):<EmptyState title="Không có đăng ký chờ duyệt" description="Các đăng ký mới phù hợp với bộ lọc sẽ hiển thị tại đây."/>}</div>}
    {view==='statistics'&&<div className="statistics-view" ref={chartEntrance}><DashboardCharts scope={scope} total={total} composition={composition} bars={bars} months={months} pendingMonths={monthlyRegistrations(waiting)} month={filters.month} period={period} dimension={dimension} onDimension={setDimension}/></div>}
    <div hidden={view!=='list'} className="group-records"><DashboardMemberList members={approved} hasMembers={members.length>0} schemas={schemas} scope={scope} effectiveGroup={scope} canEdit={canEdit} asOf={asOf} lastUpdated={lastUpdated} onOpen={onOpen} queryReset={resets.query} pageReset={resets.page}/></div>
  </div>;
}
