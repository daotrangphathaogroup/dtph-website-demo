"use client";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Baby,
  ChevronDown,
  ChevronRight,
  Flower2,
  ClipboardPen,
  KeyRound,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  PanelLeftClose,
  Search,
  UserRound,
  X,
} from "lucide-react";
import Brand from "../Brand";
import { Badge, IconButton } from "../ui/primitives";
import type { Session } from "../../lib/api";
import type { MemberGroup } from "../../lib/types";
import { groupLabels } from "../../lib/types";
export type WorkspacePage =
  "dashboard" | "overview" | "search" | "members" | "accounts" | "password";
type Props = {
  page: WorkspacePage;
  group: MemberGroup;
  heading: string;
  staff: Session | null;
  waiting: Record<MemberGroup, number>;
  onNavigate: (page: WorkspacePage, group?: MemberGroup) => void;
  onLogout: () => void;
  children: ReactNode;
};
export default function WorkspaceShell({
  page,
  group,
  heading,
  staff,
  waiting,
  onNavigate,
  onLogout,
  children,
}: Props) {
  const [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false),
    [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null),
    accountTrigger = useRef<HTMLButtonElement>(null),
    sidebarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("ph-menu-collapsed") === "true");
    } catch {}
  }, []);
  useEffect(() => {
    if (!accountOpen) return;
    const close = (e: PointerEvent) => {
      if (!accountRef.current?.contains(e.target as Node))
        setAccountOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAccountOpen(false);
        accountTrigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [accountOpen]);
  useEffect(() => {
    if (!mobile) return;
    const previous = document.activeElement as HTMLElement | null,
      old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebarRef.current?.querySelector<HTMLElement>("button")?.focus();
    const close = () => {
      setMobile(false);
    };
    const resize = () => {
      if (window.innerWidth > 760) close();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const controls = Array.from(
          sidebarRef.current?.querySelectorAll<HTMLElement>(
            "button:not(:disabled)",
          ) ?? [],
        ).filter((el) => el.offsetParent !== null),
        first = controls[0],
        last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("resize", resize);
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      window.removeEventListener("resize", resize);
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [mobile]);
  function navigate(next: WorkspacePage, nextGroup?: MemberGroup) {
    setMobile(false);
    setAccountOpen(false);
    onNavigate(next, nextGroup);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function toggle() {
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem("ph-menu-collapsed", String(next));
      } catch {}
      return next;
    });
  }
  const navItem = (
    key: WorkspacePage,
    label: string,
    Icon: typeof ClipboardPen,
    nextGroup?: MemberGroup,
  ) => {
    const active = page === key && (key !== "members" || group === nextGroup),
      count = nextGroup ? waiting[nextGroup] : 0;
    return (
      <button
        key={nextGroup ?? key}
        type="button"
        className={`nav-item ${active ? "active" : ""}`}
        aria-label={label}
        title={collapsed ? label : undefined}
        aria-current={active ? "page" : undefined}
        onClick={() => navigate(key, nextGroup)}
      >
        <Icon size={18} aria-hidden="true" />
        <span className="nav-label">{label}</span>
        {count > 0 && (
          <span className="nav-count" aria-label={`${count} đăng ký chờ duyệt`}>
            {count}
          </span>
        )}
      </button>
    );
  };
  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      <header className="topbar" inert={mobile}>
        <div className="topbar-brand">
          <IconButton
            label="Mở menu"
            className="mobile-menu"
            onClick={() => setMobile(true)}
            aria-expanded={mobile}
            aria-controls="workspace-navigation"
          >
            <Menu size={20} />
          </IconButton>
          <Link
            href="/"
            className="brand workspace-brand"
            aria-label="Đạo Tràng Phật Hào"
          >
            <Brand />
          </Link>
        </div>
        <div className="breadcrumb">
          <span>Cổng thông tin</span>
          <ChevronRight size={14} aria-hidden="true" />
          <span aria-current="page">{heading}</span>
        </div>
        {staff && (
          <div className="account-area" ref={accountRef}>
            <Badge>
              {staff.role === "dev"
                ? "Dev"
                : staff.role === "admin"
                  ? "Admin"
                  : "Manager"}
            </Badge>
            <button
              ref={accountTrigger}
              type="button"
              className="account-trigger"
              aria-label={`Tài khoản ${staff.username}`}
              aria-expanded={accountOpen}
              aria-controls="account-menu"
              onClick={() => setAccountOpen((v) => !v)}
            >
              <span className="account-avatar" aria-hidden="true">
                {staff.username.slice(0, 1).toUpperCase()}
              </span>
              <span className="account-name">{staff.username}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            {accountOpen && (
              <div className="account-dropdown" id="account-menu">
                <div className="account-summary">
                  <b>{staff.username}</b>
                  <small>
                    {staff.role === "dev"
                      ? "Nhà phát triển"
                      : staff.role === "admin"
                        ? "Quản trị viên"
                        : "Quản lý"}
                  </small>
                </div>
                {staff.role === "dev" && (
                  <button type="button" onClick={() => navigate("accounts")}>
                    <UserRound size={16} />
                    Quản lý tài khoản
                  </button>
                )}
                <button type="button" onClick={() => navigate("password")}>
                  <KeyRound size={16} />
                  Đổi mật khẩu
                </button>
                <div className="dropdown-divider" />
                <button
                  type="button"
                  onClick={() => {
                    setAccountOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </header>
      <aside
        ref={sidebarRef}
        id="workspace-navigation"
        className={`sidebar ${mobile ? "open" : ""}`}
        aria-label="Thanh điều hướng"
        role={mobile ? "dialog" : undefined}
        aria-modal={mobile || undefined}
      >
        <div className="sidebar-heading">
          <span className="workspace-label">Điều hướng</span>
          <IconButton
            className="collapse-menu"
            label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
            aria-expanded={!collapsed}
            onClick={toggle}
          >
            {collapsed ? (
              <ChevronRight size={16} />
            ) : (
              <PanelLeftClose size={16} />
            )}
          </IconButton>
          <IconButton
            className="close-mobile-menu"
            label="Đóng menu"
            onClick={() => setMobile(false)}
          >
            <X size={18} />
          </IconButton>
        </div>
        <nav aria-label="Điều hướng chính">
          {navItem("overview", "Đăng ký thông tin", ClipboardPen)}
          {navItem("search", "Tìm kiếm nhanh", Search)}
          {staff && (
            <>
              <div className="nav-section-label">Hồ sơ huynh đệ</div>
              {navItem("dashboard", "Tổng quan", LayoutDashboard)}
              {navItem("members", groupLabels.children, Baby, "children")}
              {navItem("members", groupLabels.youth, Leaf, "youth")}
              {navItem(
                "members",
                groupLabels.congregation,
                Flower2,
                "congregation",
              )}
            </>
          )}
          {staff?.role === "dev" && (
            <>
              <div className="nav-section-label">Quản trị</div>
              {navItem("accounts", "Quản lý tài khoản", UserRound)}
            </>
          )}
        </nav>
      </aside>
      {mobile && (
        <button
          className="mobile-scrim"
          aria-label="Đóng điều hướng"
          onClick={() => setMobile(false)}
          tabIndex={-1}
        />
      )}
      <div className="main-shell" inert={mobile}>
        <main
          id="main-content"
          className={`content ${page === "dashboard" || page === "members" ? "dashboard-content" : ""}`}
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
