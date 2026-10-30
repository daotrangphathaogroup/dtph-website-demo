import type { MemberGroup } from "./types";
import type { ProfileValues } from "./registration";

export const intakeKeys = [
  "name",
  "gender",
  "birthday",
  "address",
  "team",
  "phone",
  "parentName",
  "relativePhone",
  "avatar",
  "nickname",
  "introducedBy",
] as const;
export function registrationAge(
  birthday: string,
  today: string,
): number | null {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(birthday) ||
    birthday < "1900-01-01" ||
    birthday > today ||
    Number.isNaN(Date.parse(birthday)) ||
    new Date(birthday).toISOString().slice(0, 10) !== birthday
  )
    return null;
  return (
    Number(today.slice(0, 4)) -
    Number(birthday.slice(0, 4)) -
    (today.slice(5) < birthday.slice(5) ? 1 : 0)
  );
}
// One shared policy for intake UI and server; age is calculated on the Vietnam calendar date.
export function registrationGroup(
  birthday: string,
  today: string,
): MemberGroup | null {
  const age = registrationAge(birthday, today);
  return age === null
    ? null
    : age < 16
      ? "children"
      : age <= 40
        ? "youth"
        : "congregation";
}
export function intakeValues(
  values: ProfileValues,
  group: MemberGroup,
): ProfileValues {
  return Object.fromEntries(
    intakeKeys
      .filter(
        (key) =>
          !["parentName", "nickname"].includes(key) || group === "children",
      )
      .map((key) => [key, values[key] ?? ""]),
  );
}
export function intakeStepError(
  step: number,
  values: ProfileValues,
  today: string,
): string {
  const group = registrationGroup(String(values.birthday ?? ""), today);
  if (step === 0) {
    if (!String(values.name ?? "").trim()) return "Vui lòng nhập họ và tên.";
    if (!["Nam", "Nữ"].includes(String(values.gender)))
      return "Vui lòng chọn giới tính.";
    if (!group)
      return "Vui lòng nhập ngày sinh hợp lệ, từ năm 1900 đến hôm nay.";
  }
  if (step === 1) {
    if (!String(values.address ?? "").trim()) return "Vui lòng chọn phường.";
    if (!["1", "2", "3"].includes(String(values.team)))
      return "Vui lòng chọn Tổ 1, 2 hoặc 3.";
  }
  if (step === 2) {
    if (group !== "children" && !values.phone)
      return "Vui lòng nhập số điện thoại cá nhân.";
    for (const key of ["phone", "relativePhone"])
      if (values[key] && !/^0[35789]\d{8}$/.test(String(values[key])))
        return "Số điện thoại cần 10 chữ số, bắt đầu bằng đầu số Việt Nam hợp lệ.";
  }
  if (step === 3 && !values.avatar)
    return "Vui lòng chụp hoặc tải ảnh đại diện và xác nhận khung cắt 3×4.";
  return "";
}
