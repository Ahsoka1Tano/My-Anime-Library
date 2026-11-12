import { ArrowDownWideNarrow, Search } from 'lucide-react';
import type { Filter, LibraryEntry, Sort } from '../types';
import { STATUS_LABELS } from '../types';

interface Props { entries: LibraryEntry[]; filter: Filter; onFilter: (filter: Filter) => void; sort: Sort; onSort: (sort: Sort) => void; query: string; onQuery: (query: string) => void }
export function LibraryFilters({ entries, filter, onFilter, sort, onSort, query, onQuery }: Props) {
  return <div className="library-toolbar">
    <div className="filter-tabs" role="group" aria-label="Статус просмотра">
      {(['all', 'watching', 'completed', 'planned'] as const).map(status => <button key={status} aria-pressed={filter === status} className={`filter-tab ${filter === status ? 'active' : ''}`} onClick={() => onFilter(status)}>{status === 'all' ? 'Все' : STATUS_LABELS[status]}<span>{status === 'all' ? entries.length : entries.filter(a => a.status === status).length}</span></button>)}
    </div>
    <div className="filter-tools"><label className="library-search"><Search size={16} /><input aria-label="Поиск в моей коллекции" placeholder="Найти в коллекции" value={query} onChange={e => onQuery(e.target.value)} /></label><label className="sort-control"><ArrowDownWideNarrow size={16} /><select aria-label="Сортировка коллекции" value={sort} onChange={e => onSort(e.target.value as Sort)}><option value="added">Сначала новые</option><option value="title">По названию</option><option value="rating">По моей оценке</option></select></label></div>
  </div>;
}
