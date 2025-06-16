import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Button, Input, Card, PageTitle } from '../components/common/UIElements';
import { Icons, AppColors, RoutePath } from '../constants'; // createStreamId is not imported here
import type { DailyStreamLog, InitialStreamInfo } from '../types';
import { isValidDate } from '../utils/analyticsHelpers';


const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { createOrUpdateStreamLogHeader, getRecentStreamLogs, setActiveStreamId } = useData();
  const [streamerName, setStreamerName] = useState('DallyVitamin');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [streamTitle, setStreamTitle] = useState('');
  const [errors, setErrors] = useState<Partial<InitialStreamInfo>>({});

  const [recentStreams, setRecentStreams] = useState<DailyStreamLog[]>([]);

  useEffect(() => {
    setRecentStreams(getRecentStreamLogs());
  }, [getRecentStreamLogs]);

  const validateInputs = (): boolean => {
    const newErrors: Partial<InitialStreamInfo> = {};
    if (!streamerName.trim()) newErrors.streamerName = 'Streamer name is required.';
    if (!date) {
      newErrors.date = 'Date is required.';
    } else if (!isValidDate(date)) {
      newErrors.date = 'Date must be in YYYY-MM-DD format.';
    }
    if (!streamTitle.trim()) newErrors.streamTitle = 'Stream title is required.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEnterStreamData = () => {
    if (!validateInputs()) return;

    const streamId = createOrUpdateStreamLogHeader({ streamerName, date, streamTitle });
    setActiveStreamId(streamId); 
    navigate(RoutePath.DailyData.replace(':streamId', streamId));
  };

  const handleRecentStreamClick = (streamId: string) => {
    setActiveStreamId(streamId);
    navigate(RoutePath.DailyData.replace(':streamId', streamId));
  };

  return (
    <div className="space-y-8">
      <PageTitle title="Twitch Analytics Dashboard" icon={<Icons.Home className="w-8 h-8"/>} />

      <Card title="Start New Stream Log" titleIcon={<Icons.PlusCircle className="w-6 h-6"/>}>
        <div className="space-y-4">
          <Input
            label="Streamer Name"
            id="streamerName"
            value={streamerName}
            onChange={(e) => setStreamerName(e.target.value)}
            placeholder="e.g., DallyVitamin"
            error={errors.streamerName}
          />
          <Input
            label="Date"
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
          />
          <Input
            label="Stream Title"
            id="streamTitle"
            value={streamTitle}
            onChange={(e) => setStreamTitle(e.target.value)}
            placeholder="e.g., Chill Vibes & Games"
            error={errors.streamTitle}
          />
          <Button onClick={handleEnterStreamData} className="w-full" size="lg">
            Enter Stream Data
          </Button>
        </div>
      </Card>

      <Card title="Quick Actions" titleIcon={<Icons.ChartBar className="w-6 h-6"/>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={() => navigate(RoutePath.MonthlyAnalytics)} variant="secondary" className="w-full" size="lg">
            Monthly Analytics
          </Button>
          <Button onClick={() => navigate(RoutePath.YearlyAnalytics)} variant="secondary" className="w-full" size="lg">
            Yearly Analytics
          </Button>
        </div>
      </Card>

      <Card title="Recent Stream Logs (Current Month)" titleIcon={<Icons.CalendarDays className="w-6 h-6"/>}>
        {recentStreams.length > 0 ? (
          <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {recentStreams.map((log) => (
              <li
                key={log.id}
                className={`p-4 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer transition-colors duration-150 flex justify-between items-center border border-transparent hover:border-${AppColors.primary}`}
                onClick={() => handleRecentStreamClick(log.id)}
              >
                <div>
                  <p className={`font-semibold text-${AppColors.textPrimary}`}>{log.streamTitle}</p>
                  <p className={`text-sm text-${AppColors.textSecondary}`}>{log.streamerName} - {new Date(log.date).toLocaleDateString()}</p>
                  <p className={`text-xs text-slate-500`}>Activities: {log.activities.length} | Last updated: {new Date(log.lastUpdated).toLocaleTimeString()}</p>
                </div>
                <Icons.Eye className="w-5 h-5 text-slate-400" />
              </li>
            ))}
          </ul>
        ) : (
          <p className={`text-${AppColors.textSecondary} text-center py-4`}>No stream logs found for the current month.</p>
        )}
      </Card>
    </div>
  );
};

export default HomePage;