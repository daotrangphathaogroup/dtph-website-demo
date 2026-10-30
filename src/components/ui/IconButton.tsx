"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { ComponentProps } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle } from "lucide-react";

/** Short, delayed labels for dense toolbars; no layout shifts or pointer interception. */
export default function IconButton({
  label,
  busy = false,
  className = "",
  children,
  disabled,
  type = "button",
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  onClick,
  ...props
}: ComponentProps<"button"> & { label: string; busy?: boolean }) {
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    above: boolean;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    id = useId();
  function close() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setPosition(null);
  }
  function show(button: HTMLButtonElement, delay: number) {
    close();
    // Native dialog's top layer should retain the native title tooltip.
    if (button.closest("dialog")) return;
    timer.current = setTimeout(() => {
      const r = button.getBoundingClientRect();
      setPosition({
        left: Math.max(126, Math.min(innerWidth - 126, r.left + r.width / 2)),
        top: r.top > 60 ? r.top - 8 : r.bottom + 8,
        above: r.top > 60,
      });
    }, delay);
  }
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (!position) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", key);
    };
  }, [position]);
  return (
    <>
      <button
        type={type}
        aria-label={label}
        title={position ? undefined : label}
        aria-describedby={position ? id : undefined}
        aria-busy={busy || undefined}
        className={`icon-button ${className}`}
        disabled={disabled || busy}
        {...props}
        onPointerEnter={(e) => {
          if (e.pointerType !== "touch") show(e.currentTarget, 450);
          onPointerEnter?.(e);
        }}
        onPointerLeave={(e) => {
          close();
          onPointerLeave?.(e);
        }}
        onFocus={(e) => {
          if (e.currentTarget.matches(":focus-visible"))
            show(e.currentTarget, 0);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          close();
          onBlur?.(e);
        }}
        onClick={(e) => {
          close();
          onClick?.(e);
        }}
      >
        {busy ? (
          <LoaderCircle size={18} className="is-spinning" aria-hidden="true" />
        ) : (
          children
        )}
      </button>
      {position &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            className="action-tooltip"
            style={{
              left: position.left,
              top: position.top,
              transform: `translate(-50%, ${position.above ? "-100%" : "0"})`,
            }}
          >
            {label}
          </span>,
          document.body,
        )}
    </>
  );
}
