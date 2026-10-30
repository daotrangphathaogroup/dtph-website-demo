'use client';
import {useEffect, useMemo, useRef, useState} from 'react';
import type {Member} from '../lib/types';
import type {RegistrationSchema} from '../lib/registration';
import {filterSheet, sortSheet, sheetValue, sheetCsv} from '../lib/sheet';
export type SheetPreferences = {hidden: string[]; widths: Record<string, number>; density: string};
export function useMemberSheet(members: Member[], schema: RegistrationSchema) {
  const fields = useMemo(
    () => [
      ...schema.fields.filter((f) => f.key === 'name'),
      ...schema.fields.filter((f) => f.type !== 'image' && f.key !== 'name'),
    ],
    [schema],
  );
  const [showFilters, setShowFilters] = useState(false),
    [query, setQuery] = useState(''),
    [filters, setFilters] = useState<Record<string, string>>({}),
    [sort, setSort] = useState<{key: string; direction: 'asc' | 'desc'}>({
      key: 'name',
      direction: 'asc',
    }),
    [prefs, setPrefs] = useState<SheetPreferences>({hidden: [], widths: {}, density: 'standard'}),
    [ready, setReady] = useState(false),
    [page, setPage] = useState(1),
    [size, setSize] = useState(25),
    [selected, setSelected] = useState<Set<string>>(new Set());
  const allCheckbox = useRef<HTMLInputElement>(null),
    resizeCleanup = useRef<() => void>(() => {}),
    latestPrefs = useRef(prefs);
  latestPrefs.current = prefs;
  const preferenceKey = `ph-sheet-v${schema.version}-${schema.group}`;
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(preferenceKey) ?? 'null');
      if (saved)
        setPrefs({
          hidden: Array.isArray(saved.hidden)
            ? saved.hidden.filter((v: unknown) => typeof v === 'string' && v !== 'name')
            : [],
          widths: Object.fromEntries(
            Object.entries(saved.widths ?? {}).filter(
              ([key, value]) =>
                fields.some((f) => f.key === key) &&
                typeof value === 'number' &&
                value >= 120 &&
                value <= 600,
            ),
          ) as Record<string, number>,
          density: ['compact', 'standard', 'comfortable'].includes(saved.density)
            ? saved.density
            : 'standard',
        });
    } catch {}
    setReady(true);
    return () => {
      resizeCleanup.current();
      try {
        localStorage.setItem(preferenceKey, JSON.stringify(latestPrefs.current));
      } catch {}
    };
  }, [preferenceKey]);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(preferenceKey, JSON.stringify(prefs));
      } catch {}
    }, 200);
    return () => clearTimeout(timer);
  }, [prefs, ready, preferenceKey]);
  useEffect(() => {
    const ids = new Set(members.map((m) => m.id));
    setSelected((old) => new Set([...old].filter((id) => ids.has(id))));
  }, [members]);
  const visible = useMemo(
    () => fields.filter((f) => !prefs.hidden.includes(f.key)),
    [fields, prefs.hidden],
  );
  const filtered = useMemo(
    () =>
      sortSheet(
        filterSheet(members, query, filters, fields),
        fields.find((f) => f.key === sort.key),
        sort.direction,
      ),
    [members, query, filters, fields, sort],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / size)),
    active = Math.min(page, pages),
    rows = filtered.slice((active - 1) * size, active * size),
    checked = rows.filter((m) => selected.has(m.id)).length;
  useEffect(() => {
    if (allCheckbox.current)
      allCheckbox.current.indeterminate = checked > 0 && checked < rows.length;
  }, [checked, rows.length]);
  const filterFields = useMemo(
    () => fields.filter((f) => ['select', 'team', 'ward', 'province', 'year'].includes(f.type)),
    [fields],
  );
  const filterOptions = useMemo(
    () =>
      Object.fromEntries(
        filterFields.map((f) => [
          f.key,
          [
            ...new Set(
              members.map((m) => sheetValue(m, f.key)).filter((v) => v !== undefined && v !== ''),
            ),
          ].sort((a, b) => String(a).localeCompare(String(b), 'vi', {numeric: true})),
        ]),
      ),
    [members, filterFields],
  );
  const width = (key: string) =>
    prefs.widths[key] ??
    (key === 'name' ? 240 : key === 'address' || key === 'remarks' ? 300 : 180);
  function resize(key: string, startX: number) {
    resizeCleanup.current();
    const initial = width(key);
    let frame = 0,
      lastWidth = initial;
    const flush = () => {
      frame = 0;
      setPrefs((old) => ({...old, widths: {...old.widths, [key]: lastWidth}}));
    };
    const move = (e: PointerEvent) => {
      lastWidth = Math.max(120, Math.min(600, initial + e.clientX - startX));
      if (!frame) frame = requestAnimationFrame(flush);
    };
    const stop = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        flush();
      }
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
    resizeCleanup.current = stop;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
  }
  function exportRows() {
    const exported = selected.size ? members.filter((m) => selected.has(m.id)) : filtered;
    const url = URL.createObjectURL(
      new Blob([sheetCsv(exported, visible)], {type: 'text/csv;charset=utf-8'}),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema.group}-huynh-de.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function toggle(id: string) {
    setSelected((old) => {
      const next = new Set(old);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function togglePage() {
    setSelected((old) => {
      const next = new Set(old);
      rows.forEach((m) => (checked === rows.length ? next.delete(m.id) : next.add(m.id)));
      return next;
    });
  }
  return {
    fields,
    visible,
    prefs,
    setPrefs,
    query,
    setQuery,
    filters,
    setFilters,
    sort,
    setSort,
    showFilters,
    setShowFilters,
    page: active,
    pages,
    setPage,
    size,
    setSize,
    rows,
    filtered,
    selected,
    setSelected,
    checked,
    allCheckbox,
    filterFields,
    filterOptions,
    width,
    resize,
    exportRows,
    toggle,
    togglePage,
  };
}
