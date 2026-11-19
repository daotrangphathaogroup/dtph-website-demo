"use client";
import { useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";

export function parseDateInput(text: string): string {
  const parts = text.trim().match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/)
    ?? text.trim().match(/^(\d{2})(\d{2})(\d{4})$/);
  if (!parts) return "";
  const iso = `${parts[3]}-${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
  const date = new Date(iso);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : "";
}
const displayDate = (iso: string) => iso ? iso.split("-").reverse().join("/") : "";

// Keep the stored ISO date while allowing typing on every platform, without a native date picker.
export default function DateInput({
  value, onChange, min = "1900-01-01", max, ...props
}: Omit<ComponentProps<"input">, "value" | "onChange" | "type" | "min" | "max"> & {
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
}) {
  const [text, setText] = useState(() => displayDate(value));
  const input = useRef<HTMLInputElement>(null);
  const emitted = useRef(value);
  useEffect(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    setText(displayDate(value));
  }, [value]);
  const iso = parseDateInput(text);
  const valid = !!iso && iso >= min && (!max || iso <= max);
  useEffect(() => {
    input.current?.setCustomValidity(text && !valid ? `Nhập ngày/tháng/năm hợp lệ, từ ${displayDate(min)}${max ? ` đến ${displayDate(max)}` : ""}.` : "");
  }, [text, valid, min, max]);
  return <input
    {...props}
    ref={input}
    type="text"
    inputMode="numeric"
    placeholder="DD/MM/YYYY"
    maxLength={10}
    value={text}
    onChange={(event) => {
      const next = event.target.value;
      setText(next);
      const parsed = parseDateInput(next);
      emitted.current = parsed && parsed >= min && (!max || parsed <= max) ? parsed : "";
      onChange(emitted.current);
    }}
    onBlur={(event) => {
      if (valid) setText(displayDate(iso));
      props.onBlur?.(event);
    }}
  />;
}
