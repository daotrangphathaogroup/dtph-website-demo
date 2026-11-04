import {LoaderCircle} from 'lucide-react';
import type {CSSProperties} from 'react';
import {deliveryMotion} from '../../lib/registration-delivery';
import type {ProfileValues} from '../../lib/registration';
import type {DeliveryPhase} from '../../lib/registration-delivery';

export function deliveryStyle(): CSSProperties {
  const {compact, morph, crease, insert, closing, sending} = deliveryMotion;
  return {
    '--paper-compact': `${compact}ms`, '--paper-morph': `${morph}ms`,
    '--paper-crease': `${crease}ms`, '--paper-insert': `${insert}ms`,
    '--paper-seal': `${closing}ms`, '--paper-send': `${sending}ms`,
  } as CSSProperties;
}

export function RegistrationCardFace({name, group}: {name: string; group: string}) {
  return <div className="registration-card-face" aria-hidden="true">
    <div className="registration-card-inside">
      <div className="registration-card-brand"><img src="/logo-ctn.png" width={32} height={32} alt="" /><span>ĐẠO TRÀNG<br /><b>PHẬT HÀO</b></span></div>
      <span className="registration-card-caption">PHIẾU ĐĂNG KÝ SINH HOẠT</span>
      <strong>{name}</strong>
      <span className="registration-card-group">{group}</span>
    </div>
  </div>;
}

export function RegistrationCardCover({name, group}: {name: string; group: string}) {
  return <div className="paper-leaf-cover" aria-hidden="true"><span className="card-cover-frame" />
    <div className="registration-card-brand"><img src="/logo-ctn.png" width={32} height={32} alt="" /><span>ĐẠO TRÀNG<br /><b>PHẬT HÀO</b></span></div>
    <span className="registration-card-caption">PHIẾU ĐĂNG KÝ</span>
    <strong>{name}</strong><span className="registration-card-group">{group}</span><span className="card-cover-rule" />
  </div>;
}

export function RegistrationPrintSummary({step, values, childrenGroup}: {step: number; values: ProfileValues; childrenGroup: boolean}) {
  const join = (...items: unknown[]) => items.filter(Boolean).join(' · ');
  const birthday = String(values.birthday ?? '').split('-').reverse().join('/');
  const lines = [join(values.gender, birthday), join(values.address, `Tổ ${values.team}`),
    join(values.phone, childrenGroup && values.parentName, values.relativePhone) || 'Không có số liên lạc',
    'Ảnh đại diện', ...(childrenGroup ? [String(values.nickname || 'Không có biệt danh')] : []),
    values.introducedBy ? 'Đã chọn người giới thiệu' : 'Không có người giới thiệu'];
  return <div className="registration-print-summary" aria-hidden="true">
    {step === 3 && values.avatar && <img src={String(values.avatar)} alt="" />}
    <span>{lines[step]}</span>
  </div>;
}

function DeliveryParticles({event, count}: {event: "gather" | "fold" | "seal" | "send" | "trail"; count: number}) {
  return <div className={`delivery-particles particles-${event}`} aria-hidden="true">
    {Array.from({length: count}, (_, index) => {
      const angle = (index / count) * Math.PI * 2;
      const distance = 46 + (index % 4) * 17;
      const trail = event === "trail";
      // Sample just behind the envelope's path, so the trail never leads the letter.
      const progress = Math.max(0, (180 + index * 28 - 80) / deliveryMotion.sending);
      const points = [[0, 0, 0], [0.14, -8, 10], [0.32, 0, -24], [0.56, 38, -90], [0.78, 102, -192], [1, 185, -340]];
      const segment = points.findIndex((point, i) => i > 0 && point[0] >= progress);
      const from = points[Math.max(0, segment - 1)], to = points[Math.max(1, segment)];
      const blend = (progress - from[0]) / (to[0] - from[0]);
      const trailX = from[1] + (to[1] - from[1]) * blend;
      const trailY = from[2] + (to[2] - from[2]) * blend;
      const style = {
        "--particle-start-x": `${trail ? trailX : Math.cos(angle) * 124}px`,
        "--particle-start-y": `${trail ? trailY : Math.sin(angle) * 62}px`,
        "--particle-x": `${trail ? trailX - 30 - (index % 3) * 10 : Math.cos(angle) * (124 + distance)}px`,
        "--particle-y": `${trail ? trailY + 35 + (index % 4) * 9 : Math.sin(angle) * (62 + distance * 0.65) - 25}px`,
        "--particle-delay": `${trail ? 180 + index * 28 : (index % 7) * 38}ms`,
        "--particle-turn": `${index % 2 ? 100 : -80}deg`,
        "--particle-size": `${2 + index % 4}px`,
      } as CSSProperties;
      return <i key={index} style={style} />;
    })}
  </div>;
}

function DeliveryEffects() {
  return <>
    <div className="delivery-effects effects-atmosphere" aria-hidden="true">
      <div className="delivery-glow glow-fold" />
      <div className="delivery-glow glow-launch" />
      <div className="delivery-launch-wave" />
      <svg className="delivery-speed-ribbons" viewBox="0 0 400 490" fill="none">
        <path d="M162 366C151 326 176 278 210 240S286 142 307 81" />
        <path d="M183 376C170 330 193 285 230 246S303 151 323 105" />
        <path d="M145 348C144 315 162 284 180 267" />
      </svg>
    </div>
    <div className="delivery-effects" aria-hidden="true">
      <div className="delivery-impact impact-fold"><i /><i /></div>
      <div className="delivery-impact impact-seal"><i /><i /></div>
    </div>
  </>;
}

export default function RegistrationDelivery({phase}: {phase: DeliveryPhase}) {
  return <div className="registration-delivery">
    <DeliveryEffects />
    <DeliveryParticles event="gather" count={24} />
    <DeliveryParticles event="fold" count={24} />
    <DeliveryParticles event="seal" count={14} />
    <DeliveryParticles event="send" count={40} />
    <DeliveryParticles event="trail" count={28} />
    <div className="delivery-envelope-shadow" aria-hidden="true" />
    <div className="delivery-envelope-scene" aria-hidden="true">
      <div className="delivery-envelope-back"><div className="envelope-lining" /></div>
      <div className="delivery-envelope-front">
        <svg viewBox="0 0 312 172" preserveAspectRatio="none" aria-hidden="true">
          <path className="envelope-fold-left" d="M0 0 161 96 0 172Z" />
          <path className="envelope-fold-right" d="M312 0 151 96 312 172Z" />
          <path className="envelope-fold-bottom" d="M0 172V158L146 76Q156 70 166 76L312 158V172Z" />
          <path className="envelope-seam" d="M1 157 146 76Q156 70 166 76L311 157" />
        </svg>
        <span className="envelope-wordmark">ĐẠO TRÀNG PHẬT HÀO</span>
      </div>
      <div className="delivery-envelope-flap"><svg viewBox="0 0 312 102" preserveAspectRatio="none"><path d="M0 0H312L169 94Q156 103 143 94Z" /></svg></div>
      <div className="delivery-envelope-seal"><img src="/logo-ctn.png" width={24} height={24} alt="" /></div>
    </div>
    <div className="delivery-caption">
      <p role="status" aria-live="polite">{phase === 'packing' ? 'Đang chuẩn bị phiếu đăng ký…' : phase === 'closing' ? 'Đang khép phong bì…' : phase === 'waiting' ? 'Đang gửi đến Đạo Tràng…' : 'Phiếu đã được tiếp nhận'}</p>
      {phase !== 'sending' && <LoaderCircle size={14} className="is-spinning" aria-hidden="true" />}
    </div>
  </div>;
}
