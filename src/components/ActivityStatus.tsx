import { activityStatuses } from "../lib/registration";

export default function ActivityStatus({ value }: { value: string | number }) {
  const level = activityStatuses.indexOf(String(value));
  return (
    <span
      className={`activity-status-value ${level >= 0 ? `activity-level-${level}` : ""}`}
    >
      {level >= 0 && <i aria-hidden="true" />}
      {value}
    </span>
  );
}
