import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminProductModsStrings(locale: AdminLocale) {
  return {
    dragMod: pick(locale, 'Перетащить модификацию', '拖动修改方案'),
    dragModAria: pick(locale, 'Перетащить модификацию', '拖动修改方案'),
    namePh: pick(locale, 'Напр. 2000×800 — угловой левый', '例如：2000×800 — 左转角'),
    slugPh: pick(locale, 'slug (авто)', 'slug（自动）'),
    delete: pick(locale, 'Удалить', '删除'),
    errNames: pick(locale, 'У всех модификаций должно быть название', '每个修改方案都必须有名称'),
    saved: pick(locale, 'Модификации сохранены', '修改方案已保存'),
    saveErr: pick(locale, 'Ошибка сохранения модификаций', '保存修改方案失败'),
    sectionTitle: pick(locale, 'Модификации товара', '商品修改方案'),
    saveBusy: pick(locale, 'Сохранение…', '保存中…'),
    save: pick(locale, 'Сохранить модификации', '保存修改方案'),
    empty: pick(locale, 'Ещё нет модификаций. Нажмите «+ Модификация», чтобы добавить.', '尚无修改方案。点击「+ 修改方案」添加。'),
    addMod: pick(locale, '+ Модификация', '+ 修改方案'),
  };
}
