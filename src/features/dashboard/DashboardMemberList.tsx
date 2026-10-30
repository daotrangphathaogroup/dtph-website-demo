"use client";
import { useMemo } from "react";
import MemberDataTable from "../../components/MemberDataTable";
import { groupLabels } from "../../lib/types";
import type { Member, MemberGroup } from "../../lib/types";
import type { ProfileField, RegistrationSchema } from "../../lib/registration";
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
};
export default function DashboardMemberList({
  members,
  schemas,
  effectiveGroup,
  canEdit,
  onOpen,
}: Props) {
  const schema = useMemo<RegistrationSchema>(() => {
    if (effectiveGroup) return schemas[effectiveGroup];
    const unique = new Map<string, ProfileField>();
    for (const group of ["children", "youth", "congregation"] as const)
      for (const field of schemas[group].fields)
        if (!unique.has(field.key)) unique.set(field.key, field);
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
        ...Array.from(unique.values(), (field) =>
          field.key === "job"
            ? { ...field, label: "Nơi công tác / Trường học" }
            : field,
        ),
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
        key={effectiveGroup ?? "all"}
        members={rows}
        schema={schema}
        preferenceScope={effectiveGroup ?? "all"}
        label={effectiveGroup ? groupLabels[effectiveGroup] : "Toàn Đạo tràng"}
        canEdit={canEdit}
        onOpen={(member, edit) =>
          onOpen(members.find((m) => m.id === member.id) ?? member, edit)
        }
      />
    </section>
  );
}
