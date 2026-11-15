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
        <svg className="community-ornament" viewBox="0 0 180 84" aria-hidden="true">
          <path d="M35 51C49 51 52 26 90 26S131 51 145 51M90 26V65" />
          <circle className="community-orbit" cx="90" cy="26" r="23" />
          <circle className="community-node blue" cx="90" cy="26" r="13" />
          <circle className="community-node purple" cx="35" cy="51" r="9" />
          <circle className="community-node coral" cx="145" cy="51" r="9" />
          <circle className="community-node mint" cx="90" cy="65" r="7" />
          <path className="community-core" d="M84 26h12M90 20v12" />
          <circle className="community-speck" cx="17" cy="27" r="2" />
          <circle className="community-speck" cx="156" cy="19" r="2" />
        </svg>
        <p>Chưa có danh sách quản lý.</p>
        <small>Thông tin sẽ được bổ sung sau.</small>
      </div>
    </aside>
  );
}
