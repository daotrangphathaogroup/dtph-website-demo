'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import RegistrationComplete from './RegistrationComplete';
import PublicShell from './PublicShell';
import ProfileForm from './ProfileForm';
import {api} from '../lib/api';
import {groupLabels} from '../lib/types';
import type {MemberGroup} from '../lib/types';
import type {RegistrationSchema} from '../lib/registration';
export default function RegistrationForm({group}:{group:MemberGroup}){const [schema,setSchema]=useState<RegistrationSchema|null>(null),[error,setError]=useState(''),[success,setSuccess]=useState(false),[status,setStatus]=useState<'pending'|'approved'>('pending'),[generation,setGeneration]=useState(0);const requestId=useRef('');useEffect(()=>{let live=true;void api<{schema:RegistrationSchema}>(`/registration-schemas/${group}`).then(result=>{if(live){setSchema(result.schema);setError('');}}).catch(e=>{if(live)setError((e as Error).message);});return()=>{live=false;};},[group,generation]);return <PublicShell completion={success}>{!success&&<><Link className="text-button" href="/dang-ky-thong-tin">← Chọn nhóm sinh hoạt</Link><div className="page-heading"><div><h1>Đăng ký thông tin · {groupLabels[group]}</h1><p>Điền thông tin để Đạo Tràng ghi nhận hồ sơ sinh hoạt.</p></div></div></>}{success?<RegistrationComplete status={status}/>:<section className="panel public-placeholder">{error?<p className="error" role="alert">{error}<button className="text-button" onClick={()=>setGeneration(n=>n+1)}>Thử lại</button></p>:!schema?<p>Đang mở biểu mẫu…</p>:<ProfileForm key={generation} schema={schema} publicForm onSave={async values=>{requestId.current||=crypto.randomUUID();const result=await api<{status:'pending'|'approved'|'rejected'}>(`/registrations/${group}`,'POST',{values,requestId:requestId.current});if(result.status==='rejected')throw new Error('Thông tin đăng ký này đã được từ chối.');setStatus(result.status);setSuccess(true);}}/>}</section>}</PublicShell>;}
