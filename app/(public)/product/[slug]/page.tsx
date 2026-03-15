import Link from 'next/link';
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { ProductGallery } from '@/components/ProductGallery';
import { Button } from '@/components/Button';
import { Recommendations } from '@/sections/home';
import ProductAccordions from './ProductAccordions';
import ProductSizeOptions from './ProductSizeOptions';
import ProductMaterialsOptions from './ProductMaterialsOptions';
import { ProductDetailsStickyBar } from './ProductDetailsStickyBar';
import styles from './ProductPage.module.css';

/** Пул товаров для маппинга slug → данные (совпадает с categories) */
const PRODUCTS_POOL = [
  { slug: 'sofa-classic', name: 'Диван Classic', price: 135090 },
  { slug: 'kreslo-lounge', name: 'Кресло Lounge', price: 45000 },
  { slug: 'stolik-round', name: 'Столик Round', price: 28500 },
  { slug: 'konsol-wood', name: 'Консоль Wood', price: 67200 },
  { slug: 'stul-comfort', name: 'Стул Comfort', price: 19900 },
  { slug: 'puf-velvet', name: 'Пуф Velvet', price: 12400 },
  { slug: 'shkaf-modern', name: 'Шкаф Modern', price: 89000 },
  { slug: 'lampa-arc', name: 'Лампа Arc', price: 35090 },
  { slug: 'krovat-dream', name: 'Кровать Dream', price: 156000 },
  { slug: 'tumba-night', name: 'Тумба Night', price: 24300 },
  { slug: 'zerkalo-wall', name: 'Зеркало Wall', price: 31500 },
  { slug: 'polka-open', name: 'Полка Open', price: 14700 },
  { slug: 'stol-dining', name: 'Стол Dining', price: 78000 },
  { slug: 'bra-minimal', name: 'Бра Minimal', price: 9800 },
  { slug: 'komod-line', name: 'Комод Line', price: 54600 },
  { slug: 'kreslo-relax', name: 'Кресло Relax', price: 62000 },
  { slug: 'stol-coffee', name: 'Стол Coffee', price: 42000 },
  { slug: 'kreslo-wing', name: 'Кресло Wing', price: 73500 },
  { slug: 'svetilnik-spot', name: 'Светильник Spot', price: 11200 },
  { slug: 'polka-wall', name: 'Полка Wall', price: 18900 },
];

function getProductBySlug(slug: string) {
  return PRODUCTS_POOL.find((p) => p.slug === slug) ?? null;
}

function getProductName(slug: string): string {
  const p = getProductBySlug(slug);
  return p ? p.name : slug.replace(/-/g, ' ');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = getProductName(slug);
  return {
    title: `${name} — Win-Win`,
    description: `Товар: ${name}`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  const productName = getProductName(slug);

  const breadcrumbs = [
    { label: 'Главная', href: '/', current: false },
    { label: 'Гостиная', href: '/categories', current: false },
    { label: 'Каталог', href: '/categories/divany', current: false },
    { label: productName, href: '', current: true },
  ];

  return (
    <main>
      <section className={styles.productSection}>
        <div className="padding-global">
          <div className={styles.productPageFlow}>
            <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
              {breadcrumbs.map((item, i) => (
                <Fragment key={i}>
                  {i > 0 && <span className={styles.breadcrumbsSep}>/</span>}
                  {item.current ? (
                    <span className={styles.breadcrumbsCurrent}>{item.label}</span>
                  ) : (
                    <Link href={item.href} className={styles.breadcrumbsLink}>
                      {item.label}
                    </Link>
                  )}
                </Fragment>
              ))}
            </nav>
            <div className={styles.productImgsWrapper}>
              {product ? (
                <ProductGallery
                  images={[
                    '/images/p-1.png',
                    '/images/p-2.png',
                    '/images/p-3.jpg',
                    '/images/p-4.jpg',
                    '/images/p-5.jpg',
                    '/images/p-6.jpg',
                  ]}
                  productName={product.name}
                />
              ) : (
                <div>
                  <p>{productName}</p>
                  <p>Товар не найден в каталоге.</p>
                </div>
              )}
            </div>

            <div className={styles.productDetails}>
              <div className={styles.productDetailsLeft}>
                <div className={styles.productDetailsInner}>
                  <div className={styles.productTitles}>
                    <span className={styles.productBrandName}>Glamor Master</span>
                    <h1 className={styles.productName}>{productName}</h1>
                  </div>
                  <div className={styles.productDetailsInteract}>
                    <div className={styles.productDetailsInteractItem}>
                      <img src="/icons/collections.svg" alt="" width={20} height={20} className={styles.productDetailsInteractIcon} />
                      <span className={styles.productDetailsInteractValue}>{product ? 5 : 0}</span>
                    </div>
                    <div className={styles.productDetailsInteractItem}>
                      <img src="/icons/heart.svg" alt="" width={20} height={20} className={styles.productDetailsInteractIcon} />
                      <span className={styles.productDetailsInteractValue}>{product ? 180 : 0}</span>
                    </div>
                    <div className={styles.productDetailsInteractItem}>
                      <img src="/icons/message.svg" alt="" width={20} height={20} className={styles.productDetailsInteractIcon} />
                      <span className={styles.productDetailsInteractValue}>{product ? 180 : 0}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.productDetailsRight}>
                <div className={styles.productDetailsRightRow}>
                  <span className={styles.productDetailsPrice}>
                    {product ? `~${product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽` : '—'}
                  </span>
                  <div className={styles.productDetailsBtnsWrapper}>
                    <div className={styles.productDetailsBtnsSecondary}>
                      <Button
                        variant="secondary"
                        iconLeft="/icons/ruler&pen.svg"
                        iconRightChevron
                        aria-label="Скачать чертеж"
                      />
                      <Button
                        variant="secondary"
                        iconLeft="/icons/3dcube.svg"
                        iconRightChevron
                        aria-label="Скачать 3D модель"
                      />
                    </div>
                    <Button variant="primary" className={styles.productDetailsBtnPrimary}>
                      Добавить к заказу
                    </Button>
                  </div>
                </div>
                <ProductDetailsStickyBar
                  priceText={product ? `~${product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽` : '—'}
                />

                <div className={styles.descriptionWrapper}>
                  <p className={styles.descriptionText}>
                    {product
                      ? 'Коллекция сочетает лаконичный силуэт и комфорт. Подходит для гостиной и зоны отдыха. Каркас из массива, обивка — ткань или кожа на выбор.'
                      : 'Описание товара недоступно.'}
                  </p>
                </div>

                <div className={styles.productColorWrapper}>
                  <span className={styles.productColorTitle}>Цвет</span>
                    <div className={styles.productColorSelect} role="combobox" aria-expanded="false" aria-label="Выбор цвета">
                    <div className={styles.productColorSelectInner}>
                      <img
                        src="/images/p-1.png"
                        alt=""
                        width={70}
                        height={70}
                        className={styles.productColorSwatch}
                      />
                      <span className={styles.productColorName}>Бежевый</span>
                    </div>
                    <span className={styles.productColorChevron} aria-hidden>
                      <svg xmlns="http://www.w3.org/2000/svg" width="9" height="5" viewBox="0 0 9 5" fill="none">
                        <path d="M0 0L4.5 5L9 0" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                    </span>
                  </div>
                </div>

                <div className={styles.productMaterialsSelect}>
                  <span className={styles.productMaterialsTitle}>Материалы</span>
                  <ProductMaterialsOptions />
                </div>

                <div className={styles.productSizeSelect}>
                  <span className={styles.productSizeTitle}>Размеры</span>
                  <ProductSizeOptions />
                </div>

                <div className={styles.accordionsWrapper}>
                  <ProductAccordions />
                </div>

                <div className={styles.brandWrapper}>
                  <h2 className={styles.brandTitle}>Бренд</h2>
                  <Link
                    href="/brands/glamor-master"
                    className={styles.brandContent}
                    aria-label="Перейти на страницу бренда Glamor Master"
                  >
                    <div className={styles.brandContentInner}>
                      <div className={styles.brandLogo} aria-hidden />
                      <div className={styles.brandShortDescription}>
                        <span className={styles.brandName}>Glamor Master</span>
                        <p className={styles.brandDescription}>
                          Продукция компании охватывает все жилые зоны, такие как гостиная, чайная комната, столовая, спальня и кабинет и включает различные виды мебели, такие как диваны, чайные столики, обеденные столы и кровати.
                        </p>
                      </div>
                    </div>
                    <img src="/icons/arrow.svg" alt="" width={22} height={22} className={styles.brandArrow} aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Recommendations id="product-recommendations" title="Похожие товары" />
    </main>
  );
}
