export interface PdfOverviewStat {
  label: string;
  value: string | number;
  change: string;
  mlInsight: string;
}

export interface PdfRevenuePoint {
  month: string;
  actual: number;
  predicted: number;
  confidence: number;
}

export interface PdfCategoryPerformance {
  category: string;
  sales: number;
  growth: number;
  mlScore: number;
}

export interface PdfTopProductInsight {
  id: number;
  name: string;
  currentSales: number;
  predictedSales: number;
  performanceScore: number;
  trend: 'up' | 'down';
}

export interface PdfAnalyticsAnomaly {
  id: number;
  name: string;
  currentSales: number;
  predictedSales: number;
}

export interface PdfCustomerSegment {
  segment: string;
  count: number;
  percentage: number;
}

export interface PdfAnalyticsDashboard {
  overview: PdfOverviewStat[];
  revenueData: PdfRevenuePoint[];
  categoryPerformance: PdfCategoryPerformance[];
  topProducts: PdfTopProductInsight[];
  anomalies: PdfAnalyticsAnomaly[];
  customerInsights: {
    segmentDistribution: PdfCustomerSegment[];
  };
}

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const PAGE_MARGIN = 42;
const BODY_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const HEADER_MIN_HEIGHT = 92;
const HEADER_BOTTOM_PADDING = 20;

const sanitizeText = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\s+/g, ' ')
    .trim();

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const estimateTextWidth = (text: string, size: number) => text.length * size * 0.52;

const wrapText = (text: string, width: number, size: number) => {
  const clean = sanitizeText(text);
  if (!clean) {
    return [''];
  }

  const words = clean.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (estimateTextWidth(candidate, size) <= width || !currentLine) {
      currentLine = candidate;
      continue;
    }
    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

class PdfPage {
  private commands: string[] = [];

  private convertY(y: number) {
    return PAGE_HEIGHT - y;
  }

  addRaw(command: string) {
    this.commands.push(command);
  }

  setFillColor(r: number, g: number, b: number) {
    this.commands.push(`${r} ${g} ${b} rg`);
  }

  setStrokeColor(r: number, g: number, b: number) {
    this.commands.push(`${r} ${g} ${b} RG`);
  }

  setLineWidth(width: number) {
    this.commands.push(`${width} w`);
  }

  drawRect(x: number, y: number, width: number, height: number, fill = false) {
    const pdfY = this.convertY(y + height);
    this.commands.push(`${x.toFixed(2)} ${pdfY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re ${fill ? 'f' : 'S'}`);
  }

  drawLine(x1: number, y1: number, x2: number, y2: number) {
    this.commands.push(`${x1.toFixed(2)} ${this.convertY(y1).toFixed(2)} m ${x2.toFixed(2)} ${this.convertY(y2).toFixed(2)} l S`);
  }

  drawText(text: string, x: number, y: number, size: number, color = '0 0 0', font = 'F1') {
    const safe = sanitizeText(text);
    this.commands.push(`BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x.toFixed(2)} ${this.convertY(y).toFixed(2)} Tm (${safe}) Tj ET`);
  }

  drawWrappedText(text: string, x: number, y: number, width: number, size: number, lineHeight: number, color = '0 0 0', font = 'F1') {
    const lines = wrapText(text, width, size);
    lines.forEach((line, index) => {
      this.drawText(line, x, y + index * lineHeight, size, color, font);
    });
    return lines.length * lineHeight;
  }

  content() {
    return `${this.commands.join('\n')}\n`;
  }
}

class PdfDocument {
  private pages: PdfPage[] = [];

  addPage() {
    const page = new PdfPage();
    this.pages.push(page);
    return page;
  }

  toBlob() {
    const pageCount = this.pages.length;
    const fontRegularId = 3 + pageCount * 2;
    const fontBoldId = fontRegularId + 1;
    const objects: string[] = new Array(fontBoldId);

    objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[1] = `<< /Type /Pages /Kids [${this.pages
      .map((_, index) => `${4 + index * 2} 0 R`)
      .join(' ')}] /Count ${pageCount} >>`;

    this.pages.forEach((page, index) => {
      const contentId = 3 + index * 2;
      const pageId = contentId + 1;
      const stream = page.content();

      objects[contentId - 1] = `<< /Length ${stream.length} >>\nstream\n${stream}endstream`;
      objects[pageId - 1] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
        `/Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> ` +
        `/Contents ${contentId} 0 R >>`;
    });

    objects[fontRegularId - 1] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
    objects[fontBoldId - 1] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

    let pdf = '%PDF-1.4\n';
    const offsets = [0];

    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    offsets.slice(1).forEach((offset) => {
      pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new Blob([pdf], { type: 'application/pdf' });
  }
}

const addExecutiveHeader = (page: PdfPage, title: string, subtitle: string) => {
  const subtitleY = PAGE_MARGIN + 80;
  const subtitleLineHeight = 13;
  const subtitleLines = wrapText(subtitle, BODY_WIDTH - 40, 10);
  const subtitleHeight = subtitleLines.length * subtitleLineHeight;
  const headerHeight = Math.max(
    HEADER_MIN_HEIGHT,
    subtitleY - PAGE_MARGIN + subtitleHeight + HEADER_BOTTOM_PADDING
  );

  page.setFillColor(15 / 255, 23 / 255, 42 / 255);
  page.drawRect(PAGE_MARGIN, PAGE_MARGIN, BODY_WIDTH, headerHeight, true);
  page.drawText('EShop ML Analytics Report', PAGE_MARGIN + 20, PAGE_MARGIN + 30, 24, '1 1 1', 'F2');
  page.drawText(title, PAGE_MARGIN + 20, PAGE_MARGIN + 58, 17, '0.83 0.95 0.98', 'F2');
  page.drawWrappedText(subtitle, PAGE_MARGIN + 20, subtitleY, BODY_WIDTH - 40, 10, subtitleLineHeight, '0.86 0.89 0.94');

  return PAGE_MARGIN + headerHeight;
};

const getSummaryCardHeight = (stat: PdfOverviewStat, width: number) => {
  const insightLines = wrapText(stat.mlInsight, width - 28, 9);
  return Math.max(96, 84 + insightLines.length * 12 + 10);
};

const drawSummaryCard = (page: PdfPage, x: number, y: number, width: number, stat: PdfOverviewStat) => {
  const cardHeight = getSummaryCardHeight(stat, width);
  page.setFillColor(248 / 255, 250 / 255, 252 / 255);
  page.drawRect(x, y, width, cardHeight, true);
  page.setStrokeColor(226 / 255, 232 / 255, 240 / 255);
  page.setLineWidth(1);
  page.drawRect(x, y, width, cardHeight, false);
  page.drawText(stat.label, x + 14, y + 22, 11, '0.4 0.47 0.56', 'F2');
  page.drawText(String(stat.value), x + 14, y + 48, 18, '0.06 0.09 0.16', 'F2');
  page.drawText(stat.change, x + 14, y + 68, 10, '0.03 0.58 0.44', 'F2');
  page.drawWrappedText(stat.mlInsight, x + 14, y + 84, width - 28, 9, 12, '0.37 0.45 0.55');
  return cardHeight;
};

const drawRevenueChart = (page: PdfPage, data: PdfRevenuePoint[], x: number, y: number, width: number, height: number) => {
  const chartBottom = y + height;
  const chartTop = y + 24;
  const innerWidth = width - 56;
  const maxValue = Math.max(...data.flatMap((point) => [point.actual, point.predicted]), 1);
  const columnSpace = innerWidth / Math.max(data.length, 1);
  const groupWidth = Math.min(34, columnSpace - 10);
  const barWidth = Math.max(8, (groupWidth - 8) / 2);

  page.setFillColor(255 / 255, 255 / 255, 255 / 255);
  page.drawRect(x, y, width, height, true);
  page.setStrokeColor(226 / 255, 232 / 255, 240 / 255);
  page.drawRect(x, y, width, height, false);

  for (let row = 0; row < 4; row += 1) {
    const rowY = chartTop + ((height - 56) / 3) * row;
    page.setStrokeColor(226 / 255, 232 / 255, 240 / 255);
    page.drawLine(x + 34, rowY, x + width - 16, rowY);
  }

  data.forEach((point, index) => {
    const baseX = x + 40 + columnSpace * index + (columnSpace - groupWidth) / 2;
    const actualHeight = ((point.actual / maxValue) * (height - 60));
    const predictedHeight = ((point.predicted / maxValue) * (height - 60));

    page.setFillColor(15 / 255, 23 / 255, 42 / 255);
    page.drawRect(baseX, chartBottom - actualHeight - 20, barWidth, actualHeight, true);
    page.setFillColor(249 / 255, 115 / 255, 22 / 255);
    page.drawRect(baseX + barWidth + 8, chartBottom - predictedHeight - 20, barWidth, predictedHeight, true);
    page.drawText(point.month, baseX - 2, chartBottom - 4, 8, '0.4 0.47 0.56');
  });

  page.drawText('Actual', x + 40, y + height + 18, 9, '0.06 0.09 0.16', 'F2');
  page.setFillColor(15 / 255, 23 / 255, 42 / 255);
  page.drawRect(x + 18, y + height + 10, 12, 8, true);
  page.drawText('Predicted', x + 138, y + height + 18, 9, '0.4 0.3 0.12', 'F2');
  page.setFillColor(249 / 255, 115 / 255, 22 / 255);
  page.drawRect(x + 110, y + height + 10, 12, 8, true);

  return height + 18;
};

const drawCategoryBars = (page: PdfPage, categories: PdfCategoryPerformance[], x: number, y: number, width: number) => {
  const maxSales = Math.max(...categories.map((item) => item.sales), 1);
  let cursorY = y;

  categories.slice(0, 6).forEach((category) => {
    page.drawText(category.category, x, cursorY, 11, '0.06 0.09 0.16', 'F2');
    page.drawText(`${formatCurrency(category.sales)} | ML ${category.mlScore}/100`, x + width - 145, cursorY, 9, '0.37 0.45 0.55');

    page.setFillColor(226 / 255, 232 / 255, 240 / 255);
    page.drawRect(x, cursorY + 8, width, 10, true);
    page.setFillColor(15 / 255, 23 / 255, 42 / 255);
    page.drawRect(x, cursorY + 8, Math.max(16, (category.sales / maxSales) * width), 10, true);

    page.setFillColor(249 / 255, 115 / 255, 22 / 255);
    page.drawRect(x, cursorY + 22, Math.max(16, (category.mlScore / 100) * width), 8, true);
    page.drawText(`Growth ${category.growth}%`, x, cursorY + 40, 8, '0.37 0.45 0.55');
    cursorY += 56;
  });

  return Math.max(0, cursorY - y);
};

const drawSimpleTable = (
  page: PdfPage,
  x: number,
  y: number,
  widths: number[],
  headers: string[],
  rows: string[][],
) => {
  let cursorY = y;
  const rowHeight = 24;
  const totalWidth = widths.reduce((sum, width) => sum + width, 0);

  page.setFillColor(15 / 255, 23 / 255, 42 / 255);
  page.drawRect(x, cursorY, totalWidth, rowHeight, true);

  let headerX = x + 8;
  headers.forEach((header, index) => {
    page.drawText(header, headerX, cursorY + 16, 9, '1 1 1', 'F2');
    headerX += widths[index];
  });
  cursorY += rowHeight;

  rows.forEach((row, rowIndex) => {
    page.setFillColor(rowIndex % 2 === 0 ? 248 / 255 : 255 / 255, 250 / 255, 252 / 255);
    page.drawRect(x, cursorY, totalWidth, rowHeight, true);
    page.setStrokeColor(226 / 255, 232 / 255, 240 / 255);
    page.drawRect(x, cursorY, totalWidth, rowHeight, false);

    let cellX = x + 8;
    row.forEach((cell, index) => {
      page.drawText(cell, cellX, cursorY + 16, 8.5, '0.06 0.09 0.16');
      cellX += widths[index];
    });
    cursorY += rowHeight;
  });

  return cursorY - y;
};

const drawSegmentBars = (page: PdfPage, segments: PdfCustomerSegment[], x: number, y: number, width: number) => {
  let cursorY = y;
  segments.slice(0, 6).forEach((segment) => {
    page.drawText(segment.segment, x, cursorY, 11, '0.06 0.09 0.16', 'F2');
    page.drawText(`${segment.count} customers`, x + width - 110, cursorY, 9, '0.37 0.45 0.55');
    page.setFillColor(226 / 255, 232 / 255, 240 / 255);
    page.drawRect(x, cursorY + 8, width, 10, true);
    page.setFillColor(34 / 255, 211 / 255, 238 / 255);
    page.drawRect(x, cursorY + 8, Math.max(16, (segment.percentage / 100) * width), 10, true);
    page.drawText(`${segment.percentage}% of current mix`, x, cursorY + 34, 8, '0.37 0.45 0.55');
    cursorY += 48;
  });

  return Math.max(0, cursorY - y);
};

export const downloadAnalyticsPdf = (dashboard: PdfAnalyticsDashboard) => {
  const pdfDocument = new PdfDocument();

  const cover = pdfDocument.addPage();
  const coverHeaderBottom = addExecutiveHeader(
    cover,
    'Executive machine learning overview',
    'This report packages the latest forecasting, product-quality, anomaly, and customer-mix signals into a stakeholder-ready briefing.'
  );
  const coverIntroY = coverHeaderBottom + 26;
  cover.drawText('Executive summary', PAGE_MARGIN, coverIntroY, 18, '0.06 0.09 0.16', 'F2');
  cover.drawWrappedText(
    'EShop analytics currently blends explainable machine-learning style heuristics with live store activity so leadership can tie predictions directly to catalog health, demand, and customer behavior.',
    PAGE_MARGIN,
    coverIntroY + 24,
    BODY_WIDTH,
    11,
    15,
    '0.37 0.45 0.55'
  );

  const cardWidth = (BODY_WIDTH - 18) / 2;
  const cardStartY = coverIntroY + 84;
  const overviewCards = dashboard.overview.slice(0, 4);
  const firstRowCards = overviewCards.slice(0, 2);
  const secondRowCards = overviewCards.slice(2, 4);
  const firstRowHeight = Math.max(...firstRowCards.map((stat) => getSummaryCardHeight(stat, cardWidth)), 96);
  const secondRowY = cardStartY + firstRowHeight + 22;
  const secondRowHeight = Math.max(...secondRowCards.map((stat) => getSummaryCardHeight(stat, cardWidth)), 0);

  firstRowCards.forEach((stat, index) => {
    const cardX = PAGE_MARGIN + index * (cardWidth + 18);
    drawSummaryCard(cover, cardX, cardStartY, cardWidth, stat);
  });

  secondRowCards.forEach((stat, index) => {
    const cardX = PAGE_MARGIN + index * (cardWidth + 18);
    drawSummaryCard(cover, cardX, secondRowY, cardWidth, stat);
  });

  const revenuePoint = dashboard.revenueData[dashboard.revenueData.length - 1];
  const strongestCategory = [...dashboard.categoryPerformance].sort((left, right) => right.mlScore - left.mlScore)[0];
  const topProduct = dashboard.topProducts[0];
  const anomalyCount = dashboard.anomalies.length;

  const leadershipY = secondRowCards.length > 0 ? secondRowY + secondRowHeight + 28 : cardStartY + firstRowHeight + 28;
  cover.drawText('Key messages for leadership', PAGE_MARGIN, leadershipY, 18, '0.06 0.09 0.16', 'F2');
  const executiveBullets = [
    `Forecasted next revenue: ${revenuePoint ? formatCurrency(revenuePoint.predicted) : '$0'} with ${revenuePoint ? formatPercent(revenuePoint.confidence) : '0%'} confidence.`,
    `Best category signal: ${strongestCategory ? strongestCategory.category : 'No category'} at ${strongestCategory ? strongestCategory.mlScore : 0}/100.`,
    `Top product signal: ${topProduct ? topProduct.name : 'No product'} with a score of ${topProduct ? topProduct.performanceScore.toFixed(1) : '0.0'}.`,
    `Anomaly watchlist: ${anomalyCount} product${anomalyCount === 1 ? '' : 's'} need closer pricing or merchandising review.`,
  ];
  let bulletCursorY = leadershipY + 34;
  executiveBullets.forEach((bullet) => {
    cover.setFillColor(15 / 255, 23 / 255, 42 / 255);
    cover.drawRect(PAGE_MARGIN, bulletCursorY, 6, 6, true);
    const bulletHeight = cover.drawWrappedText(
      bullet,
      PAGE_MARGIN + 16,
      bulletCursorY + 6,
      BODY_WIDTH - 16,
      10,
      13,
      '0.25 0.32 0.4'
    );
    bulletCursorY += Math.max(24, bulletHeight) + 12;
  });

  const forecastPage = pdfDocument.addPage();
  const forecastHeaderBottom = addExecutiveHeader(
    forecastPage,
    'Revenue forecasting and catalog quality',
    'These visuals help leadership compare actual trading against projected performance, while also surfacing the categories with the strongest quality and growth signals.'
  );
  const forecastRevenueTitleY = forecastHeaderBottom + 26;
  forecastPage.drawText('Actual versus predicted revenue', PAGE_MARGIN, forecastRevenueTitleY, 16, '0.06 0.09 0.16', 'F2');
  const revenueChartY = forecastRevenueTitleY + 22;
  const revenueChartHeight = drawRevenueChart(
    forecastPage,
    dashboard.revenueData.slice(0, 6),
    PAGE_MARGIN,
    revenueChartY,
    BODY_WIDTH,
    260
  );

  const forecastCategoryTitleY = revenueChartY + revenueChartHeight + 40;
  forecastPage.drawText('Category performance snapshot', PAGE_MARGIN, forecastCategoryTitleY, 16, '0.06 0.09 0.16', 'F2');
  drawCategoryBars(forecastPage, dashboard.categoryPerformance, PAGE_MARGIN, forecastCategoryTitleY + 28, BODY_WIDTH);

  const operationsPage = pdfDocument.addPage();
  const operationsHeaderBottom = addExecutiveHeader(
    operationsPage,
    'Product opportunities, risk signals, and customer mix',
    'The final section turns model outputs into operational decisions by showing the products to back, the anomalies to investigate, and the customer segments that deserve attention.'
  );
  const operationsTopProductsY = operationsHeaderBottom + 26;
  operationsPage.drawText('Top products', PAGE_MARGIN, operationsTopProductsY, 16, '0.06 0.09 0.16', 'F2');
  const topProductsTableHeight = drawSimpleTable(
    operationsPage,
    PAGE_MARGIN,
    operationsTopProductsY + 24,
    [180, 90, 90, 80, 60],
    ['Product', 'Current', 'Predicted', 'Score', 'Trend'],
    dashboard.topProducts.slice(0, 5).map((item) => [
      item.name,
      String(item.currentSales),
      String(item.predictedSales),
      item.performanceScore.toFixed(1),
      item.trend,
    ])
  );

  const operationsAnomaliesY = operationsTopProductsY + 24 + topProductsTableHeight + 28;
  operationsPage.drawText('Demand anomalies', PAGE_MARGIN, operationsAnomaliesY, 16, '0.06 0.09 0.16', 'F2');
  const anomaliesTableHeight = drawSimpleTable(
    operationsPage,
    PAGE_MARGIN,
    operationsAnomaliesY + 24,
    [220, 110, 110, 70],
    ['Product', 'Current', 'Predicted', 'Gap'],
    dashboard.anomalies.slice(0, 5).map((item) => [
      item.name,
      String(item.currentSales),
      String(item.predictedSales),
      String(item.predictedSales - item.currentSales),
    ])
  );

  const operationsSegmentsY = operationsAnomaliesY + 24 + anomaliesTableHeight + 28;
  operationsPage.drawText('Customer segment distribution', PAGE_MARGIN, operationsSegmentsY, 16, '0.06 0.09 0.16', 'F2');
  drawSegmentBars(operationsPage, dashboard.customerInsights.segmentDistribution, PAGE_MARGIN, operationsSegmentsY + 28, BODY_WIDTH);

  const blob = pdfDocument.toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `eshop-analytics-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
};
