import { SITE_LOGO_SRC, SITE_NAME } from '@/lib/brand';
import {
  formatPartnerRubWhole,
  formatPartnerTableDate,
  partnerLineOrderLabel,
  sumPartnerLinesBonusRub,
  type PartnerProgramBonusLineApi,
} from '@/lib/referrals/partnerProgramSummary';
import type { PartnerReportPeriod } from '@/lib/account/partnerReportPeriod';

export type PartnerTeamPdfPayload = {
  period: PartnerReportPeriod;
  l1Lines: PartnerProgramBonusLineApi[];
  l2Lines: PartnerProgramBonusLineApi[];
  exportedAt?: Date;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rowsL1(lines: PartnerProgramBonusLineApi[]): string {
  if (!lines.length) {
    return `<tr><td colspan="5" style="padding:10px 8px;color:#9d9d9d">Нет начислений за период</td></tr>`;
  }
  return lines
    .map(
      (row) => `<tr>
      <td>${escapeHtml(formatPartnerTableDate(row.orderUpdatedAt))}</td>
      <td>${escapeHtml(partnerLineOrderLabel(row))}</td>
      <td style="text-align:right">${escapeHtml(formatPartnerRubWhole(row.catalogTotalRub))}</td>
      <td style="text-align:center">${row.percentApplied}%</td>
      <td style="text-align:right">${escapeHtml(formatPartnerRubWhole(row.bonusRub))}</td>
    </tr>`,
    )
    .join('');
}

function rowsL2(lines: PartnerProgramBonusLineApi[]): string {
  if (!lines.length) {
    return `<tr><td colspan="6" style="padding:10px 8px;color:#9d9d9d">Нет начислений за период</td></tr>`;
  }
  return lines
    .map((row) => {
      const name = row.purchaserName?.trim() || 'Дизайнер';
      return `<tr>
      <td>${escapeHtml(formatPartnerTableDate(row.orderUpdatedAt))}</td>
      <td>${escapeHtml(name)}<div style="color:#9d9d9d;font-size:10px;margin-top:2px">${escapeHtml(partnerLineOrderLabel(row))}</div></td>
      <td style="text-align:center">L${row.tier}</td>
      <td style="text-align:right">${escapeHtml(formatPartnerRubWhole(row.catalogTotalRub))}</td>
      <td style="text-align:center">${row.percentApplied}%</td>
      <td style="text-align:right">${escapeHtml(formatPartnerRubWhole(row.bonusRub))}</td>
    </tr>`;
    })
    .join('');
}

function buildReportHtml(payload: PartnerTeamPdfPayload): string {
  const exportedAt = payload.exportedAt ?? new Date();
  const exportedLabel = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(exportedAt);
  const logoAbs =
    typeof window !== 'undefined' ? new URL(SITE_LOGO_SRC, window.location.origin).href : SITE_LOGO_SRC;
  const l1Total = formatPartnerRubWhole(sumPartnerLinesBonusRub(payload.l1Lines));
  const l2Total = formatPartnerRubWhole(sumPartnerLinesBonusRub(payload.l2Lines));

  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 32px 36px 40px;
    width: 794px;
    background: #fff;
    color: #1d1c1b;
    font-family: Commissioner, "Segoe UI", Arial, sans-serif;
    font-size: 12px;
    line-height: 1.35;
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e6e6e6;
    margin-bottom: 24px;
  }
  .logo-wrap { display: flex; flex-direction: column; gap: 6px; }
  .logo { height: 28px; width: auto; display: block; }
  .wordmark {
    font-size: 22px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin: 0;
  }
  .meta { text-align: right; color: #9d9d9d; font-size: 11px; }
  .meta strong { display: block; color: #1d1c1b; font-size: 14px; font-weight: 500; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
  h1 {
    margin: 0 0 6px;
    font-size: 22px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }
  .period { margin: 0 0 28px; color: #9d9d9d; font-size: 13px; }
  .block { margin-bottom: 28px; }
  .block-title {
    margin: 0 0 4px;
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
  }
  .block-total {
    margin: 0 0 12px;
    font-size: 20px;
    font-weight: 500;
  }
  table { width: 100%; border-collapse: collapse; }
  th, td {
    padding: 8px 6px;
    border-bottom: 1px solid #ececec;
    vertical-align: top;
    font-weight: 300;
  }
  th {
    text-align: left;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #9d9d9d;
    font-weight: 400;
    border-bottom-color: #d9d9d9;
  }
  .foot {
    margin-top: 32px;
    padding-top: 12px;
    border-top: 1px solid #e6e6e6;
    color: #9d9d9d;
    font-size: 10px;
  }
</style></head><body>
  <div class="head">
    <div class="logo-wrap">
      <p class="wordmark">${escapeHtml(SITE_NAME)}</p>
      <img class="logo" src="${escapeHtml(logoAbs)}" alt="" />
    </div>
    <div class="meta">
      <strong>Отчёт по команде</strong>
      Сформировано: ${escapeHtml(exportedLabel)}
    </div>
  </div>
  <h1>Партнёрская программа</h1>
  <p class="period">Период: ${escapeHtml(payload.period.label)}</p>

  <section class="block">
    <h2 class="block-title">Доход от прямых рефералов (L1)</h2>
    <p class="block-total">${escapeHtml(l1Total)}</p>
    <table>
      <thead>
        <tr>
          <th>Дата</th>
          <th>№ заказа</th>
          <th style="text-align:right">Оборот</th>
          <th style="text-align:center">%</th>
          <th style="text-align:right">Вознаграждение</th>
        </tr>
      </thead>
      <tbody>${rowsL1(payload.l1Lines)}</tbody>
    </table>
  </section>

  <section class="block">
    <h2 class="block-title">Доход от команды (L2)</h2>
    <p class="block-total">${escapeHtml(l2Total)}</p>
    <table>
      <thead>
        <tr>
          <th>Дата</th>
          <th>Дизайнер</th>
          <th style="text-align:center">Уровень</th>
          <th style="text-align:right">Оборот</th>
          <th style="text-align:center">%</th>
          <th style="text-align:right">Вознаграждение</th>
        </tr>
      </thead>
      <tbody>${rowsL2(payload.l2Lines)}</tbody>
    </table>
  </section>

  <p class="foot">${escapeHtml(SITE_NAME)} · конфиденциально · только для лидера команды</p>
</body></html>`;
}

function fileNameForPeriod(period: PartnerReportPeriod): string {
  const stamp = toDateInputValueSafe(new Date());
  const slug = period.label
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `wupapa-team-${slug || 'report'}-${stamp}.pdf`;
}

function toDateInputValueSafe(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Клиентский фирменный PDF (L1+L2) по выбранному периоду. */
export async function downloadPartnerTeamPdf(payload: PartnerTeamPdfPayload): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText =
    'position:fixed;left:-10000px;top:0;width:794px;background:#fff;z-index:-1;pointer-events:none';
  host.innerHTML = buildReportHtml(payload);
  document.body.appendChild(host);

  try {
    const canvas = await html2canvas(host, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,
    });
    const img = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let heightLeft = imgH;
    let position = 0;
    pdf.addImage(img, 'JPEG', 0, position, imgW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      position -= pageH;
      pdf.addPage();
      pdf.addImage(img, 'JPEG', 0, position, imgW, imgH);
      heightLeft -= pageH;
    }
    pdf.save(fileNameForPeriod(payload.period));
  } finally {
    host.remove();
  }
}
