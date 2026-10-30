'use client';
import {useEffect, useId, useState} from 'react';
import {useRouter} from 'next/navigation';
import {ArrowRight, ShieldCheck} from 'lucide-react';
import PublicShell from './PublicShell';
import {Button, Feedback, Field} from './ui/primitives';
import {api} from '../lib/api';
import type {Bootstrap} from '../lib/api';
export default function AdminLogin() {
  const router = useRouter(),
    prefix = useId();
  const [username, setUsername] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void api<Bootstrap>('/bootstrap')
      .then((d) => {
        if (active && d.session) router.replace('/');
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [router]);
  return (
    <PublicShell>
      <section className="auth-card">
        <span className="auth-icon" aria-hidden="true">
          <ShieldCheck size={25} strokeWidth={1.5} />
        </span>
        <header>
          <div className="eyebrow">KHÔNG GIAN QUẢN TRỊ</div>
          <h1>Đăng nhập quản trị</h1>
          <p>Dành cho nhân sự quản lý của Đạo Tràng.</p>
        </header>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setError('');
            try {
              await api('/admin/login', 'POST', {username, password});
              router.replace('/');
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <fieldset disabled={busy} className="form-stack">
            <legend className="sr-only">Thông tin đăng nhập quản trị</legend>
            <Field htmlFor={`${prefix}-username`} label="Tên đăng nhập">
              <input
                id={`${prefix}-username`}
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={40}
                placeholder="Nhập tên đăng nhập"
              />
            </Field>
            <Field htmlFor={`${prefix}-password`} label="Mật khẩu">
              <input
                id={`${prefix}-password`}
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                maxLength={128}
                placeholder="Nhập mật khẩu quản trị"
              />
            </Field>
          </fieldset>
          {error && <Feedback>{error}</Feedback>}
          <Button type="submit" busy={busy} className="full">
            {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
            {!busy && <ArrowRight size={17} />}
          </Button>
        </form>
        <p className="auth-footer">Tài khoản do Dev tạo và cấp cho nhân sự.</p>
      </section>
    </PublicShell>
  );
}
