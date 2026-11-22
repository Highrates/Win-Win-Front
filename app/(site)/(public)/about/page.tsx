import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/brand';
import { Hero } from '@/sections/home';
import topFoldStyles from '@/sections/home/HomeTopFold.module.css';
import styles from './AboutPage.module.css';

const ABOUT_HERO_IMAGE_SRC = '/images/about.webp';

export const metadata: Metadata = {
  title: `О нас — ${SITE_NAME}`,
  description:
    'История Wupapa: как мы строили мебельную платформу на доверии и взаимной выгоде для клиентов, партнёров и команды.',
};

export default function AboutPage() {
  return (
    <>
      <div className={`${topFoldStyles.topFold} ${topFoldStyles.topFoldCompact}`}>
        <Hero imageUrl={ABOUT_HERO_IMAGE_SRC} fillFold cornerLabel={null} />
      </div>

      <section className={styles.section} aria-label="О нас">
        <h1 className={styles.visuallyHidden}>О нас</h1>
        <div className={`padding-global ${styles.inner}`}>
          <div className={styles.body}>
            <p>
              Всё началось больше 15 лет назад, когда мы с Ху познакомились на международной
              выставке мебели в Москве в 2008 году. Нас объединила общая страсть к бизнесу и вера
              в то, что сотрудничество может быть честным и взаимовыгодным.
            </p>
            <p>
              Когда пришло время выбрать имя и философию платформы, в основу легла простая мысль:
              выигрывают все. Клиент получает качественный продукт, партнёр — надёжного союзника,
              компания — устойчивую прибыль, а сотрудники — достойную работу. Так появился{' '}
              {SITE_NAME}.
            </p>
            <p>
              Я видел много примеров, когда одна сторона пыталась «выиграть» за счёт другой — и в
              итоге проигрывали все. Долгосрочные отношения строятся на доверии, а доверие
              рождается из взаимной выгоды.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
