'use client';
import {useEffect, useId, useState} from 'react';
import {KeyRound, Plus, Shield, Trash2, UserRound} from 'lucide-react';
import {api} from '../lib/api';
import Dialog from './ui/Dialog';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Feedback,
  Field,
  IconButton,
  LoadingState,
} from './ui/primitives';
type Account = {id: string; username: string; role: 'admin' | 'manager'};
export default function StaffAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [reset, setReset] = useState<Account | null>(null),
    [remove, setRemove] = useState<Account | null>(null),
    prefix = useId();
  async function list() {
    setAccounts((await api<{accounts: Account[]}>('/admin/accounts')).accounts);
  }
  useEffect(() => {
    let active = true;
    void api<{accounts: Account[]}>('/admin/accounts')
      .then((r) => {
        if (active) setAccounts(r.accounts);
      })
      .catch((e) => {
        if (active) setError((e as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function perform(action: () => Promise<void>) {
    if (busy) return false;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      await list();
      setNotice('Đã lưu thay đổi.');
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="accounts-layout">
      {error && !reset && !remove && <Feedback>{error}</Feedback>}
      {notice && (
        <Feedback tone="success" onDismiss={() => setNotice('')}>
          {notice}
        </Feedback>
      )}
      <Card className="account-create-panel">
        <CardHeader
          title="Tạo tài khoản nhân sự"
          description="Cấp quyền Admin hoặc Manager cho nhân sự quản lý."
        />
        <form
          className="account-create-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget,
              values = new FormData(form);
            const ok = await perform(async () => {
              await api('/admin/accounts', 'POST', {
                username: values.get('username'),
                password: values.get('password'),
                role: values.get('role'),
              });
            });
            if (ok) form.reset();
          }}
        >
          <fieldset disabled={busy} className="account-form-grid">
            <legend className="sr-only">Tạo tài khoản Admin hoặc Manager</legend>
            <Field
              label="Tên đăng nhập"
              htmlFor={`${prefix}-username`}
              hint="Chỉ chữ cái và chữ số, không có khoảng trắng."
            >
              <input
                id={`${prefix}-username`}
                name="username"
                required
                pattern="[a-zA-Z0-9]{1,40}"
                maxLength={40}
                autoComplete="off"
                placeholder="Ví dụ: nhansu01"
              />
            </Field>
            <Field
              label="Mật khẩu ban đầu"
              htmlFor={`${prefix}-password`}
              hint="Tối thiểu 8 ký tự."
            >
              <input
                id={`${prefix}-password`}
                name="password"
                required
                type="password"
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                placeholder="Nhập mật khẩu"
              />
            </Field>
            <Field label="Quyền truy cập" htmlFor={`${prefix}-role`}>
              <select id={`${prefix}-role`} name="role">
                <option value="manager">Manager · Xem danh sách</option>
                <option value="admin">Admin · Quản lý hồ sơ</option>
              </select>
            </Field>
          </fieldset>
          <footer className="form-actions">
            <Button type="submit" busy={busy}>
              <Plus size={16} />
              {busy ? 'Đang lưu…' : 'Tạo tài khoản'}
            </Button>
          </footer>
        </form>
      </Card>
      <Card className="account-directory-panel">
        <CardHeader
          title={
            <>
              Tài khoản quản lý <Badge>{accounts.length}</Badge>
            </>
          }
          description="Quản lý quyền truy cập và mật khẩu của nhân sự."
        />
        {loading ? (
          <LoadingState label="Đang tải danh sách tài khoản…" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="accounts-table">
                <caption className="sr-only">Danh sách tài khoản quản lý</caption>
                <thead>
                  <tr>
                    <th scope="col">Tên đăng nhập</th>
                    <th scope="col">Quyền truy cập</th>
                    <th scope="col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="account-person">
                          <span className="account-list-avatar" aria-hidden="true">
                            <UserRound size={18} />
                          </span>
                          <b>{a.username}</b>
                        </div>
                      </td>
                      <td>
                        <Badge tone={a.role === 'admin' ? 'blue' : 'neutral'}>
                          {a.role === 'admin' ? 'Admin' : 'Manager'}
                        </Badge>
                      </td>
                      <td>
                        <div className="row-actions">
                          <Button
                            variant="ghost"
                            disabled={busy}
                            onClick={() => {
                              setReset(a);
                              setRemove(null);
                              setError('');
                            }}
                          >
                            <KeyRound size={15} />
                            Đặt mật khẩu
                          </Button>
                          <IconButton
                            label={`Xóa tài khoản ${a.username}`}
                            className="review-reject"
                            disabled={busy}
                            onClick={() => {
                              setRemove(a);
                              setReset(null);
                              setError('');
                            }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!accounts.length && (
              <EmptyState
                title="Chưa có tài khoản quản lý"
                description="Tạo tài khoản Admin hoặc Manager bằng biểu mẫu phía trên."
                icon={<Shield size={24} />}
              />
            )}
          </>
        )}
      </Card>
      {reset && (
        <Dialog
          title={`Đặt mật khẩu cho ${reset.username}`}
          description="Phiên đăng nhập của tài khoản này sẽ kết thúc. Mật khẩu hiện tại không thể xem lại."
          onClose={() => setReset(null)}
          busy={busy}
          className="dialog-small"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const values = new FormData(e.currentTarget);
              if (
                await perform(async () => {
                  await api(`/admin/accounts/${reset.id}/password`, 'PATCH', {
                    password: values.get('password'),
                  });
                })
              )
                setReset(null);
            }}
          >
            <Field label="Mật khẩu mới" htmlFor={`${prefix}-reset`} hint="Tối thiểu 8 ký tự.">
              <input
                id={`${prefix}-reset`}
                name="password"
                required
                type="password"
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                disabled={busy}
              />
            </Field>
            {error && <Feedback>{error}</Feedback>}
            <footer className="form-actions">
              <Button variant="secondary" disabled={busy} onClick={() => setReset(null)}>
                Hủy
              </Button>
              <Button type="submit" busy={busy}>
                Lưu mật khẩu mới
              </Button>
            </footer>
          </form>
        </Dialog>
      )}
      {remove && (
        <Dialog
          title={`Xóa tài khoản ${remove.username}?`}
          description="Tài khoản sẽ không thể đăng nhập. Hồ sơ huynh đệ được giữ lại."
          onClose={() => setRemove(null)}
          busy={busy}
          className="dialog-small"
        >
          {error && <Feedback>{error}</Feedback>}
          <footer className="form-actions">
            <Button variant="secondary" disabled={busy} onClick={() => setRemove(null)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              busy={busy}
              onClick={async () => {
                if (
                  await perform(async () => {
                    await api(`/admin/accounts/${remove.id}`, 'DELETE');
                  })
                )
                  setRemove(null);
              }}
            >
              Xóa tài khoản
            </Button>
          </footer>
        </Dialog>
      )}
    </div>
  );
}
