import { useState } from 'react';
import { ImageOff } from 'lucide-react';

export function Poster({ src, title, eager = false }: { src: string; title: string; eager?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return <div className={`poster-image ${loaded || failed || !src ? 'is-loaded' : 'skeleton'}`}>
    {src && !failed ? <img src={src} alt={`Постер «${title}»`} loading={eager ? 'eager' : 'lazy'} decoding="async" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
      : <div className="poster-fallback"><ImageOff size={28} /><span>История без обложки</span></div>}
  </div>;
}
