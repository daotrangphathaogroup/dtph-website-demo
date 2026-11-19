"use client";
import { useMemo } from "react";
import MemberDataTable from "../../components/MemberDataTable";
import { groupLabels } from "../../lib/types";
import type { Member, MemberGroup } from "../../lib/types";
import type { ProfileField, RegistrationSchema } from "../../lib/registration";
import type {SheetScopeFilter} from '../members/sheet-types';
type Props = {
  members: Member[];
  hasMembers: boolean;
  schemas: Record<MemberGroup, RegistrationSchema>;
  scope?: MemberGroup;
  effectiveGroup?: MemberGroup;
  canEdit: boolean;
  asOf: string;
  lastUpdated: string;
  onOpen: (m: Member, edit: boolean) => void;
  queryReset: number;
  pageReset: number;
  sheetScope?: SheetScopeFilter;
};
export default function DashboardMemberList({
  members,
  schemas,
  effectiveGroup,
  canEdit,
  onOpen,
  sheetScope,
}: Props) {
  const schema = useMemo<RegistrationSchema>(() => {
    if (effectiveGroup) return schemas[effectiveGroup];
    const unique = new Map<string, ProfileField>();
    for (const group of ["children", "youth", "congregation"] as const)
      for (const field of schemas[group].fields)
        if (!unique.has(field.key) || (unique.get(field.key)?.hiddenInTable && !field.hiddenInTable)) unique.set(field.key, field);
    const name = unique.get("name")!;
    unique.delete("name");
    return {
      group: "children",
      version: Math.max(...Object.values(schemas).map((s) => s.version)),
      fields: [
        name,
        {
          key: "groupLabel",
          label: "Nhóm sinh hoạt",
          type: "select",
          required: false,
          options: Object.values(groupLabels),
        },
        ...unique.values(),
      ],
    };
  }, [schemas, effectiveGroup]);
  const rows = useMemo(
    () =>
      effectiveGroup
        ? members
        : members.map((m) => ({
            ...m,
            profileData: { ...m.profileData, groupLabel: groupLabels[m.group] },
          })),
    [members, effectiveGroup],
  );
  return (
    <section className="dashboard-card dashboard-list">
      <MemberDataTable
        members={rows}
        schema={schema}
        preferenceScope={effectiveGroup ?? "all"}
        label={effectiveGroup ? groupLabels[effectiveGroup] : "Toàn Đạo tràng"}
        sheetScope={sheetScope}
        canEdit={canEdit}
        onOpen={(member, edit) =>
          onOpen(members.find((m) => m.id === member.id) ?? member, edit)
        }
      />
    </section>
  );
}
