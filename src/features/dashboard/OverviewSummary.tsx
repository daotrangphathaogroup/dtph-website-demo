import { ArrowDown, ArrowUpRight, Clock3 } from "lucide-react";
import type { Member, MemberGroup } from "../../lib/types";
import { groupLabels } from "../../lib/types";

type Props = {
  members: Member[];
  waiting: Member[];
  selectedGroup: MemberGroup | "all";
  onGroup: (group: MemberGroup | "all") => void;
  onPending: () => void;
};
function Metric({value}: {value: number}) {
  const label = value.toLocaleString("vi-VN");
  return <strong className="dashboard-metric"><span aria-hidden="true" data-count-value={value}>{label}</span><span className="sr-only">{label}</span></strong>;
}
const groups = ["children", "youth", "congregation"] as const;

export default function OverviewSummary({
  members,
  waiting,
  selectedGroup,
  onGroup,
  onPending,
}: Props) {
  const total = members.length;
  return (
    <section
      className="overview-summary"
      aria-labelledby="overview-summary-title"
    >
      <header className="overview-section-heading">
        <h2 id="overview-summary-title">Hiện trạng hồ sơ</h2>
        <span>Theo bộ lọc đang chọn</span>
      </header>
      <div
        className="overview-kpis"
        role="group"
        aria-label="Cơ cấu nhóm và tình trạng duyệt"
      >
        <section
          className="overview-kpi overview-kpi-total"
          aria-label="Tổng huynh đệ đã duyệt"
        >
          <span className="overview-kpi-label">Tổng huynh đệ</span>
          <Metric value={total} />
          <small>Hồ sơ đã duyệt</small>
        </section>
        {groups.map((group) => {
          const count = members.filter(
            (member) => member.group === group,
          ).length;
          return (
            <button
              key={group}
              type="button"
              className={`overview-kpi overview-kpi-group kpi-${group}`}
              aria-label={`Lọc ${groupLabels[group]}`}
              aria-pressed={selectedGroup === group}
              onClick={() => onGroup(selectedGroup === group ? "all" : group)}
            >
              <span className="overview-kpi-label">
                <i aria-hidden="true" />
                {groupLabels[group]}
              </span>
              <Metric value={count} />
              <small>
                {total ? Math.round((count / total) * 100) : 0}% số đã duyệt{" "}
                <ArrowUpRight size={13} aria-hidden="true" />
              </small>
            </button>
          );
        })}
        <button
          className="overview-kpi overview-kpi-pending"
          type="button"
          disabled={!waiting.length}
          onClick={onPending}
          aria-label="Xem đăng ký chờ duyệt"
        >
          <span className="overview-kpi-label">
            <Clock3 size={14} aria-hidden="true" />
            Chờ duyệt
          </span>
          <Metric value={waiting.length} />
          <small>
            {waiting.length ? "Xem đăng ký" : "Đã xử lý tất cả"}
            <ArrowDown size={13} aria-hidden="true" />
          </small>
        </button>
      </div>
    </section>
  );
}
