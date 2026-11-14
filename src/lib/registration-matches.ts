import {sheetText} from './sheet.ts';
import type {Member} from './types';

function identity(member: Member) {
  const phone = String(member.profileData?.phone || member.phone || '')
    .replace(/\D/g, '').replace(/^84(?=[35789]\d{8}$)/, '0');
  return {
    name: sheetText(member.name).trim().replace(/\s+/g, ' '),
    birthday: String(member.profileData?.birthday || member.birthday || ''),
    phone: /^0[35789]\d{8}$/.test(phone) ? phone : '',
  };
}

export function findRegistrationMatches(pending: Member[], directory: Member[]) {
  const byName = new Map<string, {member: Member; identity: ReturnType<typeof identity>}[]>();
  for (const member of directory) {
    const entry = identity(member);
    if (!entry.name) continue;
    const bucket = byName.get(entry.name) ?? [];
    bucket.push({member, identity: entry});
    byName.set(entry.name, bucket);
  }
  return new Map(pending.map(member => {
    const entry = identity(member);
    const matches = (byName.get(entry.name) ?? []).flatMap(candidate => {
      if (candidate.member.id === member.id) return [];
      const other = candidate.identity;
      const sameBirthday = entry.birthday && entry.birthday === other.birthday;
      const samePhone = entry.phone && entry.phone === other.phone;
      const reasons = ['Trùng họ tên'];
      if (sameBirthday) reasons.push('trùng ngày sinh');
      else if (entry.birthday && other.birthday) reasons.push('khác ngày sinh');
      if (samePhone) reasons.push('trùng SĐT cá nhân');
      return [{member: candidate.member, reason: reasons.join(', '), likely: Boolean(sameBirthday || (samePhone && !(entry.birthday && other.birthday)))}];
    }).sort((a, b) => Number(b.likely) - Number(a.likely));
    return [member.id, matches] as const;
  }));
}
