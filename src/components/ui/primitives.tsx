import IconButton from "./IconButton";
import type {
  ComponentProps,
  HTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  Inbox,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  busy?: boolean;
};
export function Button({
  variant = "primary",
  busy = false,
  className = "",
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`button ${variant} ${className}`}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...props}
    >
      {busy && (
        <LoaderCircle size={16} className="is-spinning" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
export { default as IconButton } from "./IconButton";
export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: "neutral" | "blue" | "green" | "gold" | "danger";
  children: ReactNode;
  className?: string;
}) {
  return <span className={`badge ${tone} ${className}`}>{children}</span>;
}
export function Card({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section className={`panel ${className}`} {...props}>
      {children}
    </section>
  );
}
export function CardHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="panel-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {actions}
    </header>
  );
}
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions}
    </div>
  );
}
export function Field({
  label,
  hint,
  htmlFor,
  children,
  required = false,
}: {
  label: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div className="field">
      <label className="field-title" htmlFor={htmlFor}>
        {label}
        {required && (
          <span className="required" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {hint && <small>{hint}</small>}
    </div>
  );
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} />;
}
export function Feedback({
  children,
  tone = "error",
  onDismiss,
  action,
}: {
  children: ReactNode;
  tone?: "error" | "success" | "info";
  onDismiss?: () => void;
  action?: ReactNode;
}) {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      className={`feedback feedback-${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon size={18} aria-hidden="true" />
      <div>{children}</div>
      {action}
      {onDismiss && (
        <IconButton label="Đóng thông báo" onClick={onDismiss}>
          <X size={16} />
        </IconButton>
      )}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">
        {icon ?? <Inbox size={24} />}
      </span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
export function LoadingState({
  label = "Đang tải nội dung…",
}: {
  label?: string;
}) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <LoaderCircle className="is-spinning" size={20} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
export function FeatureSkeleton() {
  return (
    <div
      className="feature-skeleton"
      role="status"
      aria-label="Đang tải nội dung"
    >
      <div className="skeleton-line" />
      <div className="skeleton-cards">
        {[1, 2, 3].map((n) => (
          <div key={n} />
        ))}
      </div>
      <div className="skeleton-panel" />
      <span className="sr-only">Đang tải nội dung…</span>
    </div>
  );
}
export function SearchField({
  value,
  onChange,
  label,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={`search-control ${className}`}>
      <Search size={18} aria-hidden="true" />
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        maxLength={100}
      />
      {value && (
        <IconButton
          label={`Xóa ${label.toLocaleLowerCase("vi")}`}
          onClick={() => onChange("")}
        >
          <X size={16} />
        </IconButton>
      )}
    </div>
  );
}
export function SegmentedControl<T extends string>({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  items: { value: T; label: ReactNode }[];
}) {
  return (
    <div className="segmented-control" role="group" aria-label={label}>
      {items.map((item) => (
        <button
          type="button"
          key={item.value}
          aria-pressed={value === item.value}
          className={value === item.value ? "selected" : ""}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
