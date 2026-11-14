'use client';
import {useId, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import {Clock3, FilterX, RefreshCw} from 'lucide-react';
import {Button, IconButton} from '../../components/ui/primitives';
import {groupLabels} from '../../lib/types';
import type {Member, MemberGroup} from '../../lib/types';
import type {RegistrationSchema} from '../../lib/registration';
import {memberWard, todayInVietnam} from '../../lib/dashboard';
import {emptyOperationFilters, filterOperations, matchesWork, operationGroups, operationsReport, pendingDate, workLabels} from '../../lib/operations';
import {useChartMotion} from '../../hooks/useChartMotion';
import type {OperationFilters, WorkKind} from '../../lib/operations';
import DashboardMemberList from './DashboardMemberList';
import {Donut} from './DashboardCharts';

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
  const [showPending, setShowPending] = useState(true);
  const [filters, setFilters] = useState(emptyOperationFilters);
  const [work, setWork] = useState<WorkKind>('all');
  const [refreshing, setRefreshing] = useState(false);
  const pendingId = useId();
  const queueMotion = useChartMotion();
  const today = todayInVietnam();
  const directory = useMemo(() => members.filter(member => member.registrationStatus === 'approved'), [members]);
  const approved = useMemo(() => filterOperations(directory, filters), [directory, filters]);
  const report = useMemo(() => operationsReport(approved, directory, today), [approved, directory, today]);
  const records = useMemo(() => report.rows.filter(member => {
    const flags = report.flags.get(member.id);
    return flags && matchesWork(flags, work);
  }), [report, work]);
  const wardOptions = useMemo(() => [...new Set([...directory, ...pending].map(memberWard).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'vi')), [directory, pending]);
  const waiting = useMemo(() => filterOperations(pending.filter(member => member.registrationStatus === 'pending'), filters)
    .sort((a, b) => (pendingDate(a, today) - pendingDate(b, today)) || a.id.localeCompare(b.id)), [pending, filters, today]);
  const filtered = filters.group !== 'all' || filters.team !== 'all' || filters.ward !== 'all';

  function changeFilter<K extends keyof OperationFilters>(key: K, value: OperationFilters[K]) {
    setFilters(previous => ({...previous, [key]: value}));
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
      <div className="ops-filters" role="region" aria-label="Bộ lọc tổng quan">
        <label>Chúng
          <select aria-label="Lọc chúng tổng quan" value={filters.group} onChange={e => changeFilter('group', e.target.value as OperationFilters['group'])}>
            <option value="all">Cả ba chúng</option>
            {operationGroups.map(group => <option key={group} value={group}>{groupLabels[group]}</option>)}
          </select>
        </label>
        <label>Tổ
          <select aria-label="Lọc tổ tổng quan" value={filters.team} onChange={e => changeFilter('team', e.target.value)}>
            <option value="all">Tất cả tổ</option>
            {[1, 2, 3].map(team => <option key={team} value={team}>Tổ {team}</option>)}
            <option value="unknown">Chưa phân tổ</option>
          </select>
        </label>
        <label>Địa chỉ (mới)
          <select aria-label="Lọc khu vực tổng quan" value={filters.ward} onChange={e => changeFilter('ward', e.target.value)}>
            <option value="all">Tất cả khu vực</option>
            {wardOptions.map(ward => <option key={ward}>{ward}</option>)}
            <option value="unknown">Chưa rõ khu vực</option>
          </select>
        </label>
        {filtered && <Button variant="ghost" onClick={() => {setFilters(emptyOperationFilters); setWork('all');}}>
          <FilterX size={15} /> Xóa bộ lọc
        </Button>}
      </div>
      <div className="ops-summary-grid">
        <section className="ops-panel">
          <header>
            <h2>Cơ cấu 3 chúng</h2>
            <p>Hồ sơ đã duyệt</p>
          </header>
          <Donut items={composition} total={report.rows.length} colors={colors} />
        </section>
        <section className="ops-panel" ref={queueMotion}>
          <header className="ops-queue-header">
            <div>
              <h2>Đăng ký chờ duyệt</h2>
              <p className="ops-queue-total"><Clock3 size={17} aria-hidden="true" /> <strong>{formatCount(waiting.length)}</strong> phiếu</p>
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
          {waiting.length > 0 ? (
            <Button variant="secondary" aria-expanded={showPending} aria-controls={pendingId} onClick={() => setShowPending(open => !open)}>
              {showPending ? 'Ẩn danh sách chờ duyệt' : 'Xem danh sách chờ duyệt'}
            </Button>
          ) : <p className="ops-queue-empty">Không có phiếu chờ duyệt.</p>}
        </section>
      </div>
      <div id={pendingId} hidden={!showPending || !waiting.length}>
        {showPending && waiting.length > 0 && pendingPanel(waiting)}
      </div>
      <section className="ops-records" aria-label="Danh sách hồ sơ">
        <h2>{workLabels[work]} <small>{formatCount(records.length)}</small></h2>
        <div className="ops-work-tabs" role="group" aria-label="Lọc công việc">
          {(Object.keys(workLabels) as WorkKind[]).map(kind => (
            <button key={kind} type="button" aria-pressed={work === kind} onClick={() => setWork(kind)}>
              {workLabels[kind]} <span>{formatCount(report.counts[kind])}</span>
            </button>
          ))}
        </div>
        <DashboardMemberList
          key={JSON.stringify([filters.group, filters.team, filters.ward, work])}
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
