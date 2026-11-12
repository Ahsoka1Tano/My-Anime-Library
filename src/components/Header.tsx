import { ArrowDownToLine, ArrowUpFromLine, BookOpen, Library, Plus } from 'lucide-react';

interface Props { onAdd: () => void; onExport: () => void; onImport: () => void; onAbout: () => void }
export function Header({ onAdd, onExport, onImport, onAbout }: Props) {
  return <header className="site-header">
    <a className="brand" href="#" aria-label="My Anime Library — главная"><span className="brand-icon"><Library size={23} strokeWidth={1.5} /></span><span>my anime<span className="brand-light"> library</span><span className="brand-dot">.</span></span></a>
    <nav aria-label="Основная навигация" className="header-nav"><a className="nav-current" href="#collection"><BookOpen size={16} />Моя коллекция</a><button onClick={onAbout}>О проекте</button></nav>
    <div className="header-actions"><button className="icon-button" onClick={onImport} title="Импорт JSON" aria-label="Импортировать коллекцию"><ArrowUpFromLine size={18} /></button><button className="icon-button" onClick={onExport} title="Экспорт JSON" aria-label="Экспортировать коллекцию"><ArrowDownToLine size={18} /></button><span className="action-divider" /><button className="button primary header-add" onClick={onAdd} aria-label="Добавить аниме"><Plus size={17} /><span>Добавить аниме</span></button></div>
  </header>;
}
