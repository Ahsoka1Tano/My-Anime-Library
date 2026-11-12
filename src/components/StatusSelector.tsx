import { Check, Clock3, Play } from 'lucide-react';
import { STATUS_LABELS } from '../types';
import type { WatchStatus } from '../types';

export function StatusSelector({ value, onChange }: { value: WatchStatus; onChange: (status: WatchStatus) => void }) {
  const icons = { planned: Clock3, watching: Play, completed: Check };
  return <div className="status-selector" role="group" aria-label="Личный статус просмотра">{(['planned', 'watching', 'completed'] as const).map(status => {
    const Icon = icons[status];
    return <button key={status} aria-pressed={value === status} className={value === status ? 'selected' : ''} onClick={() => onChange(status)}><Icon size={14} />{STATUS_LABELS[status]}</button>;
  })}</div>;
}
