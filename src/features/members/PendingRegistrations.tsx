import { Check, Eye, RefreshCw, X } from "lucide-react";
import type { Member } from "../../lib/types";
import { groupLabels } from "../../lib/types";
import {
  Button,
  Card,
  CardHeader,
  IconButton,
} from "../../components/ui/primitives";
type Props = {
  members: Member[];
  canApprove: boolean;
  saving: Set<string>;
  rejecting: Member | null;
  onView: (member: Member) => void;
  onApprove: (member: Member) => void;
  onRejectRequest: (member: Member | null) => void;
  onReject: (member: Member) => void;
  onRefresh: () => void;
};
export default function PendingRegistrations({
  members,
  canApprove,
  saving,
  rejecting,
  onView,
  onApprove,
  onRejectRequest,
  onReject,
  onRefresh,
}: Props) {
  if (!members.length) return null;
  return (
    <Card className="pending-panel">
      <CardHeader
        title={
          <>
            <span className="pending-dot" />
            {members.length} đăng ký mới chờ duyệt
          </>
        }
        description={
          canApprove
            ? "Xem hồ sơ trước khi duyệt vào danh sách huynh đệ."
            : "Chỉ Admin/Dev có quyền duyệt đăng ký."
        }
        actions={
          <IconButton
            label="Cập nhật danh sách đăng ký"
            className="pending-refresh"
            onClick={onRefresh}
          >
            <RefreshCw size={18} />
          </IconButton>
        }
      />
      <div className="table-wrap">
        <table className="pending-table">
          <caption className="sr-only">Đăng ký mới chờ duyệt</caption>
          <thead>
            <tr>
              <th scope="col">Họ tên</th>
              <th scope="col">Nhóm</th>
              <th scope="col">Thời điểm đăng ký</th>
              <th scope="col">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>
                  <button className="table-person" onClick={() => onView(m)}>
                    {m.avatar && (
                      <img
                        src={m.avatar}
                        width={28}
                        height={36}
                        loading="lazy"
                        alt=""
                      />
                    )}
                    <span>{m.name}</span>
                  </button>
                </td>
                <td>{groupLabels[m.group]}</td>
                <td>
                  {m.submittedAt
                    ? new Date(m.submittedAt).toLocaleString("vi-VN", {
                        timeZone: "Asia/Ho_Chi_Minh",
                      })
                    : "Chưa cập nhật"}
                </td>
                <td>
                  <div className="row-actions">
                    <IconButton
                      label={`Xem hồ sơ ${m.name}`}
                      onClick={() => onView(m)}
                    >
                      <Eye size={17} />
                    </IconButton>
                    {canApprove && (
                      <>
                        <IconButton
                          label={`Duyệt đăng ký ${m.name}`}
                          className="review-approve"
                          disabled={saving.has("review:" + m.id)}
                          onClick={() => onApprove(m)}
                        >
                          <Check size={17} />
                        </IconButton>
                        <IconButton
                          label={`Từ chối đăng ký ${m.name}`}
                          className="review-reject"
                          disabled={saving.has("review:" + m.id)}
                          onClick={() => onRejectRequest(m)}
                        >
                          <X size={17} />
                        </IconButton>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rejecting && members.some((m) => m.id === rejecting.id) && (
        <div
          className="rejection-confirm"
          role="group"
          aria-label="Xác nhận từ chối đăng ký"
        >
          <p>
            Từ chối đăng ký của <strong>{rejecting.name}</strong>? Hồ sơ được
            giữ lại trong hệ thống.
          </p>
          <div>
            <Button
              variant="secondary"
              disabled={saving.has("review:" + rejecting.id)}
              onClick={() => onRejectRequest(null)}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              busy={saving.has("review:" + rejecting.id)}
              onClick={() => onReject(rejecting)}
            >
              Từ chối đăng ký
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
