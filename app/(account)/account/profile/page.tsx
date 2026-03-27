'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AccountProjectTabs } from '@/components/AccountProjectTabs/AccountProjectTabs';
import { Button } from '@/components/Button';
import { RichBlock } from '@/components/RichBlock/RichBlock';
import { TextField } from '@/components/TextField';
import textFieldStyles from '@/components/TextField/TextField.module.css';
import { MultiSelectField } from '@/components/MultiSelectField';
import styles from './page.module.css';

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExpIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3.75 9.25V3.75H9.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.25 12.75V18.25H12.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.66678 4.66665L9.55566 9.55554" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.4441 12.4444L17.333 17.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M9.25 18.25V12.75H3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.75 3.75V9.25H18.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.333 17.3333L12.4444 12.4444" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.66699 4.66665L9.55588 9.55554" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Account: Profile — превью профиля */
export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [aboutModalFullscreen, setAboutModalFullscreen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('/images/placeholder.svg');
  const [firstName, setFirstName] = useState('Имя');
  const [lastName, setLastName] = useState('Фамилия');
  const [cityOpen, setCityOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [city, setCity] = useState('Москва');
  const [services, setServices] = useState<string[]>(['Дизайн интерьера']);
  const [aboutRichValue, setAboutRichValue] = useState(
    '<p>Практикующий дизайнер интерьеров. Работаю с частными и коммерческими пространствами: от концепции до финальной комплектации.</p><h3>Подход к работе</h3><p>В проектах делаю акцент на эргономике, долговечных материалах и деталях, которые формируют комфорт на каждый день.</p>'
  );
  const [aboutRichDraft, setAboutRichDraft] = useState(aboutRichValue);
  const PROFILE_TABS = ['Инфо', 'Доход', 'Настройки'] as const;

  const CITY_OPTIONS = ['Москва', 'Санкт-Петербург', 'Казань', 'Сочи'] as const;
  const SERVICE_OPTIONS = ['Дизайн интерьера', 'Комплектация', 'Авторский надзор', 'Планировка'] as const;

  const closeProfileModal = () => {
    setProfileModalOpen(false);
    setCityOpen(false);
    setServicesOpen(false);
  };

  useEffect(() => {
    const shouldOpen = searchParams.get('profileEdit') === '1';
    if (!shouldOpen) return;
    setProfileModalOpen(true);
    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!profileModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeProfileModal();
    };
    document.addEventListener('keydown', onKeyDown);
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [profileModalOpen]);

  useEffect(() => {
    if (!aboutModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAboutModalOpen(false);
        setAboutModalFullscreen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [aboutModalOpen]);

  return (
    <section className={styles.page} aria-label="Профиль">
      <AccountProjectTabs
        projects={PROFILE_TABS}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        ariaLabel="Разделы профиля"
      />

      <div className={styles.previewPageTitlesOuter}>
        <div className={styles.previewPageTitlesRow}>
          <img
            src="/images/placeholder.svg"
            alt=""
            className={styles.profileAvatar}
            width={82}
            height={82}
          />
          <div className={styles.profileTitlesCol}>
            <span className={styles.profileCity}>Москва</span>
            <h1 className={styles.profileName}>Имя пользователя</h1>
            <span className={styles.profileServices}>Дизайн интерьера, комплектация</span>
          </div>
          <button
            type="button"
            className={styles.editButton}
            aria-label="Редактировать профиль"
            onClick={() => {
              setProfileModalOpen(true);
            }}
          >
            <img src="/icons/edit.svg" alt="" width={20} height={20} className={styles.iconBlack} />
          </button>
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
          <div className={styles.interactItem}>
            <img
              src="/icons/collections.svg"
              alt=""
              width={20}
              height={20}
              className={styles.interactIcon}
            />
            <span>12</span>
          </div>
          <div className={styles.interactItem}>
            <img
              src="/icons/heart.svg"
              alt=""
              width={20}
              height={20}
              className={styles.interactIcon}
            />
            <span>48</span>
          </div>
        </div>
      </div>

      <div className={styles.previewImages}>
        <div className={styles.previewImageSlot}>
          <button
            type="button"
            className={styles.thumbZoomBtn}
            aria-label="Открыть галерею во весь экран"
          >
            <img src="/icons/zoom-in.svg" alt="" aria-hidden />
          </button>
          <img
            src="/images/placeholder.svg"
            alt=""
            className={styles.previewImage}
            width={406}
            height={393}
          />
        </div>
        <div className={styles.previewImageSlot}>
          <img
            src="/images/placeholder.svg"
            alt=""
            className={styles.previewImage}
            width={406}
            height={393}
          />
        </div>
      </div>

      <section className={styles.aboutSection} aria-label="Подробнее о вас">
        <div className={styles.aboutHeaderRow}>
          <h2 className={styles.aboutTitle}>Подробнее о вас</h2>
          <button
            type="button"
            className={styles.aboutEditButton}
            aria-label="Редактировать раздел подробнее о вас"
            onClick={() => {
              setAboutRichDraft(aboutRichValue);
              setAboutModalOpen(true);
              setAboutModalFullscreen(false);
            }}
          >
            <img src="/icons/edit.svg" alt="" width={20} height={20} className={styles.iconBlack} />
          </button>
        </div>

        <div className={`rich-content ${styles.aboutRichContent}`} dangerouslySetInnerHTML={{ __html: aboutRichValue }} />
      </section>

      {profileModalOpen ? (
        <>
          <button
            type="button"
            className={styles.aboutModalBackdrop}
            aria-label="Закрыть редактирование профиля"
            onClick={closeProfileModal}
          />
          <section
            className={styles.aboutModalPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Редактирование профиля"
          >
            <header className={styles.aboutModalHeader}>
              <button type="button" className={styles.aboutModalIconBtn} onClick={closeProfileModal} aria-label="Закрыть">
                <CloseIcon />
              </button>
            </header>
            <div className={styles.aboutModalInner}>
              <h3 className={styles.aboutModalTitle}>Редактирование профиля</h3>

              <div className={styles.avatarUploader}>
                <span className={styles.avatarUploaderLabel}>Фото</span>
                <label className={styles.avatarUploaderField}>
                  <input
                    type="file"
                    accept="image/*"
                    className={styles.avatarUploaderInput}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = URL.createObjectURL(file);
                      setAvatarPreview(url);
                      e.currentTarget.value = '';
                    }}
                  />
                  <img src={avatarPreview} alt="" width={132} height={132} className={styles.avatarPreview} />
                  {avatarPreview !== '/images/placeholder.svg' ? (
                    <button
                      type="button"
                      className={styles.avatarRemove}
                      aria-label="Удалить фото"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAvatarPreview('/images/placeholder.svg');
                      }}
                    >
                      ×
                    </button>
                  ) : null}
                </label>
              </div>

              <div className={styles.nameRow}>
                <TextField label="Имя" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <TextField label="Фамилия" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Город</span>
                <button
                  type="button"
                  className={`${textFieldStyles.input} ${styles.selectInput}`}
                  onClick={() => setCityOpen((v) => !v)}
                  aria-expanded={cityOpen}
                >
                  <span className={city ? styles.selectValue : styles.selectPlaceholder}>
                    {city || 'Выберите город'}
                  </span>
                  <img
                    src="/icons/arrow.svg"
                    alt=""
                    width={22}
                    height={22}
                    aria-hidden
                    className={styles.chevron}
                    style={{ transform: cityOpen ? 'rotate(-90deg)' : 'rotate(90deg)' }}
                  />
                </button>
                {cityOpen ? (
                  <div className={styles.options}>
                    {CITY_OPTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={styles.option}
                        onClick={() => {
                          setCity(item);
                          setCityOpen(false);
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <MultiSelectField
                label="Услуги"
                placeholder="Выберите услуги"
                options={SERVICE_OPTIONS}
                selected={services}
                open={servicesOpen}
                onToggleOpen={() => setServicesOpen((v) => !v)}
                onToggleOption={(service) =>
                  setServices((prev) => (prev.includes(service) ? prev.filter((x) => x !== service) : [...prev, service]))
                }
                onRemoveOption={(service) => setServices((prev) => prev.filter((x) => x !== service))}
              />

              <div className={styles.aboutModalActions}>
                <Button variant="primary" onClick={closeProfileModal}>
                  Сохранить
                </Button>
              </div>
            </div>
          </section>
        </>
      ) : null}

      {aboutModalOpen ? (
        <>
          <button
            type="button"
            className={styles.aboutModalBackdrop}
            aria-label="Закрыть редактирование"
            onClick={() => {
              setAboutModalOpen(false);
              setAboutModalFullscreen(false);
            }}
          />
          <section
            className={`${styles.aboutModalPanel} ${aboutModalFullscreen ? styles.aboutModalPanelFullscreen : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Редактирование блока подробнее о вас"
          >
            <header className={styles.aboutModalHeader}>
              <button
                type="button"
                className={`${styles.aboutModalIconBtn} ${styles.aboutModalFullscreenBtn}`}
                onClick={() => setAboutModalFullscreen((v) => !v)}
                aria-label={aboutModalFullscreen ? 'Выйти из полноэкранного режима' : 'Открыть во весь экран'}
              >
                {aboutModalFullscreen ? <CollapseIcon /> : <ExpIcon />}
              </button>
              <button
                type="button"
                className={styles.aboutModalIconBtn}
                onClick={() => {
                  setAboutModalOpen(false);
                  setAboutModalFullscreen(false);
                }}
                aria-label="Закрыть"
              >
                <CloseIcon />
              </button>
            </header>
            <div className={styles.aboutModalInner}>
              <h3 className={styles.aboutModalTitle}>Подробнее о вас</h3>
              <RichBlock
                value={aboutRichDraft}
                onChange={setAboutRichDraft}
                placeholder="Расскажите о себе: опыт, специализация, подход к проектам..."
              />
              <div className={styles.aboutModalActions}>
                <Button
                  variant="primary"
                  onClick={() => {
                    setAboutRichValue(aboutRichDraft);
                    setAboutModalOpen(false);
                  }}
                >
                  Сохранить
                </Button>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}
