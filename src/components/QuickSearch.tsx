'use client';
import {useEffect,useState} from 'react';
import {Search,X} from 'lucide-react';
import {api} from '../lib/api';
import {groupLabels} from '../lib/types';
import type {MemberGroup} from '../lib/types';
type Result={name:string;group:MemberGroup};
export default function QuickSearch(){
 const [query,setQuery]=useState(''),[results,setResults]=useState<Result[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[searched,setSearched]=useState(false);
 useEffect(()=>{
  let active=true;const term=query.trim();
  setResults([]);setError('');setSearched(false);setBusy(term.length>=2);
  if(term.length<2)return;
  const timer=setTimeout(()=>{void api<{results:Result[]}>(`/search?q=${encodeURIComponent(term)}`).then(response=>{if(active){setResults(response.results);setSearched(true);}}).catch(e=>{if(active)setError((e as Error).message);}).finally(()=>{if(active)setBusy(false);});},350);
  return()=>{active=false;clearTimeout(timer);};
 },[query]);
 return <section className="quick-search-panel" aria-label="Tìm kiếm huynh đệ"><div className="quick-search-input"><Search size={20} aria-hidden="true"/><input aria-label="Họ tên huynh đệ" value={query} onChange={e=>setQuery(e.target.value)} maxLength={100} placeholder="Nhập họ tên huynh đệ…" autoComplete="off" type="search"/>{query&&<button className="icon-button" aria-label="Xóa tìm kiếm" onClick={()=>setQuery('')}><X size={18}/></button>}</div><div className="quick-search-status" role="status" aria-live="polite">{busy?'Đang tìm kiếm…':searched?`${results.length} kết quả phù hợp`:query.trim().length<2?'Nhập ít nhất 2 ký tự để tìm kiếm.':''}</div>{error&&<p className="error" role="alert">{error}</p>}{searched&&<div className="quick-results">{results.map((r,i)=><div className="staff-class-row" key={`${r.name}-${i}`}><b>{r.name}</b><span className="badge neutral">{groupLabels[r.group]}</span></div>)}{!results.length&&<p>Không tìm thấy huynh đệ phù hợp.</p>}</div>}</section>;
}
