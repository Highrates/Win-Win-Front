import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminProductQaStrings(locale: AdminLocale) {
  return {
    sectionTitle: pick(locale, 'Вопросы по товару', '商品问答'),
    sectionHint: pick(
      locale,
      'Публичный тред на витрине (не private correspondence). HIDDEN = снято с витрины, не приватный чат.',
      '前台公开主题（非私聊）。HIDDEN = 从前台隐藏，不是私密对话。',
    ),
    loading: pick(locale, 'Загрузка…', '加载中…'),
    empty: pick(locale, 'Вопросов пока нет.', '暂无提问。'),
    loadError: pick(locale, 'Не удалось загрузить вопросы', '无法加载问答'),
    loadOlder: pick(locale, 'Показать раньше', '显示更早'),
    loadOlderBusy: pick(locale, 'Загрузка…', '加载中…'),
    replyLabel: pick(locale, 'Ответ от магазина', '店铺回复'),
    replyPlaceholder: pick(locale, 'Текст ответа…', '回复内容…'),
    replySend: pick(locale, 'Ответить', '回复'),
    replyBusy: pick(locale, 'Отправка…', '发送中…'),
    staffBadge: pick(locale, 'Администратор', '管理员'),
    variantRef: pick(locale, 'Вариант', '变体'),
    statusVisible: pick(locale, 'На витрине', '已发布'),
    statusHidden: pick(locale, 'Скрыто', '已隐藏'),
    statusDeleted: pick(locale, 'Удалено', '已删除'),
    statusPending: pick(locale, 'На модерации', '待审核'),
    statusRejected: pick(locale, 'Отклонено', '已拒绝'),
    filterAll: pick(locale, 'Все (вкл. скрытые)', '全部（含隐藏）'),
    filterStorefront: pick(locale, 'На витрине', '已上架'),
    filterPending: pick(locale, 'На модерации', '待审核'),
    actionApprove: pick(locale, 'Опубликовать', '发布'),
    actionReject: pick(locale, 'Отклонить', '拒绝'),
    actionHide: pick(locale, 'Скрыть', '隐藏'),
    actionRestore: pick(locale, 'Показать', '显示'),
    actionDelete: pick(locale, 'Удалить', '删除'),
    actionBusy: pick(locale, '…', '…'),
    topicsLabel: pick(locale, 'Темы', '主题'),
    topicCreateTitle: pick(locale, 'Новая тема', '新主题'),
    topicCreatePlaceholder: pick(locale, 'Название темы', '主题名称'),
    topicCreateSend: pick(locale, 'Добавить тему', '添加主题'),
    topicCreateBusy: pick(locale, 'Сохранение…', '保存中…'),
    topicEditTitle: pick(locale, 'Редактировать тему', '编辑主题'),
    topicEditToggle: pick(locale, 'Редактировать тему', '编辑主题'),
    topicEditCancel: pick(locale, 'Свернуть', '收起'),
    topicEditName: pick(locale, 'Название', '名称'),
    topicEditSort: pick(locale, 'Порядок', '排序'),
    topicEditSave: pick(locale, 'Сохранить', '保存'),
    topicEditBusy: pick(locale, 'Сохранение…', '保存中…'),
    attachFile: pick(locale, 'Прикрепить файл', '附加文件'),
    attachUploading: pick(locale, 'Загрузка…', '上传中…'),
    removeAttachment: pick(locale, 'Удалить', '删除'),
    fileTooLarge: pick(locale, 'Файл слишком большой (макс. 8 МБ)', '文件过大（最大 8 MB）'),
    attachmentsMax: pick(locale, 'Не более 4 вложений', '最多 4 个附件'),
    formatTopicTabAriaLabel: (title: string, count: number) => {
      if (count <= 0) return title;
      if (locale === 'zh') return `${title}，${count} 条消息`;
      return `${title}, ${count} ${messageWordRu(count)}`;
    },
  };
}

function messageWordRu(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'сообщений';
  if (mod10 === 1) return 'сообщение';
  if (mod10 >= 2 && mod10 <= 4) return 'сообщения';
  return 'сообщений';
}

export function statusLabel(
  locale: AdminLocale,
  status: 'VISIBLE' | 'HIDDEN' | 'DELETED' | 'REJECTED' | 'PENDING',
): string {
  const s = adminProductQaStrings(locale);
  if (status === 'VISIBLE') return s.statusVisible;
  if (status === 'HIDDEN') return s.statusHidden;
  if (status === 'REJECTED') return s.statusRejected;
  if (status === 'PENDING') return s.statusPending;
  return s.statusDeleted;
}
