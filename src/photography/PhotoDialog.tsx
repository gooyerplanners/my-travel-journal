import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import './photography.css';
export function PhotoDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const trigger = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => { dialog.close(); trigger?.focus(); };
  }, []);
  return <dialog ref={ref} className="pj-dialog" aria-labelledby="pj-dialog-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}><div className="pj-dialog-heading"><div><p className="td-eyebrow">A WINDOW INTO YOUR NEXT CHAPTER</p><h2 id="pj-dialog-title">{title}</h2></div><button className="pj-close" aria-label="Close photography dialog" onClick={onClose}>×</button></div>{children}</dialog>;
}
