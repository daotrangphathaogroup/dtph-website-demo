"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";

export function parseDateInput(text: string): string {
  const parts = text.trim().match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/)
    ?? text.trim().match(/^(\d{2})(\d{2})(\d{4})$/);
  if (!parts) return "";
  const iso = `${parts[3]}-${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
  const date = new Date(iso);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : "";
}
type DateParts = [string, string, string];
const fromISO = (iso: string): DateParts => /^\d{4}-\d{2}-\d{2}$/.test(iso)
  ? [iso.slice(8), iso.slice(5, 7), iso.slice(0, 4)] : ["", "", ""];
const displayDate = (iso: string) => fromISO(iso).join("/");
const lengths = [2, 2, 4];

// Visible separators never participate in editing; stored dates remain ISO strings.
export default function DateInput({
  value, onChange, min = "1900-01-01", max, ...props
}: Omit<ComponentProps<"input">, "value" | "onChange" | "type" | "min" | "max"> & {
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
}) {
  const [parts, setParts] = useState<DateParts>(() => fromISO(value));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const emitted = useRef(value);
  const pendingFocus = useRef<{index: number; select: boolean} | null>(null);
  useLayoutEffect(() => {
    const next = pendingFocus.current;
    if (!next) return;
    pendingFocus.current = null;
    const field = inputs.current[next.index];
    field?.focus({preventScroll: true});
    if (next.select) field?.select();
    else field?.setSelectionRange(field.value.length, field.value.length);
  }, [parts]);
  useEffect(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    setParts(fromISO(value));
  }, [value]);
  const iso = parseDateInput(parts.join("/"));
  const valid = !!iso && iso >= min && (!max || iso <= max);
  useEffect(() => {
    const message = parts.some(Boolean) && !valid
      ? `Nhập ngày/tháng/năm hợp lệ, từ ${displayDate(min)}${max ? ` đến ${displayDate(max)}` : ""}.` : "";
    for (const input of inputs.current) input?.setCustomValidity(message);
  }, [parts, valid, min, max]);
  function update(next: DateParts) {
    setParts(next);
    const parsed = parseDateInput(next.join("/"));
    emitted.current = parsed && parsed >= min && (!max || parsed <= max) ? parsed : "";
    onChange(emitted.current);
  }
  function distribute(index: number, digits: string) {
    const next: DateParts = [...parts];
    let target = index;
    for (let i = index; i < 3 && digits; i++) {
      next[i] = digits.slice(0, lengths[i]);
      digits = digits.slice(lengths[i]);
      target = i;
    }
    pendingFocus.current = {index: target, select: false};
    update(next);
  }
  return <div className="typed-date-control" role="group" aria-label="Ngày / tháng / năm">
    {parts.map((part, index) => <span className="date-segment" key={index}>
      {index > 0 && <span className="date-separator" aria-hidden="true">/</span>}
      <input
        {...props}
        ref={node => {inputs.current[index] = node;}}
        id={props.id ? index === 0 ? props.id : `${props.id}-${index}` : undefined}
        name={index === 0 ? props.name : undefined}
        aria-label={index === 0 ? props["aria-label"] : index === 1 ? "Tháng sinh" : "Năm sinh"}
        autoFocus={index === 0 ? props.autoFocus : undefined}
        autoComplete={props.autoComplete === "bday" ? ["bday-day", "bday-month", "bday-year"][index] : props.autoComplete}
        type="text"
        inputMode="numeric"
        placeholder={["Ngày", "Tháng", "Năm"][index]}
        maxLength={lengths[index]}
        value={part}
        onChange={event => {
          const digits = event.target.value.normalize("NFKC").replace(/\D/g, "");
          if (digits.length > lengths[index]) {distribute(index, digits); return;}
          const next: DateParts = [...parts]; next[index] = digits;
          const deleting = (event.nativeEvent as InputEvent).inputType?.startsWith("delete");
          if (!deleting && index < 2 && digits.length === lengths[index] && event.target.selectionStart === event.target.value.length)
            pendingFocus.current = {index: index + 1, select: true};
          update(next);
        }}
        onPaste={event => {
          const text = event.clipboardData.getData("text").trim().normalize("NFKC");
          const isoParts = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          const dateParts = text.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/)
            ?? text.match(/^(\d{2})(\d{2})(\d{4})$/);
          event.preventDefault();
          if (isoParts || dateParts) {
            const next: DateParts = isoParts ? [isoParts[3], isoParts[2], isoParts[1]]
              : [dateParts![1].padStart(2, "0"), dateParts![2].padStart(2, "0"), dateParts![3]];
            pendingFocus.current = {index: 2, select: false}; update(next);
          } else {
            const digits = text.replace(/\D/g, "");
            if (digits) distribute(index, digits);
          }
        }}
        onKeyDown={event => {
          const field = event.currentTarget;
          if (["/", "-", "."].includes(event.key) && index < 2) {
            event.preventDefault();
            const next: DateParts = [...parts]; if (part) next[index] = part.padStart(2, "0");
            pendingFocus.current = {index: index + 1, select: true}; update(next);
          } else if (index > 0 && ((event.key === "Backspace" && !part) || (event.key === "ArrowLeft" && field.selectionStart === 0 && field.selectionEnd === 0))) {
            event.preventDefault(); const previous = inputs.current[index - 1]; previous?.focus(); previous?.setSelectionRange(previous.value.length, previous.value.length);
          } else if (index < 2 && event.key === "ArrowRight" && field.selectionStart === part.length) {
            event.preventDefault(); inputs.current[index + 1]?.focus(); inputs.current[index + 1]?.setSelectionRange(0, 0);
          }
          props.onKeyDown?.(event);
        }}
        onBlur={event => {
          if (index < 2 && part.length === 1) {const next: DateParts = [...parts]; next[index] = part.padStart(2, "0"); update(next);}
          props.onBlur?.(event);
        }}
      />
    </span>)}
  </div>;
}
