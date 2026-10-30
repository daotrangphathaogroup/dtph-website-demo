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
    titleId = useId(),
    descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current,
      previous = document.activeElement as HTMLElement | null;
    if (!dialog) return;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
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
        if (!busy) onClose();
      }}
    >
      <header className="dialog-header">
        <div>
          <h2 id={titleId}>{title}</h2>
          {description && <p id={descriptionId}>{description}</p>}
        </div>
        <IconButton label="Đóng hộp thoại" disabled={busy} onClick={onClose}>
          <X size={20} />
        </IconButton>
      </header>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
