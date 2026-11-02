'use client';
import {useEffect, useState} from 'react';
import {Eye, Search, UserRound} from 'lucide-react';
import {api} from '../lib/api';
import {groupLabels} from '../lib/types';
import {filterSheet} from '../lib/sheet';
import type {ProfileField} from '../lib/registration';
import type {Member, MemberGroup} from '../lib/types';
import {Badge, Button, EmptyState, Feedback, LoadingState, SearchField} from './ui/primitives';
type Result = {name: string; group: MemberGroup; id?: string; dharmaName?: string};
const searchFields: ProfileField[] = [
  {key:'name',label:'Họ tên',type:'text',required:false},
  {key:'dharmaName',label:'Pháp danh',type:'text',required:false},
  {key:'id',label:'Mã số',type:'text',required:false},
  {key:'phone',label:'SĐT',type:'phone',required:false},
];
export default function QuickSearch({members, onOpen}: {members?: Member[]; onOpen?: (member: Member) => void}) {
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
      if (members) {
        setResults(filterSheet(members, term, {}, searchFields).map(member => ({
          id:member.id,name:member.name,group:member.group,
          dharmaName:String(member.profileData?.dharmaName ?? ''),
        })));
        setSearched(true);
        setBusy(false);
        return;
      }
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
  }, [query, members]);
  return (
    <section className="quick-search-panel" aria-label="Tìm kiếm huynh đệ">
      <SearchField
        className="quick-search-input"
        label={members ? "Tìm tên, pháp danh, mã số hoặc SĐT" : "Họ tên huynh đệ"}
        placeholder={members ? "Tên, pháp danh, mã số hoặc SĐT…" : "Nhập họ tên huynh đệ…"}
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
                <li key={result.id ?? `${result.name}-${i}`}>
                  <span className="search-result-avatar" aria-hidden="true">
                    <UserRound size={18} />
                  </span>
                  <div className="quick-result-identity">
                    <b>{result.name}</b>
                    {result.id && <small>{[result.id, result.dharmaName].filter(Boolean).join(' · ')}</small>}
                  </div>
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
                  {result.id && onOpen && <Button variant="secondary" className="quick-profile-button" aria-label={`Xem hồ sơ ${result.name}`} onClick={() => {
                    const member = members?.find(member => member.id === result.id);
                    if (member) onOpen(member);
                  }}><Eye size={16} aria-hidden="true" /><span>Xem hồ sơ</span></Button>}
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
