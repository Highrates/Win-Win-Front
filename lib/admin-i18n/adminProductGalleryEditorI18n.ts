import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

function framesWordRu(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'кадров';
  if (mod10 === 1) return 'кадр';
  if (mod10 >= 2 && mod10 <= 4) return 'кадра';
  return 'кадров';
}

export function adminProductGalleryEditorStrings(locale: AdminLocale) {
  return {
    add: pick(locale, 'Добавить', '添加'),
    cover: pick(locale, 'Обложка', '封面'),
    remove: pick(locale, 'Удалить', '删除'),
    dragAria: pick(locale, 'Перетащить кадр', '拖动图片'),
    pickerTitle: pick(locale, 'Изображения галереи', '图库图片'),
    framesCount: (n: number) => pick(locale, `${n} ${framesWordRu(n)}`, `${n} 帧`),
    poolHeading: pick(locale, 'Кадры товара', '商品图片'),
    poolHint: pick(
      locale,
      'Нажмите на кадр, чтобы добавить его в галерею варианта.',
      '点击图片将其加入变体图库。',
    ),
    addFrameAria: pick(locale, 'Добавить кадр в галерею', '添加图片到图库'),
    removeFrameAria: pick(locale, 'Убрать кадр', '移除图片'),
    addFromLibraryAria: pick(locale, 'Добавить из медиатеки', '从媒体库添加'),
    previewFrameAria: (n: number) => pick(locale, `Открыть кадр ${n} во весь экран`, `全屏打开第 ${n} 帧`),
    lightboxClose: pick(locale, 'Закрыть', '关闭'),
    lightboxPrev: pick(locale, 'Предыдущий кадр', '上一帧'),
    lightboxNext: pick(locale, 'Следующий кадр', '下一帧'),
    lightboxCounter: (current: number, total: number) =>
      pick(locale, `${current} / ${total}`, `${current} / ${total}`),
    emptyPool: pick(
      locale,
      'У товара пока нет общей галереи — задайте кадры на карточке товара.',
      '商品尚无总图库 — 请先在商品卡片设置图片。',
    ),
    emptySelected: pick(
      locale,
      'Кадры не выбраны — на витрине будет показана общая галерея товара.',
      '未选择图片 — 前台将显示完整商品图库。',
    ),
  };
}
