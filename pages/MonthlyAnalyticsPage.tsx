import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import type { AggregatedSummary } from '../types';
import { SubTier } from '../types'; // SubTier is an enum, used as a value
import { Button, Select, Card, PageTitle } from '../components/common/UIElements';
import { Icons, AppColors, RoutePath } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { generateAggregatedReportPDF } from '../utils/analyticsHelpers';


const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

const MonthlyAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { getMonthlySummary, getAvailableYears, getAvailableMonths } = useData();
  
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-indexed
  const [summary, setSummary] = useState<AggregatedSummary | null>(null);

  const availableYears = getAvailableYears();
  const availableMonths = getAvailableMonths(selectedYear);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
        setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  useEffect(() => {
    // Ensure selectedMonth is valid for the selectedYear
    const currentYearMonths = getAvailableMonths(selectedYear);
    if (currentYearMonths.length > 0) {
        if (!currentYearMonths.find(m => m.month === selectedMonth)) {
            setSelectedMonth(currentYearMonths[0].month);
        }
    } else {
        // If no months available for selected year, clear summary
        setSelectedMonth(-1); // Or some indicator for no valid month
    }
  }, [selectedYear, selectedMonth, getAvailableMonths]);


  useEffect(() => {
    if (selectedYear && selectedMonth !== -1) {
        const currentSummary = getMonthlySummary(selectedYear, selectedMonth);
        setSummary(currentSummary);
    } else {
        setSummary(null);
    }
  }, [selectedYear, selectedMonth, getMonthlySummary]);

  const handleDownloadPdf = () => {
    if (summary) {
      generateAggregatedReportPDF(summary, `Monthly Report - ${summary.period}`);
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
                <p className="text-2xl font-bold text-purple-400">{item.value}</p>
            </div>
        ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <PageTitle 
        title="Monthly Analytics" 
        icon={<Icons.CalendarDays className="w-8 h-8"/>}
        actions={<Button onClick={() => navigate(RoutePath.Home)} variant="ghost" leftIcon={<Icons.Home className="w-4 h-4"/>}>Back to Home</Button>}
      />

      <Card>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select label="Year" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {availableYears.length > 0 ? availableYears.map(year => <option key={year} value={year}>{year}</option>) : <option>No data</option>}
          </Select>
          <Select label="Month" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
            {availableMonths.length > 0 ? 
                availableMonths.map(month => <option key={month.month} value={month.month}>{month.name}</option>) : 
                <option value="-1">No data for this year</option>
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
          
          <Card title="Subscription Breakdown" titleIcon={<Icons.ChartBar className="w-6 h-6"/>}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summary.chartData.filter(d => d.name !== 'Donations Value')} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={AppColors.border} />
                <XAxis dataKey="name" stroke={AppColors.textSecondary} />
                <YAxis stroke={AppColors.textSecondary} />
                <Tooltip 
                    contentStyle={{ backgroundColor: AppColors.cardBackground, border: `1px solid ${AppColors.border}`}} 
                    labelStyle={{ color: AppColors.textPrimary }}
                />
                <Legend wrapperStyle={{ color: AppColors.textSecondary }} />
                <Bar dataKey="subs" name="Regular Subs" fill={CHART_COLORS[0]} />
                <Bar dataKey="giftSubs" name="Gifted Subs" fill={CHART_COLORS[1]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

           <Card title="Revenue Sources (Example Pie Chart)" titleIcon={<Icons.ChartBar className="w-6 h-6"/>}>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={[
                                { name: 'Tier 1 Subs', value: summary.subs[SubTier.Tier1] * 5 }, // Example values
                                { name: 'Tier 2 Subs', value: summary.subs[SubTier.Tier2] * 10 },
                                { name: 'Tier 3 Subs', value: summary.subs[SubTier.Tier3] * 25 },
                                { name: 'Donations', value: summary.donations },
                            ].filter(item => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {CHART_COLORS.map((color, index) => (
                                <Cell key={`cell-${index}`} fill={color} />
                            ))}
                        </Pie>
                        <Tooltip  contentStyle={{ backgroundColor: AppColors.cardBackground, border: `1px solid ${AppColors.border}`}} />
                        <Legend wrapperStyle={{ color: AppColors.textSecondary }}/>
                    </PieChart>
                </ResponsiveContainer>
            </Card>

        </>
      ) : (
        <Card>
          <p className={`text-${AppColors.textSecondary} text-center py-6`}>No data available for the selected month and year. Please select another period or add data.</p>
        </Card>
      )}
    </div>
  );
};

export default MonthlyAnalyticsPage;