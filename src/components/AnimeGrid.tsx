import { useRef, useState } from 'react';
import {
  closestCenter, DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor,
  defaultDropAnimationSideEffects, useSensor, useSensors,
} from '@dnd-kit/core';
import type { Announcements, DragEndEvent } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useReducedMotion } from 'motion/react';
import type { LibraryEntry } from '../types';
import { AnimeCard } from './AnimeCard';
import { Poster } from './Poster';

interface Props {
  entries: LibraryEntry[];
  onOpen: (id: number) => void;
  onReorder: (activeId: number, overId: number) => void;
}

function SortableCard({ anime, index, onOpen, disabled }: {
  anime: LibraryEntry; index: number; onOpen: () => void; disabled: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, isSorting } = useSortable({
    id: anime.id,
    disabled,
    transition: reducedMotion ? null : { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' },
  });

  return <div ref={setNodeRef} className={`sortable-card ${isDragging ? 'is-dragging' : ''}`}
    style={{ transform: CSS.Transform.toString(transform), transition }}>
    <AnimeCard anime={anime} index={index} onOpen={onOpen} buttonRef={setActivatorNodeRef}
      sorting={isSorting} dragProps={disabled ? undefined : { ...attributes, ...listeners, 'aria-roledescription': 'сортируемый постер' }} />
  </div>;
}

export function AnimeGrid({ entries, onOpen, onReorder }: Props) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const suppressClickUntil = useRef(0);
  const reducedMotion = useReducedMotion();
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
    // Separate touch events let normal scrolling work until the hold activates.
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  );
  const activeAnime = entries.find(entry => entry.id === activeId);
  const title = (id: string | number) => entries.find(entry => entry.id === id)?.title ?? 'Аниме';
  const position = (id: string | number) => entries.findIndex(entry => entry.id === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Перемещение «${title(active.id)}». Позиция ${position(active.id)} из ${entries.length}.`,
    onDragOver: ({ active, over }) => over ? `«${title(active.id)}»: позиция ${position(over.id)} из ${entries.length}.` : undefined,
    onDragEnd: ({ active, over }) => over ? `«${title(active.id)}» перемещено на позицию ${position(over.id)}.` : 'Порядок не изменён.',
    onDragCancel: () => 'Перемещение отменено. Порядок не изменён.',
  };

  function finishDrag(event?: DragEndEvent) {
    suppressClickUntil.current = performance.now() + 350;
    setActiveId(null);
    if (event?.over && event.active.id !== event.over.id) onReorder(Number(event.active.id), Number(event.over.id));
  }

  return <DndContext sensors={sensors} collisionDetection={closestCenter}
    onDragStart={({ active }) => { suppressClickUntil.current = Infinity; setActiveId(Number(active.id)); }}
    onDragCancel={() => finishDrag()} onDragEnd={finishDrag}
    accessibility={{
      announcements,
      screenReaderInstructions: { draggable: 'Чтобы переместить постер, нажмите Пробел, затем используйте стрелки. Пробел или Enter сохраняет позицию, Escape отменяет перемещение. Enter вне перемещения открывает карточку.' },
    }}>
    <SortableContext items={entries.map(entry => entry.id)} strategy={rectSortingStrategy}>
      <div className={`anime-grid ${activeId !== null ? 'is-sorting' : ''}`}>
        {entries.map((entry, index) => <SortableCard key={entry.id} anime={entry} index={index} disabled={entries.length < 2}
          onOpen={() => { if (performance.now() >= suppressClickUntil.current) onOpen(entry.id); }} />)}
      </div>
    </SortableContext>
    <DragOverlay zIndex={20} dropAnimation={reducedMotion ? null : {
      duration: 240,
      easing: 'cubic-bezier(.2,.8,.2,1)',
      sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0' } } }),
    }}>
      {activeAnime && <div className="drag-poster" aria-hidden="true"><Poster src={activeAnime.poster} title={activeAnime.title} eager /></div>}
    </DragOverlay>
  </DndContext>;
}
