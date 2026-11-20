"use client";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Pencil, Check } from "lucide-react";
import type { Member } from "../../lib/types";
import { groupLabels } from "../../lib/types";
import type { ProfileValues, RegistrationSchema } from "../../lib/registration";
import { displayValue, profileFieldLabel, profileVisibleFields } from "../../lib/registration";
import { memberProfileValues } from "../../lib/member-profile";
import { initials } from "../../lib/utils";
import Dialog from "../../components/ui/Dialog";
import ActivityStatus from "../../components/ActivityStatus";
import { Badge, Button, FeatureSkeleton } from "../../components/ui/primitives";
const ProfileForm = dynamic(() => import("../../components/ProfileForm"), {
  loading: () => <FeatureSkeleton />,
});
export default function MemberProfileDialog({
  member,
  schema,
  editing,
  canEdit,
  approving,
  onClose,
  onEdit,
  onApprove,
  onSave,
}: {
  member: Member;
  schema: RegistrationSchema;
  editing: boolean;
  canEdit: boolean;
  approving: boolean;
  onClose: () => void;
  onEdit: (edit: boolean) => void;
  onApprove: () => void;
  onSave: (values: ProfileValues) => Promise<void>;
}) {
  const values = useMemo(() => memberProfileValues(member), [member]);
  return (
    <Dialog
      title={editing ? "Chỉnh sửa hồ sơ" : "Hồ sơ huynh đệ"}
      description={groupLabels[member.group]}
      onClose={onClose}
      className="profile-dialog"
    >
      {editing && canEdit ? (
        <ProfileForm
          key={member.id}
          compact
          schema={schema}
          initial={values}
          memberId={member.id}
          onCancel={() => onEdit(false)}
          onSave={onSave}
        />
      ) : (
        <>
          <article className="identity-card" data-group={member.group}>
            <aside className="identity-portrait">
              {values.avatar ? <img src={String(values.avatar)} alt="Ảnh đại diện" width={108} height={144} /> : <span className="identity-initials">{initials(member.name)}</span>}
              <span>{groupLabels[member.group]}</span>
            </aside>
            <div className="identity-content">
              <header className="identity-heading">
                <div>
                  <h3>{member.name}</h3>
                  <span className="identity-id">ID · {member.id}</span>
                </div>
                {member.registrationStatus === "pending" && <Badge tone="gold">Chờ duyệt</Badge>}
              </header>
              <dl className="detail-grid">
                {profileVisibleFields(schema)
                  .filter(field => field.type !== "image" && !["id", "name"].includes(field.key))
                  .map(field => (
                    <div key={field.key} data-field={field.key}>
                      <dt>{profileFieldLabel(field)}</dt>
                      <dd>{field.key === "status"
                        ? <ActivityStatus value={values[field.key]} />
                        : field.type === "member" ? member.references?.[field.key]?.name ?? displayValue(values[field.key], field) : displayValue(values[field.key], field)}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          </article>
          <footer className="form-actions">
            {canEdit && member.registrationStatus === "pending" && (
              <Button busy={approving} onClick={onApprove}>
                <Check size={16} />
                Duyệt đăng ký
              </Button>
            )}
            {canEdit && (
              <Button
                variant={
                  member.registrationStatus === "pending"
                    ? "secondary"
                    : "primary"
                }
                onClick={() => onEdit(true)}
              >
                <Pencil size={16} />
                Chỉnh sửa thông tin
              </Button>
            )}
          </footer>
        </>
      )}
    </Dialog>
  );
}
