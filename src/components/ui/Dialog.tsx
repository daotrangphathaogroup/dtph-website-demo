'use client';
import {useEffect, useId, useRef} from 'react';
import type {ReactNode} from 'react';
import {X} from 'lucide-react';
import {IconButton} from './primitives';
export default function Dialog({
  title,
  description,
  children,
  onClose,
  busy = false,
  className = '',
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    closing = useRef(false),
    exitAnimation = useRef<Animation | null>(null),
    titleId = useId(),
    descriptionId = useId();
  function requestClose() {
    const dialog = ref.current;
    if (busy || closing.current) return;
    if (!dialog || matchMedia('(prefers-reduced-motion: reduce)').matches) { onClose(); return; }
    closing.current = true;
    dialog.dataset.closing = 'true';
    const animation = dialog.animate([
      {opacity: 1, translate: '0 0', scale: '1'},
      {opacity: 0, translate: '0 8px', scale: '.985'},
    ], {duration: 160, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards'});
    exitAnimation.current = animation;
    animation.onfinish = onClose;
  }
  useEffect(() => {
    const dialog = ref.current,
      previous = document.activeElement as HTMLElement | null;
    if (!dialog) return;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      exitAnimation.current?.cancel();
      dialog.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
    >
      <header className="dialog-header">
        <div>
          <h2 id={titleId}>{title}</h2>
          {description && <p id={descriptionId}>{description}</p>}
        </div>
        <IconButton label="Đóng hộp thoại" disabled={busy} onClick={requestClose}>
          <X size={20} />
        </IconButton>
      </header>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
