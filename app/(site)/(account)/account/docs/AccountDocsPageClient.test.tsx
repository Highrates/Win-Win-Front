import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  AccountDocument,
  AccountDocumentGroup,
  AccountDocumentGroupsPage,
  AccountDocumentsPage,
} from '@/lib/account/documentsApi';
import { AccountLoadError } from '@/lib/account/loadErrorMessage';
import { ACCOUNT_WORK_FEED_REFRESH_EVENT } from '@/lib/account/orders';
import { AccountDocsPageClient } from './AccountDocsPageClient';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string; className?: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

vi.mock('@/components/SourcingRequest/SourcingRequestModal', () => ({
  SourcingRequestModal: ({ open }: { open: boolean }) => (open ? <div role="dialog">Заявка на подбор</div> : null),
}));

const fetchAccountDocuments = vi.fn<(opts?: object) => Promise<AccountDocumentsPage>>();
vi.mock('@/lib/account/documentsApi', async (orig) => ({
  ...(await orig<typeof import('@/lib/account/documentsApi')>()),
  fetchAccountDocuments: (opts?: object) => fetchAccountDocuments(opts),
  fetchAccountDocumentGroups: (opts?: object) => fetchAccountDocumentGroups(opts),
}));
const fetchAccountDocumentGroups = vi.fn<(opts?: object) => Promise<AccountDocumentGroupsPage>>();

function doc(partial: Partial<AccountDocument> & { id: string }): AccountDocument {
  return {
    title: `${partial.id}.pdf`,
    mimeType: 'application/pdf',
    ext: 'pdf',
    external: false,
    inline: true,
    createdAt: '2026-06-18T10:00:00.000Z',
    source: 'ORDER_CHAT',
    sourceId: 'order-1',
    sourceStatus: 'PAID',
    uploadedBy: 'STAFF',
    ...partial,
  };
}

describe('AccountDocsPageClient', () => {
  beforeEach(() => {
    fetchAccountDocuments.mockReset();
    fetchAccountDocumentGroups.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the skeleton while loading, then rows with type badge and source link', async () => {
    let resolve!: (p: AccountDocumentsPage) => void;
    fetchAccountDocuments.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    render(<AccountDocsPageClient />);

    expect(screen.getByLabelText('Загрузка документов')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Фильтры документов' })).toBeDisabled();

    await act(async () => {
      resolve({
        items: [
          doc({ id: 'chat:a', title: 'kp_final_v3 (1).pdf' }),
          doc({ id: 'order-doc:b', title: 'Счёт', ext: 'xlsx', mimeType: null, source: 'ORDER_DOCUMENT', external: true }),
          doc({ id: 'chat:c', title: 'Договор.docx', ext: 'docx', mimeType: null, inline: false, sourceId: 'order-2', sourceStatus: 'COMPLETED' }),
        ],
        nextCursor: null,
      });
    });

    const pdf = screen.getByRole('link', { name: 'kp_final_v3 (1).pdf — откроется в новой вкладке' });
    expect(pdf).toHaveAttribute('href', '/api/user/files/chat%3Aa');
    expect(pdf).toHaveAttribute('target', '_blank');
    expect(pdf).not.toHaveAttribute('download');
    const docx = screen.getByRole('link', { name: 'Договор.docx — скачать' });
    expect(docx).toHaveAttribute('download');
    expect(docx).not.toHaveAttribute('target');
    expect(screen.getByRole('link', { name: 'Счёт — откроется на внешнем сайте' })).toHaveAttribute('target', '_blank');
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('XLSX')).toBeInTheDocument();
    const chatSource = screen.getAllByText(/Заказ .* · чат/)[0].closest('a');
    expect(chatSource?.getAttribute('href')).toContain('order=order-1');
    expect(chatSource?.getAttribute('href')).toContain('chat=1');
    expect(chatSource?.getAttribute('href')).toContain('tab=work');
    const completedSource = screen.getAllByRole('link').find((a) => a.getAttribute('href')?.includes('order=order-2'));
    expect(completedSource?.getAttribute('href')).toContain('tab=completed');
    expect(screen.getByRole('group', { name: 'Фильтры документов' })).toBeEnabled();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Фильтр документов' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Все' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Мои загрузки' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'По датам' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('empty account: CTA to orders and sourcing, no filters', async () => {
    fetchAccountDocuments.mockResolvedValueOnce({ items: [], nextCursor: null });
    render(<AccountDocsPageClient />);

    const toOrders = await screen.findByRole('link', { name: 'Перейти к заказам' });
    expect(toOrders).toHaveAttribute('href', '/account/orders?tab=work');
    expect(screen.getByText(/счета, акты, накладные, договоры и УПД/)).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Фильтры документов' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Заказать подбор' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Заявка на подбор');
  });

  it('human error with a shared retry', async () => {
    fetchAccountDocuments
      .mockRejectedValueOnce(new AccountLoadError('Не удалось загрузить документы. Попробуйте ещё раз.', 500))
      .mockResolvedValueOnce({ items: [doc({ id: 'chat:a' })], nextCursor: null });
    render(<AccountDocsPageClient />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить документы');
    expect(screen.queryByText(/HTTP/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByText('chat:a.pdf')).toBeInTheDocument();
  });

  it('filters and search go to the server; «Показать ещё» appends the next page', async () => {
    fetchAccountDocuments.mockImplementation(async (opts) => {
      const o = (opts ?? {}) as { filter?: string; q?: string; cursor?: string };
      if (o.cursor === 'c2') return { items: [doc({ id: 'chat:page2' })], nextCursor: null };
      if (o.q === 'договор') return { items: [doc({ id: 'chat:found', title: 'Договор.pdf' })], nextCursor: null };
      if (o.filter === 'sourcing') return { items: [], nextCursor: null };
      return { items: [doc({ id: 'chat:page1' })], nextCursor: 'c2' };
    });
    render(<AccountDocsPageClient />);

    fireEvent.click(await screen.findByRole('button', { name: 'Показать ещё' }));
    expect(await screen.findByText('chat:page2.pdf')).toBeInTheDocument();
    expect(screen.getByText('chat:page1.pdf')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Подборы' }));
    expect(await screen.findByText('В этом разделе пока нет документов.')).toBeInTheDocument();
    expect(fetchAccountDocuments).toHaveBeenLastCalledWith(expect.objectContaining({ filter: 'sourcing' }));

    fireEvent.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
    await screen.findByText('chat:page1.pdf');

    fireEvent.change(screen.getByLabelText('Поиск документов по названию'), { target: { value: 'договор' } });
    expect(await screen.findByText('Договор.pdf', {}, { timeout: 2000 })).toBeInTheDocument();
    expect(fetchAccountDocuments).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'договор', filter: 'all' }));
  });

  it('silently refetches on tab focus and on the work feed event, without skeleton or error', async () => {
    fetchAccountDocuments.mockResolvedValueOnce({ items: [doc({ id: 'chat:old' })], nextCursor: null });
    render(<AccountDocsPageClient />);
    await screen.findByText('chat:old.pdf');

    fetchAccountDocuments.mockResolvedValueOnce({
      items: [doc({ id: 'order-doc:new', title: 'Счёт', createdAt: '2026-06-19T10:00:00.000Z' }), doc({ id: 'chat:old' })],
      nextCursor: null,
    });
    await act(async () => {
      window.dispatchEvent(new CustomEvent(ACCOUNT_WORK_FEED_REFRESH_EVENT));
    });
    expect(await screen.findByText('Счёт')).toBeInTheDocument();
    expect(screen.queryByLabelText('Загрузка документов')).not.toBeInTheDocument();

    fetchAccountDocuments.mockRejectedValueOnce(new AccountLoadError('Нет сети', null));
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(fetchAccountDocuments).toHaveBeenCalledTimes(3);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('chat:old.pdf')).toBeInTheDocument();
  });

  it('silent refetch keeps loaded pages and merges new documents on top', async () => {
    fetchAccountDocuments.mockImplementation(async (opts) => {
      const o = (opts ?? {}) as { cursor?: string };
      if (o.cursor === 'c2') return { items: [doc({ id: 'chat:p2', createdAt: '2026-06-10T10:00:00.000Z' })], nextCursor: 'c3' };
      return { items: [doc({ id: 'chat:p1' })], nextCursor: 'c2' };
    });
    render(<AccountDocsPageClient />);
    fireEvent.click(await screen.findByRole('button', { name: 'Показать ещё' }));
    await screen.findByText('chat:p2.pdf');

    fetchAccountDocuments.mockResolvedValueOnce({
      items: [doc({ id: 'chat:fresh', createdAt: '2026-06-19T10:00:00.000Z' }), doc({ id: 'chat:p1' })],
      nextCursor: 'c2',
    });
    await act(async () => {
      window.dispatchEvent(new CustomEvent(ACCOUNT_WORK_FEED_REFRESH_EVENT));
    });

    await screen.findByText('chat:fresh.pdf');
    const titles = screen.getAllByRole('link').map((a) => a.textContent).filter((t) => t?.endsWith('.pdf'));
    expect(titles).toEqual(['chat:fresh.pdf', 'chat:p1.pdf', 'chat:p2.pdf']);
    expect(screen.getByRole('button', { name: 'Показать ещё' })).toBeInTheDocument();
  });

  it('«По заказам» shows server groups with totals and loads the rest of a group', async () => {
    fetchAccountDocuments.mockResolvedValueOnce({ items: [doc({ id: 'chat:a', sourceId: 'o-1' })], nextCursor: null });
    const group = (partial: Partial<AccountDocumentGroup> & { key: string }): AccountDocumentGroup => ({
      source: 'ORDER',
      sourceId: 'o-1',
      sourceStatus: 'PAID',
      total: 1,
      latestAt: '2026-06-18T10:00:00.000Z',
      items: [],
      nextCursor: null,
      ...partial,
    });
    fetchAccountDocumentGroups.mockResolvedValueOnce({
      groups: [
        group({
          key: 'order:o-1',
          total: 7,
          items: [doc({ id: 'chat:a', sourceId: 'o-1' }), doc({ id: 'order-doc:c', source: 'ORDER_DOCUMENT', sourceId: 'o-1' })],
          nextCursor: 'g-c',
        }),
        group({
          key: 'sourcing:s-1',
          source: 'SOURCING',
          sourceId: 's-1',
          sourceStatus: 'CANCELLED',
          items: [doc({ id: 'sourcing:b', source: 'SOURCING_REQUEST', sourceId: 's-1', uploadedBy: 'CUSTOMER' })],
        }),
      ],
      nextCursor: null,
    });
    render(<AccountDocsPageClient />);
    await screen.findByText('chat:a.pdf');

    fireEvent.click(screen.getByRole('button', { name: 'По заказам' }));
    expect(screen.getByRole('button', { name: 'По заказам' })).toHaveAttribute('aria-pressed', 'true');

    await screen.findByText('Приложен к заявке');
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual([expect.stringMatching(/^Заказ /), expect.stringMatching(/^Подбор /)]);
    expect(headings[0].querySelector('a')?.getAttribute('href')).toContain('order=o-1');
    expect(headings[0].querySelector('a')?.getAttribute('href')).toContain('tab=work');
    expect(headings[1].querySelector('a')?.getAttribute('href')).toContain('tab=completed');
    expect(screen.getByText('Документ заказа')).toBeInTheDocument();
    expect(fetchAccountDocumentGroups).toHaveBeenCalledWith(expect.objectContaining({ filter: 'all', q: '' }));

    fetchAccountDocuments
      .mockResolvedValueOnce({
        items: [doc({ id: 'chat:d', sourceId: 'o-1' }), doc({ id: 'chat:e', sourceId: 'o-1' })],
        nextCursor: 'g-e',
      })
      .mockResolvedValueOnce({
        items: [doc({ id: 'chat:f', sourceId: 'o-1' }), doc({ id: 'chat:g', sourceId: 'o-1' }), doc({ id: 'chat:h', sourceId: 'o-1' })],
        nextCursor: null,
      });
    fireEvent.click(screen.getByRole('button', { name: /показать ещё 5 документов/ }));
    expect(await screen.findByText('chat:h.pdf')).toBeInTheDocument();
    expect(fetchAccountDocuments).toHaveBeenCalledWith(expect.objectContaining({ group: 'order:o-1', cursor: 'g-c' }));
    expect(fetchAccountDocuments).toHaveBeenLastCalledWith(expect.objectContaining({ group: 'order:o-1', cursor: 'g-e' }));
    expect(screen.queryByRole('button', { name: /Ещё/ })).not.toBeInTheDocument();
  });
});
