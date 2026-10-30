'use client';
import {useId, useState} from 'react';
import {KeyRound} from 'lucide-react';
import {api} from '../lib/api';
import {Button, Card, CardHeader, Feedback, Field} from './ui/primitives';
export default function ChangePassword({onChanged}: {onChanged: () => void}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    prefix = useId();
  return (
    <Card className="settings-card">
      <CardHeader title="Bảo mật tài khoản" description="Cập nhật mật khẩu truy cập của bạn." />
      <form
        className="settings-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          const values = new FormData(e.currentTarget);
          setError('');
          if (values.get('password') !== values.get('confirm')) {
            setError('Mật khẩu xác nhận chưa khớp.');
            return;
          }
          setBusy(true);
          try {
            await api('/admin/password', 'PATCH', {
              currentPassword: values.get('currentPassword'),
              password: values.get('password'),
            });
            onChanged();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={busy} className="form-stack">
          <legend className="sr-only">Đổi mật khẩu</legend>
          <Field label="Mật khẩu hiện tại" htmlFor={`${prefix}-current`}>
            <input
              id={`${prefix}-current`}
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              maxLength={128}
            />
          </Field>
          <Field label="Mật khẩu mới" htmlFor={`${prefix}-new`} hint="Sử dụng ít nhất 8 ký tự.">
            <input
              id={`${prefix}-new`}
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Nhập lại mật khẩu mới" htmlFor={`${prefix}-confirm`}>
            <input
              id={`${prefix}-confirm`}
              name="confirm"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
            />
          </Field>
        </fieldset>
        {error && <Feedback>{error}</Feedback>}
        <p className="form-note">Sau khi đổi mật khẩu, vui lòng đăng nhập lại.</p>
        <footer className="form-actions">
          <Button type="submit" busy={busy}>
            <KeyRound size={16} />
            {busy ? 'Đang lưu…' : 'Đổi mật khẩu'}
          </Button>
        </footer>
      </form>
    </Card>
  );
}
