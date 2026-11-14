import { Plus } from 'lucide-react';
import { motion } from 'motion/react';

export function AddAnimeButton({ onClick }: { onClick: () => void }) {
  return <motion.button
    className="add-button"
    layoutId="add-anime"
    transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    style={{ borderRadius: 999 }}
    onClick={onClick}
    aria-label="Добавить аниме"
    title="Добавить аниме"
  >
    <Plus size={28} strokeWidth={1.2} />
  </motion.button>;
}
