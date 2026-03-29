/** Группы документов по дате для ЛК «Документы» (мок). */
export type AccountDocItem = {
  id: string;
  title: string;
};

export type AccountDocsDateGroup = {
  dateISO: string;
  docs: AccountDocItem[];
};

export const ACCOUNT_DOCS_GROUPS: AccountDocsDateGroup[] = [
  {
    dateISO: '2026-06-20',
    docs: [
      { id: '1', title: 'Счёт на оплату № 1842' },
      { id: '2', title: 'Акт выполненных работ' },
    ],
  },
  {
    dateISO: '2026-06-14',
    docs: [{ id: '3', title: 'Договор оказания услуг (доп. соглашение)' }],
  },
  {
    dateISO: '2026-06-03',
    docs: [
      { id: '4', title: 'Счёт-фактура № 901' },
      { id: '5', title: 'УПД № 445' },
    ],
  },
  {
    dateISO: '2026-05-22',
    docs: [{ id: '6', title: 'Справка о партнёрском статусе' }],
  },
  {
    dateISO: '2026-05-08',
    docs: [
      { id: '7', title: 'Реквизиты для оплаты (обновление)' },
      { id: '8', title: 'Политика обработки персональных данных (подпись)' },
    ],
  },
  {
    dateISO: '2026-04-17',
    docs: [
      { id: '9', title: 'KYC — подтверждение личности' },
      { id: '10', title: 'Договор оферты Win-Win' },
    ],
  },
];
