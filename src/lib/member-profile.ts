import type {Member} from './types';
import type {ProfileValues} from './registration';

// Preserve explicit empty values; older records may store core fields only in columns.
// Linked-member values remain IDs so opening the edit form cannot replace links with names.
export function memberProfileValues(member: Member): ProfileValues {
  const values: ProfileValues = {...member.profileData};
  for (const key of ['birthday', 'phone', 'email', 'address', 'avatar'] as const) {
    if (values[key] == null) values[key] = member[key] ?? '';
  }
  if (values.team == null) values.team = member.team ?? '';
  values.name = member.name || values.name || '';
  values.id = member.id;
  values.joined = member.joined;
  return values;
}
