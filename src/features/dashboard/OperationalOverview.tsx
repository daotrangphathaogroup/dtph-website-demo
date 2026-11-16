'use client';
import {useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import {ChartPie, Clock3, FilterX, RefreshCw} from 'lucide-react';
import {Button, IconButton} from '../../components/ui/primitives';
import {teamsForGroup,teamOptionLabel} from '../../lib/areas';
import {groupLabels} from '../../lib/types';
import type {Member, MemberGroup} from '../../lib/types';
import type {RegistrationSchema} from '../../lib/registration';
import {emptyDashboardFilters, filterDashboard, memberWard, monthlyRegistrations, registrationDate, todayInVietnam} from '../../lib/dashboard';
import {emptyOperationFilters, filterOperations, matchesWork, operationGroups, operationsReport, pendingDate, workLabels} from '../../lib/operations';
import {useChartMotion} from '../../hooks/useChartMotion';
import type {OperationFilters, WorkKind} from '../../lib/operations';
import DashboardMemberList from './DashboardMemberList';
import {Donut, RegistrationMonthChart} from './DashboardCharts';

const colors = ['var(--children-color)', 'var(--youth-color)', 'var(--congregation-color)'];
const vietnamDate = new Intl.DateTimeFormat("en-CA", {timeZone: "Asia/Ho_Chi_Minh"});
const formatCount = (count: number) => count.toLocaleString('vi-VN');

type Props = {
  members: Member[];
  pending: Member[];
  schemas: Record<MemberGroup, RegistrationSchema>;
  canEdit: boolean;
  onOpen: (member: Member, edit: boolean) => void;
  lastUpdated: string;
  pendingPanel: (members: Member[]) => ReactNode;
  onRefresh: () => Promise<void>;
};

export default function OperationalOverview({members, pending, schemas, canEdit, onOpen, lastUpdated, pendingPanel, onRefresh}: Props) {
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState<number | null>(null);
  const [filters, setFilters] = useState(emptyOperationFilters);
  const [work, setWork] = useState<WorkKind>('all');
  const [refreshing, setRefreshing] = useState(false);

  const queueMotion = useChartMotion();
  const today = todayInVietnam();
  const directory = useMemo(() => members.filter(member => member.registrationStatus === 'approved'), [members]);
  const periodFilters = useMemo(() => ({...emptyDashboardFilters, year, month}), [year, month]);
  const approved = useMemo(() => filterDashboard(filterOperations(directory, filters), periodFilters), [directory, filters, periodFilters]);
  const yearRecords = useMemo(() => filterDashboard(filterOperations(directory, filters), {...periodFilters, month: null}), [directory, filters, periodFilters]);
  const yearPending = useMemo(() => filterDashboard(filterOperations(pending, filters), {...periodFilters, month: null}), [pending, filters, periodFilters]);
  const years = useMemo(() => [...new Set([today.slice(0, 4), ...directory.concat(pending).map(member => registrationDate(member).slice(0, 4)).filter(Boolean)])].sort().reverse(), [directory, pending, today]);
  const period = month ? `Tháng ${month} · ${year === 'all' ? 'Tất cả các năm' : year}` : year === 'all' ? 'Mọi thời điểm' : `Năm ${year}`;
  const report = useMemo(() => operationsReport(approved, directory, today), [approved, directory, today]);
  const records = useMemo(() => report.rows.filter(member => {
    const flags = report.flags.get(member.id);
    return flags && matchesWork(flags, work);
  }), [report, work]);
  const wardOptions = useMemo(() => [...new Set([...directory, ...pending].map(memberWard).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'vi')), [directory, pending]);
  const waiting = useMemo(() => filterDashboard(filterOperations(pending.filter(member => member.registrationStatus === 'pending'), filters), periodFilters)
    .sort((a, b) => (pendingDate(a, today) - pendingDate(b, today)) || a.id.localeCompare(b.id)), [pending, filters, today, periodFilters]);
  const filtered = filters.group !== 'all' || filters.team !== 'all' || filters.ward !== 'all' || year !== 'all' || month !== null;

  function changeFilter<K extends keyof OperationFilters>(key: K, value: OperationFilters[K]) {
    setFilters(previous => {
      const next = {...previous, [key]: value};
      if (key === 'group' && !['all', 'unknown'].includes(next.team) &&
          !teamsForGroup(next.group).some(team => String(team) === next.team)) next.team = 'all';
      return next;
    });
    setWork('all');
  }
  const oldest = waiting[0];
  const oldestTimestamp = oldest ? pendingDate(oldest, today) : Infinity;
  const unknownDates = waiting.filter(member => !Number.isFinite(pendingDate(member, today))).length;
  const daysWaiting = Number.isFinite(oldestTimestamp)
    ? (Date.parse(today) - Date.parse(vietnamDate.format(oldestTimestamp))) / 86_400_000
    : null;
  const composition = operationGroups.map(group => ({
    label: groupLabels[group],
    count: report.groups.find(item => item.group === group)?.total ?? 0,
  }));
  const queue = operationGroups.map(group => ({
    label: groupLabels[group],
    count: waiting.filter(member => member.group === group).length,
  }));
  const scale = Math.max(1, ...queue.map(item => item.count));

  async function refresh() {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="ops-dashboard">
      <section className="ops-filters" aria-label="Bộ lọc tổng quan">
        <div className="ops-filter-top">
          <div className="ops-group-filter" role="group" aria-label="Lọc chúng tổng quan">
            <button type="button" aria-pressed={filters.group === 'all'} onClick={() => changeFilter('group', 'all')}>Cả ba chúng</button>
            {operationGroups.map(group => <button key={group} type="button" data-group={group} aria-pressed={filters.group === group} onClick={() => changeFilter('group', group)}>
              <i aria-hidden="true" />{groupLabels[group]}
            </button>)}
          </div>
          <Button variant="ghost" aria-label="Xóa bộ lọc" title="Xóa bộ lọc" disabled={!filtered} onClick={() => {setFilters(emptyOperationFilters); setWork('all'); setYear('all'); setMonth(null);}}>
            <FilterX size={15} /><span>Xóa bộ lọc</span>
          </Button>
        </div>
        <div className="ops-filter-details">
          <fieldset className="ops-team-filter">
            <legend>Tổ sinh hoạt</legend>
            <div role="group" aria-label="Lọc tổ tổng quan">
              {[['all', 'Tất cả'], ...teamsForGroup(filters.group).map(team => [String(team), teamOptionLabel(team)]), ['unknown', 'Chưa phân tổ']].map(([value, label]) =>
                <button key={value} type="button" aria-pressed={filters.team === value} onClick={() => changeFilter('team', value)}>{label}</button>
              )}
            </div>
          </fieldset>
          <label>Địa chỉ (mới)
            <select aria-label="Lọc khu vực tổng quan" value={filters.ward} onChange={e => changeFilter('ward', e.target.value)}>
              <option value="all">Tất cả khu vực</option>
              {wardOptions.map(ward => <option key={ward}>{ward}</option>)}
              <option value="unknown">Chưa rõ khu vực</option>
            </select>
          </label>
          <label>Năm đăng ký
            <select aria-label="Lọc năm tổng quan" value={year} onChange={e => setYear(e.target.value)}>
              <option value="all">Tất cả các năm</option>
              {years.map(value => <option key={value}>{value}</option>)}
            </select>
          </label>
        </div>
        <div className="ops-filter-period">
          <fieldset className="ops-month-filter">
            <legend>Tháng đăng ký</legend>
            <div role="group" aria-label="Lọc tháng tổng quan">
              <button type="button" aria-pressed={month === null} onClick={() => setMonth(null)}>Tất cả</button>
              {Array.from({length: 12}, (_, index) => <button key={index} type="button" aria-label={`Tháng ${index + 1}`} aria-pressed={month === index + 1} onClick={() => setMonth(index + 1)}>T{index + 1}</button>)}
            </div>
          </fieldset>
        </div>
      </section>
      <div className="ops-summary-grid">
        <section className="ops-panel">
          <header className="ops-card-heading">
            <span className="ops-card-icon"><ChartPie size={21} aria-hidden="true" /></span>
            <div>
              <h2>Cơ cấu 3 chúng</h2>
              <p>Hồ sơ đã duyệt · {period}</p>
            </div>
          </header>
          <Donut items={composition} total={report.rows.length} colors={colors} />
        </section>
        <section className="ops-panel" ref={queueMotion}>
          <header className="ops-queue-header">
            <div className="ops-card-heading">
              <span className="ops-card-icon"><Clock3 size={21} aria-hidden="true" /></span>
              <div>
                <h2>Đăng ký chờ duyệt</h2>
                <p className="ops-queue-total"><strong>{formatCount(waiting.length)}</strong> phiếu</p>
              </div>
            </div>
            <IconButton label="Làm mới số liệu" busy={refreshing} onClick={() => void refresh()}>
              <RefreshCw size={17} />
            </IconButton>
          </header>
          {daysWaiting !== null && <p className="ops-queue-age">Chờ lâu nhất <strong>{daysWaiting ? `${formatCount(daysWaiting)} ngày` : 'hôm nay'}</strong> · {groupLabels[oldest.group]}</p>}
          {unknownDates > 0 && <p className="ops-queue-age">{formatCount(unknownDates)} phiếu chưa rõ ngày gửi</p>}
          <ul className="ops-queue">
            {queue.map((item, index) => (
              <li key={item.label}>
                <span>{item.label}</span>
                <b>{formatCount(item.count)}</b>
                <span className="ops-queue-track" aria-hidden="true">
                  <i style={{width: `${item.count / scale * 100}%`, background: colors[index]}} />
                </span>
              </li>
            ))}
          </ul>
          {!waiting.length && <p className="ops-queue-empty">Không có phiếu chờ duyệt.</p>}
        </section>
      </div>
      <RegistrationMonthChart months={monthlyRegistrations(yearRecords)} pendingMonths={monthlyRegistrations(yearPending)} month={month} period={year === 'all' ? 'Tất cả các năm · theo ngày ghi nhận hồ sơ' : `Năm ${year} · theo ngày ghi nhận hồ sơ`} total={yearRecords.length} />
      {waiting.length > 0 && pendingPanel(waiting)}
      <section className="ops-records" aria-label="Danh sách hồ sơ">
        <h2>{workLabels[work]} <small>{formatCount(records.length)}</small></h2>
        <div className="ops-work-tabs" role="group" aria-label="Lọc công việc">
          {(['all', 'transition', 'team'] as const).map(kind => (
            <button key={kind} type="button" aria-pressed={work === kind} onClick={() => setWork(kind)}>
              {workLabels[kind]} <span>{formatCount(report.counts[kind])}</span>
            </button>
          ))}
        </div>
        <DashboardMemberList
          key={JSON.stringify([filters.group, filters.team, filters.ward, work, year, month])}
          members={records}
          hasMembers={directory.length > 0}
          schemas={schemas}
          effectiveGroup={filters.group === 'all' ? undefined : filters.group}
          canEdit={canEdit}
          asOf={today}
          lastUpdated={lastUpdated}
          onOpen={onOpen}
          queryReset={0}
          pageReset={0}
        />
      </section>
    </div>
  );
}
