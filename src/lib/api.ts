import type {Role,Store} from './types';
export type Session={id:string;username:string;displayName:string;role:Role};
export type ClassInfo={id:string;name:string;group_id:string};
export type Bootstrap={demoData?:boolean;pendingRegistrations?:import('./types').Member[];schemas?:Record<import('./types').MemberGroup,import('./registration').RegistrationSchema>;managedClassIds:string[];classes:ClassInfo[];session:Session|null;store:Store};
export async function api<T={ok:boolean}>(path:string,method='GET',body?:unknown,signal?:AbortSignal):Promise<T>{const response=await fetch('/api'+path,{method,signal,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});const data=await response.json().catch(()=>({error:'Dịch vụ chưa sẵn sàng.'}));if(!response.ok){if(response.status===401&&typeof window!=='undefined')window.dispatchEvent(new Event('ph:session-expired'));throw new Error(data.error??'Không thể xử lý yêu cầu.');}return data as T;}

type RegistrationResult = {status: 'pending' | 'approved' | 'rejected'};
type RegistrationRequest = {requestId: string; values: Record<string, unknown>};

// Reuse the request ID: the server can acknowledge a saved form whose response
// was lost, rather than creating a second registration.
export async function submitRegistration(body: RegistrationRequest, signal: AbortSignal): Promise<RegistrationResult> {
  for (let attempt = 0; ; attempt++) {
    signal.throwIfAborted();
    try {
      return await api<RegistrationResult>('/registrations/auto', 'POST', body, signal);
    } catch (error) {
      if (signal.aborted) throw error;
      // Fetch rejects with TypeError on a network failure, including Safari's
      // "Load failed". HTTP validation/authentication errors must not retry.
      if (!(error instanceof TypeError)) throw error;
      if (attempt === 1) throw new Error('Kết nối bị gián đoạn khi gửi phiếu. Thông tin vẫn được giữ nguyên; vui lòng nhấn gửi lại.');
      await new Promise<void>((resolve, reject) => {
        const abort = () => { clearTimeout(timer); reject(signal.reason); };
        const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 1500);
        signal.addEventListener('abort', abort, {once: true});
      });
    }
  }
}
