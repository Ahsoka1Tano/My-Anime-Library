import { ArrowUpRight, Library, Search } from 'lucide-react';

export function EmptyState({ filtered, onAdd, onReset }: { filtered: boolean; onAdd: () => void; onReset: () => void }) {
  return <div className={`empty-state ${filtered ? 'filtered-empty' : ''}`}><div className="empty-icon">{filtered ? <Search size={25} strokeWidth={1.3} /> : <Library size={28} strokeWidth={1.3} />}</div><div><h3>{filtered ? 'Здесь пока нет историй' : 'Каждая коллекция начинается с одной истории'}</h3><p>{filtered ? 'Попробуйте другой запрос или загляните в остальные разделы.' : 'Добавьте то, что любите. Сохраните то, что хотите увидеть.'}</p></div><button className="text-button" onClick={filtered ? onReset : onAdd}>{filtered ? 'Сбросить фильтры' : 'Найти первое аниме'}<ArrowUpRight size={16} /></button></div>;
}
