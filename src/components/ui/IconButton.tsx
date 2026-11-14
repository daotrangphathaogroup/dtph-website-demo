"use client";
import { useEffect, useLayoutEffect, useId, useRef, useState } from "react";
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
    anchor: number;
    closing?: boolean;
  } | null>(null);
  const tooltip = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    id = useId();
  function close(immediate = false) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (immediate || matchMedia('(prefers-reduced-motion: reduce)').matches) {setPosition(null); return;}
    setPosition(old => old ? {...old, closing: true} : null);
    timer.current = setTimeout(() => {setPosition(null); timer.current = null;}, 90);
  }
  function show(button: HTMLButtonElement, delay: number) {
    close(true);
    // Native dialog's top layer should retain the native title tooltip.
    if (button.closest("dialog")) return;
    timer.current = setTimeout(() => {
      if (!button.isConnected || button.disabled) return;
      const r = button.getBoundingClientRect();
      const left = r.left + r.width / 2;
      setPosition({
        left,
        anchor: r.left + r.width / 2 - left,
        top: r.top > 60 ? r.top - 8 : r.bottom + 8,
        above: r.top > 60,
      });
    }, delay);
  }
  useLayoutEffect(() => {
    if (!position || position.closing || !tooltip.current) return;
    const half = tooltip.current.offsetWidth / 2;
    const center = position.left + position.anchor;
    const left = Math.max(half + 8, Math.min(innerWidth - half - 8, center));
    if (Math.abs(left - position.left) > .5)
      setPosition(old => old ? {...old, left, anchor: center - left} : null);
  }, [position?.top, position?.closing, label]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (!position) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const dismiss = () => close(true);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    document.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
      document.removeEventListener("keydown", key);
    };
  }, [position]);
  return (
    <>
      <button
        type={type}
        aria-label={label}
        title={position ? undefined : label}
        aria-describedby={position && !position.closing ? id : undefined}
        aria-busy={busy || undefined}
        className={`icon-button ${className}`}
        disabled={disabled || busy}
        {...props}
        onPointerEnter={(e) => {
          if (e.pointerType !== "touch") show(e.currentTarget, 280);
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
          close(true);
          onBlur?.(e);
        }}
        onClick={(e) => {
          close(true);
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
            ref={tooltip}
            id={id}
            role={position.closing ? undefined : "tooltip"}
            aria-hidden={position.closing || undefined}
            data-side={position.above ? "above" : "below"}
            data-closing={position.closing || undefined}
            className="action-tooltip"
            style={{
              left: position.left,
              top: position.top,
              transform: `translate(-50%, ${position.above ? "-100%" : "0"})`,
            }}
          >
            {label}
            <i className="action-tooltip-arrow" aria-hidden="true" style={{left: `clamp(10px, calc(50% + ${position.anchor}px), calc(100% - 10px))`}} />
          </span>,
          document.body,
        )}
    </>
  );
}
