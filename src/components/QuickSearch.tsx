'use client';
import {useDeferredValue, useMemo, useState} from 'react';
import {Eye, Search, UserRound} from 'lucide-react';
import {groupLabels} from '../lib/types';
import {filterSheet} from '../lib/sheet';
import type {ProfileField} from '../lib/registration';
import type {Member} from '../lib/types';
import {Badge, Button, EmptyState, LoadingState, SearchField} from './ui/primitives';
const searchFields: ProfileField[] = [
  {key:'name',label:'Họ tên',type:'text',required:false},
  {key:'dharmaName',label:'Pháp danh',type:'text',required:false},
  {key:'id',label:'Mã số',type:'text',required:false},
  {key:'phone',label:'SĐT',type:'phone',required:false},
];
export default function QuickSearch({members, onOpen}: {members: Member[]; onOpen: (member: Member) => void}) {
  const [query, setQuery] = useState('');
  const term = useDeferredValue(query).trim();
  const busy = query.trim().length >= 2 && query.trim() !== term;
  const searched = query.trim().length >= 2 && term.length >= 2 && !busy;
  const results = useMemo(() => term.length < 2 ? [] : filterSheet(members, term, {}, searchFields), [members, term]);
  return (
    <section className="quick-search-panel" aria-label="Tìm kiếm huynh đệ">
      <SearchField
        className="quick-search-input"
        label="Tìm tên, pháp danh, mã số hoặc SĐT"
        placeholder="Tên, pháp danh, mã số hoặc SĐT…"
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
      {busy && <LoadingState label="Đang tìm kiếm huynh đệ…" />}
      {searched && (
        <div className="quick-results">
          {results.length ? (
            <ul>
              {results.map((result) => (
                <li key={result.id}>
                  <span className="search-result-avatar" aria-hidden="true">
                    <UserRound size={18} />
                  </span>
                  <div className="quick-result-identity">
                    <b>{result.name}</b>
                    {result.id && <small>{[result.id, result.profileData?.dharmaName].filter(Boolean).join(' · ')}</small>}
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
                  <Button variant="secondary" className="quick-profile-button" aria-label={`Xem hồ sơ ${result.name}`} onClick={() => onOpen(result)}><Eye size={16} aria-hidden="true" /><span>Xem hồ sơ</span></Button>
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
