'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button/Button';
import { SourcingRequestModal } from '@/components/SourcingRequest/SourcingRequestModal';
import { SourcingDraftBanner } from '@/components/SourcingRequest/SourcingDraftBanner';
import styles from './ProjectSourcing.module.css';

const CONTAINER_IMAGE_SRC = '/images/container%20win-win.png';
const UNPACKING_VIDEO_SRC = '/win-win%20unpacking.mp4';

const TITLE = 'Индивидуальный подбор мебели под проект';
const DESCRIPTION =
  'Не нашли нужную модель в каталоге? Опишите задачу — подберём варианты по вашему ТЗ, референсам, чертежам или аналогам. Работаем с фабриками, проверяем соответствие бюджету и срокам, подготовим предложение для согласования';

function LazySourcingVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      className={styles.mediaVideo}
      src={shouldLoad ? UNPACKING_VIDEO_SRC : undefined}
      autoPlay={shouldLoad}
      muted
      loop
      playsInline
      preload={shouldLoad ? 'metadata' : 'none'}
      aria-label="Распаковка мебели Win-Win"
    />
  );
}

export function ProjectSourcing() {
  const [modalOpen, setModalOpen] = useState(false);
  const [resumeDraft, setResumeDraft] = useState(false);
  const [draftRefreshKey, setDraftRefreshKey] = useState(0);

  const bumpDraftBanner = useCallback(() => {
    setDraftRefreshKey((key) => key + 1);
  }, []);

  const openFreshModal = useCallback(() => {
    setResumeDraft(false);
    setModalOpen(true);
  }, []);

  return (
    <>
      <section className={styles.section} aria-labelledby="project-sourcing-title">
        <div className="padding-global">
          <div className={styles.promoGrid}>
            <div className={styles.infoPanel}>
              <h2 id="project-sourcing-title" className={styles.titleLarge}>
                {TITLE}
              </h2>
              <div className={styles.visualWrap}>
                <img
                  className={styles.containerImage}
                  src={CONTAINER_IMAGE_SRC}
                  alt=""
                  width={480}
                  height={320}
                  decoding="async"
                />
              </div>
              <div className={styles.detailsFooter}>
                <SourcingDraftBanner
                  className={styles.draftBanner}
                  refreshKey={draftRefreshKey}
                  onContinue={() => {
                    setResumeDraft(true);
                    setModalOpen(true);
                  }}
                />
                <p className={styles.description}>{DESCRIPTION}</p>
                <Button
                  type="button"
                  variant="primary"
                  className={styles.primaryBtn}
                  onClick={openFreshModal}
                >
                  Заказать подбор
                </Button>
              </div>
            </div>
            <div className={styles.mediaPanel}>
              <LazySourcingVideo />
            </div>
          </div>
        </div>
      </section>
      <SourcingRequestModal
        open={modalOpen}
        resumeDraft={resumeDraft}
        onClose={() => {
          setModalOpen(false);
          setResumeDraft(false);
          bumpDraftBanner();
        }}
        onSubmitted={bumpDraftBanner}
      />
    </>
  );
}
