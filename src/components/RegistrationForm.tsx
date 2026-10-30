'use client';
import {useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import RegistrationComplete from './RegistrationComplete';
import PublicShell from './PublicShell';
import ProfileForm from './ProfileForm';
import {Card, Feedback, FeatureSkeleton, PageHeader} from './ui/primitives';
import {api} from '../lib/api';
import {groupLabels} from '../lib/types';
import type {MemberGroup} from '../lib/types';
import type {RegistrationSchema} from '../lib/registration';
export default function RegistrationForm({group}: {group: MemberGroup}) {
  const [schema, setSchema] = useState<RegistrationSchema | null>(null),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(false),
    [status, setStatus] = useState<'pending' | 'approved'>('pending'),
    [generation, setGeneration] = useState(0);
  const requestId = useRef('');
  useEffect(() => {
    let live = true;
    void api<{schema: RegistrationSchema}>(`/registration-schemas/${group}`)
      .then((result) => {
        if (live) {
          setSchema(result.schema);
          setError('');
        }
      })
      .catch((e) => {
        if (live) setError((e as Error).message);
      });
    return () => {
      live = false;
    };
  }, [group, generation]);
  return (
    <PublicShell completion={success} formPage={!success}>
      {!success && (
        <>
          <Link className="text-button" href="/dang-ky-thong-tin">
            ← Chọn nhóm sinh hoạt
          </Link>
          <PageHeader
            title={`Đăng ký thông tin · ${groupLabels[group]}`}
            description="Điền thông tin để Đạo Tràng ghi nhận hồ sơ sinh hoạt."
          />
        </>
      )}
      {success ? (
        <RegistrationComplete status={status} />
      ) : (
        <Card className="public-placeholder">
          {error ? (
            <Feedback
              action={
                <button className="text-button" onClick={() => setGeneration((n) => n + 1)}>
                  Thử lại
                </button>
              }
            >
              {error}
            </Feedback>
          ) : !schema ? (
            <FeatureSkeleton />
          ) : (
            <ProfileForm
              key={generation}
              schema={schema}
              publicForm
              onSave={async (values) => {
                requestId.current ||= crypto.randomUUID();
                const result = await api<{status: 'pending' | 'approved' | 'rejected'}>(
                  `/registrations/${group}`,
                  'POST',
                  {values, requestId: requestId.current},
                );
                if (result.status === 'rejected')
                  throw new Error('Thông tin đăng ký này đã được từ chối.');
                setStatus(result.status);
                setSuccess(true);
              }}
            />
          )}
        </Card>
      )}
    </PublicShell>
  );
}
