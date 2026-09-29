'use client';

import { Button } from '@/components/Button';
import { ActiveDesignerInvites } from '@/components/ActiveDesignerInvites/ActiveDesignerInvites';
import btnStyles from '@/components/Button/Button.module.css';
import type { ActiveDesignerInviteApi } from '@/lib/designerInvites/activeInvites';
import { displayName, parseStringArray } from './profileFormUtils';
import type { ProfileDto } from './profileTypes';
import styles from './page.module.css';

type Props = {
  profile: ProfileDto;
  activeInvites: ActiveDesignerInviteApi[];
  onOpenProfileEdit: () => void;
  onOpenAboutEdit: () => void;
  onOpenPartnerApply: () => void;
  onOpenSettings: () => void;
};

export function ProfileInfoTab({
  profile,
  activeInvites,
  onOpenProfileEdit,
  onOpenAboutEdit,
  onOpenPartnerApply,
  onOpenSettings,
}: Props) {
  const winWinPartnerApproved = Boolean(profile.winWinPartnerApproved);
  const avatarSrc = profile.avatarUrl?.trim() || '/images/placeholder.svg';
  const cityLine = profile.city?.trim() || 'Город: Не указан';
  const services = parseStringArray(profile.services);
  const servicesLine = services.length > 0 ? services.join(', ') : 'Услуги: Не указаны';
  const aboutHtml = profile.aboutHtml ?? '';
  const hasAbout = !!aboutHtml.trim();
  const coverPreviewUrl = parseStringArray(profile.coverImageUrls)[0]?.trim() || null;

  const partnerApplicationPending = Boolean(
    profile.partnerApplicationSubmittedAt &&
      !winWinPartnerApproved &&
      !profile.partnerApplicationRejectedAt,
  );
  const partnerApplicationRejected = Boolean(
    profile.partnerApplicationSubmittedAt &&
      profile.partnerApplicationRejectedAt &&
      !winWinPartnerApproved,
  );

  return (
    <>
      <div className={styles.previewPageTitlesOuter}>
        <div className={styles.previewPageTitlesRow}>
          <img
            src={avatarSrc}
            alt={displayName(profile.firstName ?? null, profile.lastName ?? null)}
            className={styles.profileAvatar}
            width={82}
            height={82}
          />
          <div className={styles.profileTitlesCol}>
            <span className={styles.profileCity}>{cityLine}</span>
            <div className={styles.profileNameRow}>
              <h1 className={styles.profileName}>
                {displayName(profile.firstName ?? null, profile.lastName ?? null)}
              </h1>
              <button
                type="button"
                className={styles.editButton}
                aria-label="Редактировать профиль"
                onClick={onOpenProfileEdit}
              >
                <img src="/icons/edit.svg" alt="" width={20} height={20} className={styles.iconBlack} aria-hidden />
              </button>
            </div>
            <span className={styles.profileServices}>{servicesLine}</span>
          </div>
          <div className={styles.previewPageTitlesActions}>
            {winWinPartnerApproved ? (
              <button
                type="button"
                className={`${styles.publishChip} ${
                  profile.designerSiteVisible ? styles.publishChipOn : styles.publishChipOff
                }`}
                onClick={onOpenSettings}
                aria-label={
                  profile.designerSiteVisible
                    ? 'Страница опубликована — открыть настройки'
                    : 'Страница не опубликована — открыть настройки'
                }
              >
                {profile.designerSiteVisible ? 'Опубликована' : 'Не опубликована'}
              </button>
            ) : partnerApplicationPending ? (
              <span className={styles.profileApplicationPendingLabel}>Заявка на рассмотрении</span>
            ) : partnerApplicationRejected ? (
              <span className={styles.profileApplicationRejectedLabel}>Заявка отклонена</span>
            ) : (
              <button
                type="button"
                className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${styles.profilePartnerCta}`}
                onClick={onOpenPartnerApply}
              >
                Стать партнёром Wupapa
              </button>
            )}
          </div>
        </div>

        <div className={styles.interactWrapper}>
          <Button
            type="button"
            variant="secondary"
            iconLeft="/icons/message.svg"
            className={styles.requestsBtn}
            aria-label="Запросы"
          >
            Запросы
          </Button>
          <div
            className={styles.interactItem}
            aria-label={`Проектов: ${Math.max(0, profile.designerCasesCount ?? 0)}`}
          >
            <img
              src="/icons/collections.svg"
              alt=""
              width={20}
              height={20}
              className={styles.interactIcon}
              aria-hidden
            />
            <span aria-hidden>{Math.max(0, profile.designerCasesCount ?? 0)}</span>
          </div>
          <div
            className={styles.interactItem}
            aria-label={`Лайков: ${Math.max(0, profile.designerLikesUserCount ?? 0)}`}
          >
            <img
              src="/icons/heart.svg"
              alt=""
              width={20}
              height={20}
              className={styles.interactIcon}
              aria-hidden
            />
            <span aria-hidden>{Math.max(0, profile.designerLikesUserCount ?? 0)}</span>
          </div>
        </div>
      </div>

      {winWinPartnerApproved ? <ActiveDesignerInvites items={activeInvites} /> : null}

      {coverPreviewUrl ? (
        <div
          className={`${styles.previewImages} ${styles.previewImagesEditable}`}
          role="button"
          tabIndex={0}
          onClick={onOpenProfileEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenProfileEdit();
            }
          }}
          aria-label="Редактировать обложку профиля"
        >
          <div className={`${styles.previewImageSlot} ${styles.previewImageSlotDouble}`}>
            <img src={coverPreviewUrl} alt="Обложка профиля" className={styles.previewImage} />
          </div>
        </div>
      ) : null}

      <section
        className={`${styles.aboutSection} ${!hasAbout ? styles.aboutSectionHeaderOnly : ''}`}
        aria-label="Подробнее о вас"
      >
        <div className={styles.aboutHeaderRow}>
          <h2 className={styles.aboutTitle}>Подробнее о вас</h2>
          <button
            type="button"
            className={styles.aboutEditButton}
            aria-label="Редактировать раздел подробнее о вас"
            onClick={onOpenAboutEdit}
          >
            <img src="/icons/edit.svg" alt="" width={20} height={20} className={styles.iconBlack} aria-hidden />
          </button>
        </div>

        {hasAbout ? (
          <div
            className={`rich-content ${styles.aboutRichContent}`}
            dangerouslySetInnerHTML={{ __html: aboutHtml }}
          />
        ) : null}
      </section>
    </>
  );
}
