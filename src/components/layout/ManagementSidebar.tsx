import { UsersRound } from "lucide-react";

export default function ManagementSidebar() {
  return (
    <aside
      className="management-sidebar"
      aria-labelledby="management-sidebar-title"
    >
      <header>
        <span className="management-sidebar-icon" aria-hidden="true">
          <UsersRound size={18} />
        </span>
        <h2 id="management-sidebar-title">Huynh đệ quản lý</h2>
      </header>
      <div className="management-sidebar-empty">
        <p>Chưa có danh sách quản lý.</p>
        <small>Thông tin sẽ được bổ sung sau.</small>
      </div>
    </aside>
  );
}
