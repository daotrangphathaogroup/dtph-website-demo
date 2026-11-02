"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Check, KeyRound } from "lucide-react";
import Link from "next/link";
import { api } from "../../lib/api";
import { groupLabels } from "../../lib/types";
import type { ProfileValues } from "../../lib/registration";
import {
  intakeValues,
  intakeStepError,
  registrationAge,
  registrationGroup,
} from "../../lib/registration-flow";
import { todayInVietnam } from "../../lib/dashboard";
import { getTeam, teamAreas } from "../../lib/areas";
import { Button, Feedback, Field } from "../../components/ui/primitives";
import Dialog from "../../components/ui/Dialog";
import PortraitInput from "../../components/PortraitInput";
import MemberPicker from "../../components/MemberPicker";

const commonSteps = [
  "Thông tin cơ bản",
  "Khu vực",
  "Thông tin liên lạc",
  "Hình ảnh đại diện",
  "Người giới thiệu",
];
const blank: ProfileValues = {
  name: "",
  gender: "",
  birthday: "",
  address: "",
  team: "",
  phone: "",
  parentName: "",
  relativePhone: "",
  avatar: "",
  nickname: "",
  introducedBy: "",
};
export default function RegistrationIntake({
  isStaff = false,
  onRegistered,
}: {
  isStaff?: boolean;
  onRegistered?: () => void;
}) {
  const [values, setValues] = useState<ProfileValues>({ ...blank });
  const [current, setCurrent] = useState(0),
    [reached, setReached] = useState(0),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [processing, setProcessing] = useState(false),
    [reviewPayload, setReviewPayload] = useState("");
  const [receipt, setReceipt] = useState<"pending" | "approved" | null>(null);
  const id = useId(),
    root = useRef<HTMLDivElement>(null),
    request = useRef<{ id: string; payload: string } | null>(null),
    sending = useRef(false),
    moveFocus = useRef(false);
  const today = todayInVietnam(),
    birthday = String(values.birthday),
    group = registrationGroup(birthday, today),
    age = registrationAge(birthday, today),
    children = group === "children";
  const steps = children
    ? [...commonSteps.slice(0, 4), "Biệt danh", commonSteps[4]]
    : commonSteps;
  const finalStep = steps.length - 1;
  const receiptRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    if (receipt) {
      receiptRef.current?.focus();
      return;
    }
    const heading = root.current?.querySelector<HTMLElement>(
      "[data-active-heading]",
    );
    heading?.focus({ preventScroll: true });
    heading?.closest(".intake-step")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  }, [current, receipt]);
  function update(key: string, value: string) {
    setReviewPayload("");
    setError("");
    if (key === "birthday" && registrationGroup(value, today) !== group) {
      setCurrent(0);
      const nextGroup = registrationGroup(value, today);
      if (nextGroup && group)
        setReached((n) =>
          n < 4
            ? n
            : nextGroup === "children"
              ? n + (group === "children" ? 0 : 1)
              : Math.min(n, 4),
        );
    }
    setValues((v) => ({
      ...v,
      [key]: value,
      ...(key === "address" ? { team: getTeam(value) ?? "" } : {}),
    }));
  }
  function activateStep(step: number) {
    if (busy || step === current) return;
    setCurrent(step);
    setError("");
  }
  function next() {
    for (let step = 0; step <= reached; step++) {
      const problem = intakeStepError(step, values, today);
      if (problem) {
        setCurrent(step);
        setError(problem);
        moveFocus.current = true;
        return;
      }
    }
    const controls = root.current?.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(
      ".intake-step input:not([type=file]), .intake-step select, .intake-step textarea",
    );
    for (const control of controls ?? []) if (!control.reportValidity()) return;
    if (processing) {
      setError("Hoàn tất cắt ảnh trước khi tiếp tục.");
      return;
    }
    setError("");
    setCurrent(reached + 1);
    setReached(reached + 1);
    moveFocus.current = true;
  }
  async function submit(confirmed = false) {
    if (sending.current || processing || reached !== finalStep) return;
    for (let step = 0; step < finalStep; step++) {
      const problem = intakeStepError(step, values, today);
      if (problem) {
        setCurrent(step);
        setError(problem);
        moveFocus.current = true;
        return;
      }
    }
    for (const control of root.current?.querySelectorAll<HTMLInputElement>(
      'input[role="combobox"]',
    ) ?? [])
      if (!control.reportValidity()) return;
    if (!group) return;
    const payload = JSON.stringify(intakeValues(values, group));
    if (!confirmed || reviewPayload !== payload) {
      setReviewPayload(payload);
      return;
    }
    if (request.current?.payload !== payload)
      request.current = { id: crypto.randomUUID(), payload };
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await api<{
        status: "pending" | "approved" | "rejected";
      }>("/registrations/auto", "POST", {
        values: JSON.parse(payload),
        requestId: request.current.id,
      });
      if (result.status === "rejected")
        throw new Error(
          "Phiếu này đã được từ chối. Vui lòng liên hệ nhân sự Đạo Tràng.",
        );
      setReceipt(result.status);
      onRegistered?.();
      moveFocus.current = true;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  if (receipt)
    return (
      <section
        className="intake-complete"
        role="status"
        ref={receiptRef}
        tabIndex={-1}
      >
        <Check size={28} aria-hidden="true" />
        <h2>Đã gửi phiếu đăng ký</h2>
        <p>
          {receipt === "approved"
            ? "Hồ sơ đã được ghi nhận vào danh sách huynh đệ."
            : "Phiếu đã được gửi đến nhân sự Đạo Tràng và đang chờ duyệt."}
        </p>
        <Button
          onClick={() => {
            setValues({ ...blank });
            setCurrent(0);
            setReached(0);
            setReceipt(null);
            setReviewPayload("");
            setError("");
            request.current = null;
            moveFocus.current = true;
          }}
        >
          Đăng ký thông tin mới
        </Button>
      </section>
    );
  return (
    <div className="registration-intake" ref={root}>
      <header className="intake-intro">
        <p>
          Điền lần lượt các thông tin. Nhóm sinh hoạt được xác định từ ngày
          sinh.
        </p>
        <span className="intake-progress" aria-live="polite">
          {current + 1} / {steps.length}
          {group && <> · {groupLabels[group]}</>}
        </span>
        <div className="intake-progress-track" aria-hidden="true">
          {steps.map((title, index) => (
            <span
              key={title}
              className={
                index === current ? "current" : index < reached ? "done" : ""
              }
            />
          ))}
        </div>
      </header>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (reached === finalStep) void submit();
          else next();
        }}
      >
        <fieldset disabled={busy}>
          <legend className="sr-only">Phiếu đăng ký thông tin sinh hoạt</legend>
          {steps.map((title, index) =>
            index <= reached ? (
              <section
                key={title}
                className={`intake-step ${index === current ? "active" : "completed"}`}
                onClick={() => activateStep(index)}
                onFocusCapture={() => activateStep(index)}
                aria-labelledby={`${id}-heading-${index}`}
              >
                <header className="intake-step-heading">
                  <span className="intake-step-number" aria-hidden="true">
                    {index < reached && index !== current ? (
                      <Check size={14} />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <h2
                    id={`${id}-heading-${index}`}
                    tabIndex={-1}
                    data-active-heading={index === current ? "" : undefined}
                  >
                    {title}
                  </h2>
                </header>
                <div className="intake-step-body">
                  {index === 0 && (
                    <>
                      <Field required label="Họ và tên" htmlFor={`${id}-name`}>
                        <input
                          id={`${id}-name`}
                          required
                          autoComplete="name"
                          maxLength={200}
                          value={values.name}
                          onChange={(e) => update("name", e.target.value)}
                        />
                      </Field>
                      <Field required label="Giới tính" htmlFor={`${id}-gender`}>
                        <select
                          id={`${id}-gender`}
                          required
                          value={values.gender}
                          onChange={(e) => update("gender", e.target.value)}
                        >
                          <option value="">Chọn giới tính</option>
                          <option>Nam</option>
                          <option>Nữ</option>
                        </select>
                      </Field>
                      <Field required label="Ngày sinh" htmlFor={`${id}-birthday`}>
                        <input
                          id={`${id}-birthday`}
                          required
                          type="date"
                          min="1900-01-01"
                          max={today}
                          autoComplete="bday"
                          value={birthday}
                          onChange={(e) => update("birthday", e.target.value)}
                        />
                      </Field>
                      {group && (
                        <p className="intake-group" role="status">
                          {age} tuổi · <strong>{groupLabels[group]}</strong>
                        </p>
                      )}
                    </>
                  )}
                  {index === 1 && (
                    <>
                      <Field required label="Địa chỉ / Phường" htmlFor={`${id}-address`}>
                        <select
                          id={`${id}-address`}
                          required
                          value={values.address}
                          onChange={(e) => update("address", e.target.value)}
                        >
                          <option value="">Chọn phường</option>
                          {([1, 2, 3] as const).map((team) => (
                            <optgroup key={team} label={`Tổ ${team}`}>
                              {teamAreas[team].map((ward) => (
                                <option key={ward}>{ward}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </Field>
                      <Field
                        required
                        label="Tổ"
                        htmlFor={`${id}-team`}
                        hint="Tự chọn theo phường. Có thể đổi tổ theo nhu cầu sinh hoạt."
                      >
                        <select
                          id={`${id}-team`}
                          required
                          value={values.team}
                          onChange={(e) => update("team", e.target.value)}
                        >
                          <option value="">Chọn tổ</option>
                          {[1, 2, 3].map((team) => (
                            <option value={team} key={team}>
                              Tổ {team}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </>
                  )}
                  {index === 2 && (
                    <>
                      <Field
                        required={!children}
                        label={
                          children ? "SĐT cá nhân (nếu có)" : "SĐT cá nhân"
                        }
                        htmlFor={`${id}-phone`}
                      >
                        <input
                          id={`${id}-phone`}
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel-national"
                          required={!children}
                          pattern="0[35789][0-9]{8}"
                          maxLength={10}
                          value={values.phone}
                          onChange={(e) => update("phone", e.target.value)}
                        />
                      </Field>
                      {children && (
                        <Field
                          label="Họ và tên phụ huynh (nếu có)"
                          htmlFor={`${id}-parent`}
                        >
                          <input
                            id={`${id}-parent`}
                            maxLength={200}
                            value={values.parentName}
                            onChange={(e) =>
                              update("parentName", e.target.value)
                            }
                          />
                        </Field>
                      )}
                      <Field
                        label={
                          children
                            ? "SĐT Phụ huynh (nếu có)"
                            : "SĐT Người thân (nếu có)"
                        }
                        htmlFor={`${id}-relative`}
                      >
                        <input
                          id={`${id}-relative`}
                          type="tel"
                          inputMode="tel"
                          autoComplete="off"
                          pattern="0[35789][0-9]{8}"
                          maxLength={10}
                          value={values.relativePhone}
                          onChange={(e) =>
                            update("relativePhone", e.target.value)
                          }
                        />
                      </Field>
                    </>
                  )}
                  {index === 3 && (
                    <>
                      <p className="field-title">Ảnh đại diện <span className="required" aria-hidden="true">*</span></p>
                      <PortraitInput
                        value={String(values.avatar)}
                        onChange={(v) => update("avatar", v)}
                        onError={setError}
                        onProcessing={setProcessing}
                      />
                      <p className="intake-note">
                        Chọn hoặc chụp ảnh, điều chỉnh khung 3×4 rồi nhấn “Dùng
                        ảnh này”.
                      </p>
                    </>
                  )}
                  {children && index === 4 && (
                    <Field
                      label="Biệt danh (nếu có)"
                      htmlFor={`${id}-nickname`}
                    >
                      <input
                        id={`${id}-nickname`}
                        maxLength={200}
                        value={values.nickname}
                        onChange={(e) => update("nickname", e.target.value)}
                      />
                    </Field>
                  )}
                  {index === finalStep && (
                    <>
                      <p className="intake-note">
                        Nếu có người giới thiệu, nhập tên và chọn đúng huynh đệ
                        trong danh sách. Có thể để trống.
                      </p>
                      <Field label="Người giới thiệu (nếu có)">
                        <MemberPicker
                          value={String(values.introducedBy)}
                          label="Người giới thiệu (nếu có)"
                          required={false}
                          onChange={(v) => update("introducedBy", v)}
                        />
                      </Field>
                      <div className="intake-review">
                        <strong>{values.name}</strong>
                        <span>
                          {group && groupLabels[group]} · {age} tuổi
                        </span>
                        <span>
                          {values.address} · Tổ {values.team}
                        </span>
                        <small>
                          {isStaff
                            ? "Phiếu được ghi nhận trực tiếp vì bạn đang đăng nhập tài khoản quản lý."
                            : "Phiếu được gửi đến nhân sự Đạo Tràng để duyệt."}
                        </small>
                      </div>
                    </>
                  )}
                  {index === current && error && !reviewPayload && (
                    <Feedback>{error}</Feedback>
                  )}
                  {index === reached && (
                    <>
                      <div className="intake-actions">
                        {reached === finalStep ? (
                          <Button
                            type="submit"
                            busy={busy}
                            disabled={processing}
                          >
                            Gửi phiếu đăng ký
                          </Button>
                        ) : (
                          <Button type="submit" disabled={processing}>
                            {processing
                              ? "Hoàn tất cắt ảnh để tiếp tục"
                              : "Tiếp tục"}
                            {!processing && <ArrowRight size={16} />}
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </section>
            ) : null,
          )}
        </fieldset>
      </form>
      {reviewPayload && (
        <Dialog
          title="Xác nhận đăng ký"
          description="Vui lòng kiểm tra lại toàn bộ thông tin trước khi gửi phiếu đăng ký."
          className="intake-confirm-dialog"
          busy={busy}
          onClose={() => {
            setReviewPayload("");
            setError("");
          }}
        >
          <p>Huynh đệ xác nhận các thông tin đã điền là chính xác?</p>
          {error && <Feedback>{error}</Feedback>}
          <div className="intake-confirm-actions">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setReviewPayload("");
                setError("");
              }}
            >
              Quay lại kiểm tra
            </Button>
            <Button busy={busy} onClick={() => void submit(true)}>
              Xác nhận gửi phiếu
            </Button>
          </div>
        </Dialog>
      )}
      {!isStaff && (
        <Link href="/quan-tri" className="intake-staff-link">
          <KeyRound size={14} />
          Đăng nhập quản trị
        </Link>
      )}
    </div>
  );
}
