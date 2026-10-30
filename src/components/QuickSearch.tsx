'use client';
import {useEffect, useState} from 'react';
import {Search, UserRound} from 'lucide-react';
import {api} from '../lib/api';
import {groupLabels} from '../lib/types';
import type {MemberGroup} from '../lib/types';
import {Badge, EmptyState, Feedback, LoadingState, SearchField} from './ui/primitives';
type Result = {name: string; group: MemberGroup};
export default function QuickSearch() {
  const [query, setQuery] = useState(''),
    [results, setResults] = useState<Result[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [searched, setSearched] = useState(false);
  useEffect(() => {
    let active = true;
    const term = query.trim();
    setResults([]);
    setError('');
    setSearched(false);
    setBusy(term.length >= 2);
    if (term.length < 2) return;
    const timer = setTimeout(() => {
      void api<{results: Result[]}>(`/search?q=${encodeURIComponent(term)}`)
        .then((response) => {
          if (active) {
            setResults(response.results);
            setSearched(true);
          }
        })
        .catch((e) => {
          if (active) setError((e as Error).message);
        })
        .finally(() => {
          if (active) setBusy(false);
        });
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);
  return (
    <section className="quick-search-panel" aria-label="Tìm kiếm huynh đệ">
      <SearchField
        className="quick-search-input"
        label="Họ tên huynh đệ"
        placeholder="Nhập họ tên huynh đệ…"
        value={query}
        onChange={setQuery}
      />
      <div className="quick-search-status" role="status" aria-live="polite">
        {busy
          ? 'Đang tìm kiếm…'
          : searched
            ? `${results.length} kết quả phù hợp`
            : query.trim().length < 2
              ? 'Nhập ít nhất 2 ký tự để tìm kiếm.'
              : ''}
      </div>
      {error && <Feedback>{error}</Feedback>}
      {busy && <LoadingState label="Đang tìm kiếm huynh đệ…" />}
      {searched && (
        <div className="quick-results">
          {results.length ? (
            <ul>
              {results.map((result, i) => (
                <li key={`${result.name}-${i}`}>
                  <span className="search-result-avatar" aria-hidden="true">
                    <UserRound size={18} />
                  </span>
                  <b>{result.name}</b>
                  <Badge
                    tone={
                      result.group === 'children'
                        ? 'blue'
                        : result.group === 'youth'
                          ? 'green'
                          : 'gold'
                    }
                  >
                    {groupLabels[result.group]}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Không tìm thấy huynh đệ phù hợp"
              description="Thử một phần tên hoặc kiểm tra lại chính tả."
              icon={<Search size={24} />}
            />
          )}
        </div>
      )}
    </section>
  );
}
