import { useState } from 'react';
import { Star } from 'lucide-react';

export function RatingSelector({ value, onChange }: { value: number | null; onChange: (rating: number | null) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  return <div className="rating-selector"><div className="rating-stars" role="group" aria-label="Моя оценка от 1 до 10" onMouseLeave={() => setHovered(null)}>{Array.from({ length: 10 }, (_, i) => i + 1).map(rating => <button key={rating} aria-label={`Оценка ${rating} из 10`} aria-pressed={value === rating} className={rating <= (hovered ?? value ?? 0) ? 'filled' : ''} onMouseEnter={() => setHovered(rating)} onFocus={() => setHovered(rating)} onBlur={() => setHovered(null)} onClick={() => onChange(rating)}><Star size={20} strokeWidth={1.4} fill={rating <= (hovered ?? value ?? 0) ? 'currentColor' : 'none'} /></button>)}</div><div className="rating-value">{value ? <><strong>{value}</strong><span> / 10</span><button className="text-button" onClick={() => onChange(null)}>Очистить</button></> : <span>Пока без оценки</span>}</div></div>;
}
