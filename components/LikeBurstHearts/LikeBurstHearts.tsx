'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import styles from './LikeBurstHearts.module.css';

const PARTICLE_COUNT = 3;
/** Пауза между сердечками в цепочке (с). */
const STAGGER_S = 0.12;
/** Горизонтальный разброс по очереди: центр → влево → вправо. */
const PARTICLE_DX = [0, -10, 10] as const;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useLikeBurst() {
  const [burstId, setBurstId] = useState(0);

  const triggerBurst = useCallback(() => {
    if (prefersReducedMotion()) return;
    setBurstId((x) => x + 1);
  }, []);

  return { burstId, triggerBurst };
}

type Particle = {
  id: number;
  dx: number;
  delay: number;
};

export function LikeBurstOverlay({ burstId }: { burstId: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!burstId) return;
    const batch: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: burstId * 10 + i,
      dx: PARTICLE_DX[i] ?? 0,
      delay: i * STAGGER_S,
    }));
    setParticles(batch);
    const totalMs = (PARTICLE_COUNT - 1) * STAGGER_S * 1000 + 850;
    const t = window.setTimeout(() => setParticles([]), totalMs);
    return () => window.clearTimeout(t);
  }, [burstId]);

  if (!particles.length) return null;

  return (
    <span className={styles.burstHost} aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className={styles.particle}
          style={
            {
              '--dx': `${p.dx}px`,
              animationDelay: `${p.delay}s`,
            } as React.CSSProperties
          }
        >
          ♥
        </span>
      ))}
    </span>
  );
}

type WrapProps = {
  children: ReactNode;
  className?: string;
  burstId: number;
};

/** Обёртка с overflow:visible и слоем частиц над кнопкой лайка. */
export function LikeBurstWrap({ children, className, burstId }: WrapProps) {
  return (
    <span className={[styles.wrap, className].filter(Boolean).join(' ')}>
      <LikeBurstOverlay burstId={burstId} />
      {children}
    </span>
  );
}
