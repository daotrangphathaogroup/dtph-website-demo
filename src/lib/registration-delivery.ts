export type DeliveryPhase = 'packing' | 'closing' | 'waiting' | 'sending';

export const deliveryMotion = {compact: 1900, morph: 760, crease: 1000, insert: 800, closing: 780, sending: 1720};
export function deliveryGatherTime(_sections: number) {
  const {compact, morph, crease, insert} = deliveryMotion;
  return compact + morph + crease + insert;
}

function pause(ms: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, ms);
    signal.addEventListener('abort', abort, {once: true});
  });
}

// Send immediately, but only show the departure after the server accepts the form.
export async function registrationDelivery<T>(
  send: () => Promise<T>,
  onPhase: (phase: DeliveryPhase) => void,
  signal: AbortSignal,
  reducedMotion: boolean,
  sections = 5,
): Promise<T> {
  const operation = new AbortController();
  const active = AbortSignal.any([signal, operation.signal]);
  try {
    active.throwIfAborted();
    onPhase('packing');
    const packed = pause(reducedMotion ? 0 : deliveryGatherTime(sections), active).then(async () => {
      active.throwIfAborted();
      onPhase('waiting');
    });
    const [result] = await Promise.all([Promise.resolve().then(send), packed]);
    active.throwIfAborted();
    onPhase('closing');
    if (!reducedMotion) await pause(deliveryMotion.closing, active);
    active.throwIfAborted();
    onPhase('sending');
    if (!reducedMotion) await pause(deliveryMotion.sending, active);
    active.throwIfAborted();
    return result;
  } finally {
    operation.abort();
  }
}
