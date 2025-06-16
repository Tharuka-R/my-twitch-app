import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; // Import autoTable as a function
import type { DailyStreamLog, AggregatedSummary } from '../types';
import { SubTier } from '../types'; // SubTier is an enum, used as a value

// The declare module 'jspdf' is no longer needed if we call autoTable directly.

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export const generateDailyReportPDF = (log: DailyStreamLog): void => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(`Daily Stream Report - ${log.date}`, 14, 22);
  doc.setFontSize(12);
  doc.text(`Streamer: ${log.streamerName}`, 14, 30);
  doc.text(`Title: ${log.streamTitle}`, 14, 36);
  doc.text(`Last Updated: ${new Date(log.lastUpdated).toLocaleString()}`, 14, 42);

  const tableColumn = ["Time", "Type", "User", "Details", "Amount/Count"];
  const tableRows: any[][] = [];

  log.activities
    .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .forEach(activity => {
      const time = new Date(activity.timestamp).toLocaleTimeString();
      let type = '';
      let details = '';
      let amountCount = '';

      switch (activity.type) {
        case 'sub':
          type = 'Subscription';
          details = `Tier: ${activity.tier}`;
          amountCount = `Count: ${activity.count}`;
          break;
        case 'gift_sub':
          type = 'Gift Sub';
          details = `Tier: ${activity.tier}`;
          amountCount = `Count: ${activity.count}`;
          break;
        case 'donation':
          type = 'Donation';
          details = `Amount (USD)`;
          amountCount = formatCurrency(activity.amount);
          break;
        case 'prime_sub':
          type = 'Prime Sub';
          details = `Amazon Prime`;
          amountCount = `Count: 1`;
          break;
      }
      tableRows.push([time, type, activity.username, details, amountCount]);
  });

  autoTable(doc, { // Call autoTable as a function
    startY: 50,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [62, 28, 108] }, // Purple
  });
  
  doc.save(`daily_report_${log.streamerName}_${log.date}.pdf`);
};

export const generateAggregatedReportPDF = (summary: AggregatedSummary, reportTitle: string): void => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(reportTitle, 14, 22);
  doc.setFontSize(12);
  doc.text(`Period: ${summary.period}`, 14, 30);
  
  const summaryData = [
    ['Category', SubTier.Tier1, SubTier.Tier2, SubTier.Tier3, 'Total'],
    [
      'Subscriptions', 
      summary.subs[SubTier.Tier1], 
      summary.subs[SubTier.Tier2], 
      summary.subs[SubTier.Tier3],
      summary.subs[SubTier.Tier1] + summary.subs[SubTier.Tier2] + summary.subs[SubTier.Tier3]
    ],
    [
      'Gifted Subs', 
      summary.giftSubs[SubTier.Tier1], 
      summary.giftSubs[SubTier.Tier2], 
      summary.giftSubs[SubTier.Tier3],
      summary.giftSubs[SubTier.Tier1] + summary.giftSubs[SubTier.Tier2] + summary.giftSubs[SubTier.Tier3]
    ],
    ['Prime Subs', '-', '-', '-', summary.primeSubs],
    ['Donations (USD)', '-', '-', '-', formatCurrency(summary.donations)],
  ];

  autoTable(doc, { // Call autoTable as a function
    startY: 40,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [62, 28, 108] }, // Purple
  });

  // Get final Y position after the first table
  let finalY = (doc as any).lastAutoTable.finalY || 40; // Fallback if lastAutoTable is not set

  const chartSectionY = finalY + 15;
  doc.setFontSize(14);
  doc.text('Charts', 14, chartSectionY);
  doc.setFontSize(10);
  doc.text('Chart data is available in the application. For PDF, please refer to the web view or screenshot.', 14, chartSectionY + 8);
  
  if (summary.chartData && summary.chartData.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text("Chart Data Table", 14, 20);
      let chartTableHead: string[] = [];
      let chartTableBody: any[][] = [];

      if (summary.chartData[0]?.totalSubs !== undefined) { // Yearly summary type chart data
        chartTableHead = ["Month", "Total Subs", "Total Gift Subs", "Total Donations (USD)"];
        chartTableBody = summary.chartData.map(d => [d.name, d.totalSubs, d.totalGiftSubs, formatCurrency(d.totalDonations)]);
      } else if (summary.chartData[0]?.subs !== undefined) { // Monthly summary type chart data
        chartTableHead = ["Category", "Subscriptions", "Gifted Subs"];
         chartTableBody = summary.chartData.map(d => {
            if (d.name === 'Donations Value') return [d.name, formatCurrency(d.subs), '-']; // Special handling for donation value
            return [d.name, d.subs, d.giftSubs];
        });
      }

      if(chartTableHead.length > 0) {
        autoTable(doc, { // Call autoTable as a function
            startY: 30,
            head: [chartTableHead],
            body: chartTableBody,
            theme: 'striped',
            headStyles: { fillColor: [62, 28, 108] },
        });
      }
  }

  doc.save(`${reportTitle.toLowerCase().replace(/\s+/g, '_')}_${summary.period}.pdf`);
};

// Example chart data preparation (can be expanded)
export const prepareSubsChartData = (summary: AggregatedSummary) => {
  return [
    { name: SubTier.Tier1, value: summary.subs[SubTier.Tier1] },
    { name: SubTier.Tier2, value: summary.subs[SubTier.Tier2] },
    { name: SubTier.Tier3, value: summary.subs[SubTier.Tier3] },
    { name: 'Prime', value: summary.primeSubs },
  ];
};

export const prepareGiftSubsChartData = (summary: AggregatedSummary) => {
  return [
    { name: SubTier.Tier1, value: summary.giftSubs[SubTier.Tier1] },
    { name: SubTier.Tier2, value: summary.giftSubs[SubTier.Tier2] },
    { name: SubTier.Tier3, value: summary.giftSubs[SubTier.Tier3] },
  ];
};

export const isValidDate = (dateString: string): boolean => {
  const regEx = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regEx)) return false; // Invalid format
  const d = new Date(dateString);
  const dNum = d.getTime();
  if (!dNum && dNum !== 0) return false; // NaN value, Invalid date
  return d.toISOString().slice(0, 10) === dateString;
};