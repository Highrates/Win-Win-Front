import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';
import { ORDER_STATUS_DRAFT, ORDER_STATUS_FLOW, orderStatusLabel } from '@/lib/orders/orderStatus';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminOrderStatusLabels(locale: AdminLocale): Record<string, string> {
  const loc = locale === 'zh' ? 'zh' : 'ru';
  const out: Record<string, string> = {
    [ORDER_STATUS_DRAFT]: orderStatusLabel(ORDER_STATUS_DRAFT, loc),
  };
  for (const code of ORDER_STATUS_FLOW) {
    out[code] = orderStatusLabel(code, loc);
  }
  return out;
}

export function adminOrdersSectionStrings(locale: AdminLocale) {
  return {
    tabOrders: pick(locale, 'Заказы', '订单'),
    tabSourcing: pick(locale, 'Заявки на подбор', '选品申请'),
    sectionsAria: pick(locale, 'Раздел заказов и заявок на подбор', '订单与选品申请'),
  };
}

export function adminSourcingStrings(locale: AdminLocale) {
  const orders = adminOrdersStrings(locale);
  return {
    ...orders,
    tabNew: pick(locale, 'Новые', '新申请'),
    tabsAria: pick(locale, 'Заявки на подбор', '选品申请'),
    emptyBucket: pick(locale, 'Нет заявок в этой вкладке', '此分区暂无申请'),
    searchPh: pick(locale, 'Поиск по теме, клиенту, номеру', '按主题、客户或编号搜索'),
    searchAria: pick(locale, 'Поиск заявок', '搜索申请'),
    thRequest: pick(locale, 'Заявка', '申请'),
    thCity: pick(locale, 'Город', '城市'),
    takeInWork: pick(locale, 'Взять в работу', '接手处理'),
    takeInWorkFirst: pick(locale, 'Сначала возьмите заявку в работу', '请先接手处理申请'),
    backList: pick(locale, '← К заявкам на подбор', '← 返回选品申请'),
    errLoadDetail: pick(locale, 'Не удалось загрузить заявку', '无法加载申请详情'),
    statusLine: (label: string) => pick(locale, `Статус: ${label}`, `状态：${label}`),
    sectionClient: pick(locale, 'Клиент', '客户'),
    deliveryCityLine: (city: string) => pick(locale, `Город доставки: ${city}`, `配送城市：${city}`),
    sectionProducts: (n: number) => pick(locale, `Товары (${n})`, `商品（${n}）`),
    sectionAttachments: pick(locale, 'Файлы к заявке', '申请附件'),
    linkLabel: pick(locale, 'Ссылка', '链接'),
    referencesLabel: pick(locale, 'Референсы', '参考图'),
    materialLabel: pick(locale, 'Материал', '材质'),
    colorLabel: pick(locale, 'Цвет', '颜色'),
    sizeLabel: pick(locale, 'Размер', '尺寸'),
    descriptionLabel: pick(locale, 'Описание', '描述'),
    quantityLabel: pick(locale, 'Количество', '数量'),
    unitLabel: pick(locale, 'Ед. измерения', '计量单位'),
    expectedBudgetLabel: pick(locale, 'Ожидаемый бюджет', '预期预算'),
    quantityLine: (qty: number, unit: string) =>
      pick(locale, `Количество: ${qty} ${unit}`, `数量：${qty} ${unit}`),
    chatAsideAria: pick(locale, 'Чат по заявке', '申请沟通'),
  };
}

export function adminOrdersStrings(locale: AdminLocale) {
  return {
    errLoad: pick(locale, 'Ошибка загрузки', '加载失败'),
    errSaveStatus: pick(locale, 'Не удалось сохранить статус', '无法保存状态'),
    searchPh: pick(locale, 'ID заказа, email или телефон', '订单 ID、邮箱或电话'),
    find: pick(locale, 'Найти', '查找'),
    thDate: pick(locale, 'Дата', '日期'),
    thOrder: pick(locale, 'Заказ', '订单'),
    thClient: pick(locale, 'Клиент', '客户'),
    thSum: pick(locale, 'Сумма', '金额'),
    thStatus: pick(locale, 'Статус', '状态'),
    thChat: pick(locale, 'Сообщения', '消息'),
    loading: pick(locale, 'Загрузка…', '加载中…'),
    empty: pick(locale, 'Нет заказов', '暂无订单'),
    itemsCount: (n: number) => pick(locale, `${n} поз.`, `${n} 项`),
    save: pick(locale, 'Сохранить', '保存'),
    saving: pick(locale, '…', '…'),
    back: pick(locale, 'Назад', '上一页'),
    pageOf: (page: number, totalPages: number, total: number) =>
      pick(locale, `Стр. ${page} из ${totalPages} (${total})`, `第 ${page} / ${totalPages} 页（${total}）`),
    forward: pick(locale, 'Вперёд', '下一页'),
    tabsAria: pick(locale, 'Разделы списка заказов', '订单列表分区'),
    tabNew: pick(locale, 'Новые заказы', '新订单'),
    tabActive: pick(locale, 'В работе', '进行中'),
    tabCompleted: pick(locale, 'Завершённые', '已完成'),
  };
}

export function adminOrderDetailStrings(locale: AdminLocale) {
  return {
    backList: pick(locale, '← К списку заказов', '← 返回订单列表'),
    title: pick(locale, 'Заказ', '订单'),
    errLoad: pick(locale, 'Не удалось загрузить заказ', '无法加载订单'),
    notFound: pick(locale, 'Заказ не найден', '未找到订单'),
    sectionClient: pick(locale, 'Клиент и доставка', '客户与配送'),
    sectionItems: pick(locale, 'Состав заказа', '订单明细'),
    sectionComment: pick(locale, 'Комментарий', '备注'),
    sectionDocs: pick(locale, 'Документы', '文档'),
    sectionMeta: pick(locale, 'Реквизиты', '信息'),
    labelStatus: pick(locale, 'Статус', '状态'),
    labelCreated: pick(locale, 'Создан', '创建于'),
    labelUpdated: pick(locale, 'Обновлён', '更新于'),
    labelAccount: pick(locale, 'Клиент', '客户'),
    labelEmail: pick(locale, 'Email', 'Email'),
    labelPhone: pick(locale, 'Телефон', '电话'),
    labelTotal: pick(locale, 'Сумма', '合计'),
    labelCurrency: pick(locale, 'Валюта', '货币'),
    labelFio: pick(locale, 'ФИО заказчика', '收货人姓名'),
    labelAddress: pick(locale, 'Адрес доставки', '配送地址'),
    save: pick(locale, 'Сохранить статус', '保存状态'),
    saving: pick(locale, 'Сохранение…', '保存中…'),
    errSaveStatus: pick(locale, 'Не удалось сохранить статус', '无法保存状态'),
    openProduct: pick(locale, 'Товар в каталоге', '在目录中打开'),
    thProduct: pick(locale, 'Товар', '商品'),
    thQtyUnit: pick(locale, 'Кол-во', '数量'),
    thQty: pick(locale, 'Кол-во', '数量'),
    thUnit: pick(locale, 'Ед.', '单位'),
    thPrice: pick(locale, 'Цена', '单价'),
    thLineTotal: pick(locale, 'Сумма', '小计'),
    noItems: pick(locale, 'Нет позиций', '无明细'),
    emptyComment: pick(locale, '—', '—'),
    noDocs: pick(locale, 'Нет прикреплённых ссылок', '无附件链接'),
    snapshotModification: pick(locale, 'Модификация', '配置'),
    snapshotElementFallback: pick(locale, 'Элемент', '部件'),
    chatAsideAria: pick(locale, 'Чат и записки по заказу', '订单沟通与备注'),
    chatTitle: pick(locale, 'Чат', '沟通'),
    tabChat: pick(locale, 'Чат', '聊天'),
    tabNotes: pick(locale, 'Записки', '备注'),
    notesPlaceholder: pick(locale, 'Внутренние заметки по заказу…', '内部订单备注…'),
    notesHint: pick(locale, 'Видно только в админке.', '仅管理端可见。'),
    notesSaving: pick(locale, 'Сохранение…', '保存中…'),
    notesSaved: pick(locale, 'Сохранено', '已保存'),
    notesSaveError: pick(locale, 'Не удалось сохранить записки', '备注保存失败'),
    notesSave: pick(locale, 'Сохранить', '保存'),
    chatPlaceholder: pick(locale, 'Сообщение…', '消息…'),
    chatEmpty: pick(locale, 'Пока нет сообщений', '暂无消息'),
    chatLoadOlder: pick(locale, 'Показать раньше', '更早消息'),
    footerSumLabel: pick(locale, 'Сумма', '合计'),
    actionPrepareCp: pick(locale, 'КП / Excel', '报价 / Excel'),
    actionKpDisabledDraft: pick(
      locale,
      'КП доступно после отправки заказа на согласование',
      '订单提交审批后可编辑报价 / Excel',
    ),
    actionExcelExport: pick(locale, 'Скачать Excel', '下载 Excel'),
    actionExcelExportDraft: pick(locale, 'Скачать Excel (черновик)', '下载 Excel（草稿）'),
    actionExcelImportDraft: pick(locale, 'Загрузить Excel', '上传 Excel'),
    actionExcelVersion: (version: number) => pick(locale, `Excel v${version}`, `Excel v${version}`),
    excelBusy: pick(locale, 'Excel…', 'Excel…'),
    excelSheetProtectHint: pick(
      locale,
      'Excel защищён: правьте qty/цену (и габариты). Не снимайте защиту и не чистите скрытую колонку match (T) — иначе строки не сопоставятся.',
      'Excel 已保护：可改数量/价格（及尺寸）。请勿取消保护或清理隐藏的 match 列（T），否则无法匹配行。',
    ),
    excelImportOk: (updated: number, unmatched?: number) =>
      pick(
        locale,
        unmatched && unmatched > 0
          ? `Обновлено позиций из Excel: ${updated}. Не сопоставлено: ${unmatched} (оставлены без изменений).`
          : `Обновлено позиций из Excel: ${updated}`,
        unmatched && unmatched > 0
          ? `已从 Excel 更新 ${updated} 项；未匹配 ${unmatched} 项（未改动）。`
          : `已从 Excel 更新 ${updated} 项`,
      ),
    excelDiffLabels: {
      title: pick(locale, 'Превью импорта Excel', 'Excel 导入预览'),
      apply: pick(locale, 'Применить', '应用'),
      cancel: pick(locale, 'Отмена', '取消'),
      downloadReport: pick(locale, 'Скачать отчёт', '下载报告'),
      sheetProtectHint: pick(
        locale,
        'Не снимайте защиту листа и не чистите скрытую колонку match (T).',
        '请勿取消工作表保护，也勿清理隐藏的 match 列（T）。',
      ),
      matched: (n: number) => pick(locale, `Сопоставлено: ${n}`, `已匹配：${n}`),
      changed: (n: number) => pick(locale, `С изменениями полей: ${n}`, `字段有变更：${n}`),
      unchanged: (n: number) =>
        pick(locale, `Без изменений в черновике: ${n}`, `草稿未改：${n}`),
      unmatched: (n: number) => pick(locale, `Не сопоставлено: ${n}`, `未匹配：${n}`),
      emptyMatchKey: (rows: number[]) =>
        pick(
          locale,
          `Пустой ключ в колонке T (строки Excel: ${rows.join(', ')}). Сопоставление может уйти на No. — проверьте файл.`,
          `T 列匹配键为空（Excel 行：${rows.join(', ')}）。可能回退到 No.，请检查文件。`,
        ),
      noFieldChanges: pick(
        locale,
        'Сопоставленные строки без отличий qty/price/dims/weight/volume.',
        '已匹配行在数量/价格/尺寸/重量/体积上无差异。',
      ),
      excelRow: (n: number) => pick(locale, `стр. Excel ${n}`, `Excel 第 ${n} 行`),
      fieldLabel: (field: string) => {
        const mapRu: Record<string, string> = {
          quantity: 'Кол-во',
          offerUnitPriceRub: 'Цена ₽ (после)',
          unitPriceCny: 'Цена ¥ (Excel)',
          costPriceCny: 'Себест. ¥',
          weightKg: 'Вес кг',
          grossWeightKg: 'Вес брутто кг',
          volumeM3: 'Объём м³',
          dimsMm: 'Габариты мм',
          description: 'Описание',
        };
        const mapZh: Record<string, string> = {
          quantity: '数量',
          offerUnitPriceRub: '价格 ₽（换算后）',
          unitPriceCny: '价格 ¥（Excel）',
          costPriceCny: '成本 ¥',
          weightKg: '重量 kg',
          grossWeightKg: '毛重 kg',
          volumeM3: '体积 m³',
          dimsMm: '尺寸 mm',
          description: '描述',
        };
        return pick(locale, mapRu[field] || field, mapZh[field] || field);
      },
      formatValue: (v: string | number | null) => (v == null || v === '' ? '—' : String(v)),
    },
    errExcelExport: pick(locale, 'Не удалось скачать Excel', '无法下载 Excel'),
    errExcelImport: pick(locale, 'Не удалось загрузить Excel', '无法上传 Excel'),
    actionCancelOrder: pick(locale, 'Удалить заявку', '删除申请'),
    actionsHintPrepareCp: pick(
      locale,
      'Черновик КП и Excel для поставщика — в разделе «КП / Excel».',
      '报价草稿与供应商 Excel 在「报价 / Excel」。',
    ),
    kpDraftLineCount: (n: number) =>
      pick(locale, `Черновик КП: ${n} поз.`, `报价草稿：${n} 项`),
    flashDismiss: pick(locale, 'Закрыть', '关闭'),
    cancelModalReminder: pick(
      locale,
      'Перед удалением напишите в чате справа причину — клиент увидит её в личном кабинете.',
      '删除前请在右侧沟通栏写明原因，客户将在个人中心看到。',
    ),
    cancelModalTitle: pick(locale, 'Удалить заявку на согласовании?', '要删除此待审批申请吗？'),
    cancelModalConfirm: pick(locale, 'Удалить', '删除'),
    cancelModalCancel: pick(locale, 'Отмена', '取消'),
    errDeleteOrder: pick(locale, 'Не удалось удалить заказ', '删除失败'),
    statusPendingHint: pick(
      locale,
      'Сейчас заказ «На согласовании». Следующий статус лучше выбирать при отправке КП (или вручную после него).',
      '当前为「待审批」。建议在发送报价时选择下一状态，或发送后再手动更改。',
    ),
    actionPdf: pick(locale, 'PDF', 'PDF'),
    actionPdfBusy: pick(locale, 'PDF…', 'PDF…'),
    errPdf: pick(locale, 'Не удалось сформировать PDF', '无法生成 PDF'),
    pdfSavedWithImageWarnings: (failedCount: number) =>
      pick(
        locale,
        `PDF сохранён, но ${failedCount} изображ. не загрузилось`,
        `PDF 已保存，但有 ${failedCount} 张图片加载失败`,
      ),
    kpPublish: pick(locale, 'Отправить', '发送'),
    kpPublishing: pick(locale, 'Отправка…', '发送中…'),
    kpPublishSavesDraft: pick(locale, 'Отправить (сохранит черновик)', '发送（会先保存草稿）'),
    kpNotSentYet: pick(locale, 'Предложение ещё не отправлено', '报价尚未发送'),
    kpDirtyHint: pick(locale, 'Есть несохранённые изменения', '有未保存的更改'),
    kpSaveDraft: pick(locale, 'Сохранить черновик', '保存草稿'),
    kpSavingDraft: pick(locale, 'Сохранение…', '保存中…'),
    kpDiscardDraft: pick(locale, 'Сбросить', '放弃'),
    kpDiscardConfirm: pick(
      locale,
      'Сбросить несохранённые правки и вернуть черновик с сервера?',
      '放弃未保存修改并恢复服务器上的草稿？',
    ),
    kpExcelDirtyConfirm: pick(
      locale,
      'Есть несохранённые правки. Импорт Excel перезапишет их на сервере. Продолжить?',
      '有未保存修改。导入 Excel 将在服务器上覆盖它们。继续？',
    ),

    kpQtyPieces: pick(locale, 'Кол-во (шт)', '数量（件）'),
    kpColumnActions: pick(locale, 'Действия', '操作'),
    kpBtnReplace: pick(locale, 'Заменить товар', '更换商品'),
    kpPublishConfirmTitle: pick(locale, 'Отправить предложение клиенту?', '向客户发送此报价？'),
    kpPublishConfirmCancel: pick(locale, 'Отмена', '取消'),
    kpPublishConfirmSubmit: pick(locale, 'Отправить', '发送'),
    kpPublishConfirmSending: pick(locale, 'Отправка…', '发送中…'),
    kpPublishSummaryHeading: pick(locale, 'Итог', '摘要'),
    kpPublishPositions: (n: number) => pick(locale, `Позиций: ${n}`, `${n} 项`),
    kpPublishNextStatus: pick(locale, 'Статус заказа после отправки', '发送后的订单状态'),
    kpSectionPublished: pick(locale, 'Отправленные КП', '已发送报价单'),
    kpSectionCustomerResponse: pick(locale, 'Ответ клиента', '客户回复'),
    kpCustomerDecisionAccepted: pick(locale, 'Подтвердил КП', '已确认报价'),
    kpCustomerDecisionChanges: pick(locale, 'Запросил изменения', '请求修改'),
    kpCustomerDecisionRejected: pick(locale, 'Отклонил КП', '已拒绝报价'),
    kpCustomerDecisionVersion: pick(locale, 'Версия КП', '报价版本'),
    kpCustomerDecisionAt: pick(locale, 'Время ответа', '回复时间'),
    kpCustomerRequisitesHeading: pick(locale, 'Реквизиты для счёта', '开票信息'),
    kpCustomerLegalIndividual: pick(locale, 'Физлицо', '个人'),
    kpCustomerLegalIe: pick(locale, 'ИП', '个体户'),
    kpCustomerLegalLlc: pick(locale, 'ООО', '有限公司'),
    kpCustomerReqContact: pick(locale, 'Контакт', '联系人'),
    kpCustomerReqPhone: pick(locale, 'Телефон', '电话'),
    kpCustomerReqCompany: pick(locale, 'Организация', '公司'),
    kpCustomerReqInn: pick(locale, 'ИНН', '税号'),
    kpCustomerReqKpp: pick(locale, 'КПП', 'KPP'),
    kpCustomerReqLegalAddress: pick(locale, 'Юридический адрес', '注册地址'),
    kpCustomerReqBankName: pick(locale, 'Банк', '银行'),
    kpCustomerReqBankAccount: pick(locale, 'Расчётный счёт', '结算账户'),
    kpCustomerReqBic: pick(locale, 'БИК', 'BIC'),
    kpCustomerReqCorrAccount: pick(locale, 'Корр. счёт', '代理账户'),
    kpCustomerNoResponse: pick(locale, 'Клиент ещё не ответил на КП.', '客户尚未回复报价。'),
    kpPublishedLoading: pick(locale, 'Загрузка КП…', '加载报价中…'),
    kpPublishedExpand: pick(locale, 'Показать состав', '展开明细'),
    kpPublishedCollapse: pick(locale, 'Скрыть состав', '收起明细'),
    kpPublishedNone: pick(
      locale,
      'Отправленных коммерческих предложений пока нет.',
      '暂无已发送的报价单。',
    ),
    kpPublishedVersionCaption: (
      versionNumber: number,
      publishedAtFormatted: string,
      positionsLabel: string,
    ) =>
      pick(
        locale,
        `Версия ${versionNumber} · отправлено ${publishedAtFormatted} · ${positionsLabel}`,
        `第 ${versionNumber} 版 · ${publishedAtFormatted} · ${positionsLabel}`,
      ),
    kpDiscountLabel: pick(locale, 'Скидка', '折扣'),
    kpPublishedDetailError: pick(
      locale,
      'Не удалось загрузить строки опубликованного КП. Обновите страницу.',
      '报价明细加载失败，请刷新页面。',
    ),
  };
}
