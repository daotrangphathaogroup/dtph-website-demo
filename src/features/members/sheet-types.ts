import type {useMemberSheet} from '../../hooks/useMemberSheet';
import type {MemberGroup} from '../../lib/types';
export type ReturnTypeOfSheet = ReturnType<typeof useMemberSheet>;
export type SheetScopeFilter = {
  group: MemberGroup | 'all';
  team: string;
  onGroupChange?: (group: MemberGroup | 'all') => void;
  onTeamChange: (team: string) => void;
};
