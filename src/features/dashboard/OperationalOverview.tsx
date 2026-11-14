'use client';
import {useId, useState} from 'react';
import type {ReactNode} from 'react';
import {Clock3, RefreshCw} from 'lucide-react';
import {Button, IconButton} from '../../components/ui/primitives';
import {groupLabels} from '../../lib/types';
import type {Member} from '../../lib/types';
import {todayInVietnam} from '../../lib/dashboard';
import {operationGroups, pendingDate} from '../../lib/operations';
import {useChartMotion} from '../../hooks/useChartMotion';
import {Donut} from './DashboardCharts';

const colors = ['var(--children-color)', 'var(--youth-color)', 'var(--congregation-color)'];
const vietnamDate = new Intl.DateTimeFormat("en-CA", {timeZone: "Asia/Ho_Chi_Minh"});
const formatCount = (count: number) => count.toLocaleString('vi-VN');

type Props = {
  members: Member[];
  pending: Member[];
  pendingPanel: (members: Member[]) => ReactNode;
  onRefresh: () => Promise<void>;
};

export default function OperationalOverview({members, pending, pendingPanel, onRefresh}: Props) {
  const [showPending, setShowPending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pendingId = useId();
  const queueMotion = useChartMotion();
  const approved = members.filter(member => member.registrationStatus === 'approved');
  const today = todayInVietnam();
  const waiting = pending.filter(member => member.registrationStatus === 'pending').sort((a, b) =>
    (pendingDate(a, today) - pendingDate(b, today)) || a.id.localeCompare(b.id)
  );
  const oldest = waiting[0];
  const oldestTimestamp = oldest ? pendingDate(oldest, today) : Infinity;
  const unknownDates = waiting.filter(member => !Number.isFinite(pendingDate(member, today))).length;
  const daysWaiting = Number.isFinite(oldestTimestamp)
    ? (Date.parse(today) - Date.parse(vietnamDate.format(oldestTimestamp))) / 86_400_000
    : null;
  const composition = operationGroups.map(group => ({
    label: groupLabels[group],
    count: approved.filter(member => member.group === group).length,
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
      <div className="ops-summary-grid">
        <section className="ops-panel">
          <header>
            <h2>Cơ cấu 3 chúng</h2>
            <p>Hồ sơ đã duyệt</p>
          </header>
          <Donut items={composition} total={approved.length} colors={colors} />
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
    </div>
  );
}
