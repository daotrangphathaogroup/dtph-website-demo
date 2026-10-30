'use client';
import {useCallback, useEffect, useRef, useState} from 'react';
import {api} from '../lib/api';
import type {Bootstrap} from '../lib/api';
import {defaultRequirements} from '../lib/types';
export const emptyState: Bootstrap = {
  session: null,
  managedClassIds: [],
  classes: [],
  store: {members: [], enrollments: [], requirements: defaultRequirements},
};
export function usePortalData() {
  const [data, setData] = useState<Bootstrap>(emptyState),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [updatedAt, setUpdatedAt] = useState('');
  const version = useRef(0),
    inFlight = useRef<Promise<void> | null>(null),
    mounted = useRef(false);
  const invalidate = useCallback(() => {
    version.current++;
  }, []);
  const refresh = useCallback(() => {
    if (inFlight.current) return inFlight.current;
    const requestVersion = ++version.current;
    const request = api<Bootstrap>('/bootstrap')
      .then((state) => {
        if (!mounted.current || requestVersion !== version.current) return;
        setData(state);
        setUpdatedAt(new Date().toISOString());
        setError('');
      })
      .finally(() => {
        inFlight.current = null;
        if (mounted.current) setLoading(false);
      });
    inFlight.current = request;
    return request;
  }, []);
  useEffect(() => {
    mounted.current = true;
    void refresh().catch((e) => {
      if (mounted.current) setError((e as Error).message);
    });
    return () => {
      mounted.current = false;
    };
  }, [refresh]);
  useEffect(() => {
    if (!data.session) return;
    const update = () => {
      if (document.visibilityState === 'visible') void refresh().catch(() => {});
    };
    const timer = window.setInterval(update, 30000);
    window.addEventListener('focus', update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', update);
    };
  }, [data.session?.id, refresh]);
  return {data, setData, error, setError, loading, updatedAt, refresh, invalidate};
}
