import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import type { AggregatedSummary } from '../types';
import { SubTier } from '../types'; // SubTier is an enum, used as a value
import { Button, Select, Card, PageTitle } from '../components/common/UIElements';
import { Icons, AppColors, RoutePath } from '../constants';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generateAggregatedReportPDF } from '../utils/analyticsHelpers';

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

const YearlyAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { getYearlySummary, getAvailableYears } = useData();
  
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [summary, setSummary] = useState<AggregatedSummary | null>(null);
  
  const availableYears = getAvailableYears();

   useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
        setSelectedYear(availableYears[0]);
    } else if (availableYears.length === 0 && selectedYear !== new Date().getFullYear()){
         setSelectedYear(new Date().getFullYear()); // Default to current year if no data years
    }
  }, [availableYears, selectedYear]);

  useEffect(() => {
    if (selectedYear) {
      const currentSummary = getYearlySummary(selectedYear);
      setSummary(currentSummary);
    } else {
      setSummary(null);
    }
  }, [selectedYear, getYearlySummary]);

  const handleDownloadPdf = () => {
    if (summary) {
      generateAggregatedReportPDF(summary, `Yearly Report - ${summary.period}`);
    }
  };

  const renderSummaryDetails = (data: AggregatedSummary) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        {[
            {label: "Total Subs", value: data.subs[SubTier.Tier1] + data.subs[SubTier.Tier2] + data.subs[SubTier.Tier3]},
            {label: "Total Gift Subs", value: data.giftSubs[SubTier.Tier1] + data.giftSubs[SubTier.Tier2] + data.giftSubs[SubTier.Tier3]},
            {label: "Prime Subs", value: data.primeSubs},
            {label: "Donations (USD)", value: `$${data.donations.toFixed(2)}`}
        ].map(item => (
            <div key={item.label} className={`p-4 bg-slate-700 rounded-lg shadow`}>
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="text-2xl font-bold text-green-400">{item.value}</p>
            </div>
        ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <PageTitle 
        title="Yearly Analytics" 
        icon={<Icons.CalendarDays className="w-8 h-8"/>}
        actions={<Button onClick={() => navigate(RoutePath.Home)} variant="ghost" leftIcon={<Icons.Home className="w-4 h-4"/>}>Back to Home</Button>}
      />

      <Card>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select label="Year" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
             {availableYears.length > 0 ? 
                availableYears.map(year => <option key={year} value={year}>{year}</option>) : 
                <option value={new Date().getFullYear()}>{new Date().getFullYear()} (No Data Yet)</option>
            }
          </Select>
        </div>
         {summary && (
             <Button onClick={handleDownloadPdf} variant="ghost" size="sm" leftIcon={<Icons.ArrowDownTray className="w-4 h-4"/>} className="mb-4">
                Download PDF Report
            </Button>
        )}
      </Card>

      {summary ? (
        <>
          <Card title={`Summary for ${summary.period}`} titleIcon={<Icons.InformationCircle className="w-6 h-6"/>}>
            {renderSummaryDetails(summary)}
          </Card>
          
          <Card title="Monthly Trends (Total Subs & Donations)" titleIcon={<Icons.ChartBar className="w-6 h-6"/>}>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={summary.chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={AppColors.border} />
                <XAxis dataKey="name" stroke={AppColors.textSecondary} />
                <YAxis yAxisId="left" stroke={CHART_COLORS[0]} />
                <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS[2]} />
                <Tooltip 
                    contentStyle={{ backgroundColor: AppColors.cardBackground, border: `1px solid ${AppColors.border}`}} 
                    labelStyle={{ color: AppColors.textPrimary }}
                />
                <Legend wrapperStyle={{ color: AppColors.textSecondary }} />
                <Line yAxisId="left" type="monotone" dataKey="totalSubs" name="Total Subscriptions" stroke={CHART_COLORS[0]} strokeWidth={2} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="totalDonations" name="Total Donations (USD)" stroke={CHART_COLORS[2]} strokeWidth={2} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

           <Card title="Monthly Gift Sub Trends" titleIcon={<Icons.ChartBar className="w-6 h-6"/>}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summary.chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={AppColors.border} />
                <XAxis dataKey="name" stroke={AppColors.textSecondary} />
                <YAxis stroke={AppColors.textSecondary} />
                <Tooltip 
                     contentStyle={{ backgroundColor: AppColors.cardBackground, border: `1px solid ${AppColors.border}`}} 
                     labelStyle={{ color: AppColors.textPrimary }}
                />
                <Legend wrapperStyle={{ color: AppColors.textSecondary }} />
                <Bar dataKey="totalGiftSubs" name="Total Gifted Subs" fill={CHART_COLORS[1]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

        </>
      ) : (
         <Card>
          <p className={`text-${AppColors.textSecondary} text-center py-6`}>No data available for the selected year. Please select another year or add data.</p>
        </Card>
      )}
    </div>
  );
};

export default YearlyAnalyticsPage;