import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate }  from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import type { DailyStreamLog, StreamActivityPayload } from '../types';
import { SubTier } from '../types'; // SubTier is an enum, used as a value
import { Button, Input, Select, Card, Modal, PageTitle } from '../components/common/UIElements';
import { Icons, AppColors, RoutePath } from '../constants';
import { generateDailyReportPDF } from '../utils/analyticsHelpers';

type ActivityType = 'sub' | 'gift_sub' | 'donation' | 'prime_sub';

const DailyDataPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeStreamId, getStreamLogById, addActivityToLog } = useData();
  
  const [currentLog, setCurrentLog] = useState<DailyStreamLog | null>(null);
  
  const [activityType, setActivityType] = useState<ActivityType>('sub');
  const [username, setUsername] = useState('');
  const [tier, setTier] = useState<SubTier>(SubTier.Tier1);
  const [count, setCount] = useState<number | string>(1);
  const [amount, setAmount] = useState<number | string>('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isUnsavedWarningOpen, setIsUnsavedWarningOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (activeStreamId) {
      const log = getStreamLogById(activeStreamId);
      if (log) {
        setCurrentLog(log);
      } else {
        navigate(RoutePath.Home);
      }
    } else {
       navigate(RoutePath.Home);
    }
  }, [activeStreamId, getStreamLogById, navigate]);


  const resetForm = () => {
    setUsername('');
    setTier(SubTier.Tier1);
    setCount(1);
    setAmount('');
    setFormError(null);
    setHasUnsavedChanges(false);
  };

  const handleInputChange = () => {
    setHasUnsavedChanges(true);
  };
  
  const handleAddActivity = () => {
    if (!currentLog) return;
    if (!username.trim()) {
      setFormError('Username is required.');
      return;
    }

    let activityToAdd: StreamActivityPayload | null = null;
    const numCount = Number(count);
    const numAmount = Number(amount);

    switch (activityType) {
      case 'sub':
        if (numCount <= 0 || !Number.isInteger(numCount)) { setFormError('Sub count must be a positive integer.'); return; }
        activityToAdd = { type: 'sub', username: username.trim(), tier, count: numCount };
        break;
      case 'gift_sub':
        if (numCount <= 0 || !Number.isInteger(numCount)) { setFormError('Gift sub count must be a positive integer.'); return; }
        activityToAdd = { type: 'gift_sub', username: username.trim(), tier, count: numCount };
        break;
      case 'donation':
        if (numAmount <= 0) { setFormError('Donation amount must be positive.'); return; }
        activityToAdd = { type: 'donation', username: username.trim(), amount: numAmount };
        break;
      case 'prime_sub':
        activityToAdd = { type: 'prime_sub', username: username.trim() };
        break;
    }

    if (activityToAdd) {
      addActivityToLog(currentLog.id, activityToAdd);
      resetForm();
    }
  };

  const handleNavigateHome = () => {
    if (hasUnsavedChanges) {
      setIsUnsavedWarningOpen(true);
    } else {
      navigate(RoutePath.Home);
    }
  };

  const confirmNavigateHome = () => {
    setIsUnsavedWarningOpen(false);
    navigate(RoutePath.Home);
  };
  
  const sortedActivities = useMemo(() => {
    if (!currentLog) return [];
    return [...currentLog.activities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [currentLog]);


  if (!currentLog) {
    return <div className="text-center py-10">Loading stream data or stream not found...</div>;
  }

  const handleDownloadPdf = () => {
    if (currentLog) {
      generateDailyReportPDF(currentLog);
    }
  };

  return (
    <div className="space-y-8">
      <PageTitle 
        title={`Log for: ${currentLog.streamTitle}`} 
        icon={<Icons.Tv className="w-8 h-8"/>}
        actions={<Button onClick={handleNavigateHome} variant="ghost" leftIcon={<Icons.Home className="w-4 h-4"/>}>Back to Home</Button>}
      />
      <p className={`text-${AppColors.textSecondary}`}>Streamer: {currentLog.streamerName} | Date: {new Date(currentLog.date).toLocaleDateString()}</p>
      
      <Card title="Add New Activity" titleIcon={<Icons.PlusCircle className="w-6 h-6"/>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <Select label="Activity Type" value={activityType} onChange={(e) => { setActivityType(e.target.value as ActivityType); handleInputChange(); }}>
            <option value="sub">Subscription</option>
            <option value="gift_sub">Gift Sub</option>
            <option value="donation">Donation</option>
            <option value="prime_sub">Prime Sub</option>
          </Select>
          <Input label="Username" value={username} onChange={(e) => {setUsername(e.target.value); handleInputChange();}} placeholder="Enter username" />

          {(activityType === 'sub' || activityType === 'gift_sub') && (
            <>
              <Select label="Tier" value={tier} onChange={(e) => {setTier(e.target.value as SubTier); handleInputChange();}}>
                {Object.values(SubTier).map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
              <Input label="Count" type="number" min="1" step="1" value={count} onChange={(e) => {setCount(e.target.value); handleInputChange();}} />
            </>
          )}

          {activityType === 'donation' && (
            <Input label="Amount (USD)" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => {setAmount(e.target.value); handleInputChange();}} />
          )}
        </div>
        {formError && <p className="mt-3 text-sm text-red-500">{formError}</p>}
        <Button onClick={handleAddActivity} className="mt-6 w-full md:w-auto" leftIcon={<Icons.PlusCircle className="w-5 h-5"/>}>
          Add Activity
        </Button>
      </Card>

      <Card title="Activity Log" titleIcon={<Icons.CalendarDays className="w-6 h-6"/>}>
        <div className="mb-4 flex justify-end">
           <Button onClick={handleDownloadPdf} variant="ghost" size="sm" leftIcon={<Icons.ArrowDownTray className="w-4 h-4"/>}>
            Download PDF
          </Button>
        </div>
        {sortedActivities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className={`text-xs text-slate-400 uppercase bg-slate-700`}>
                <tr>
                  <th scope="col" className="px-4 py-3">Time</th>
                  <th scope="col" className="px-4 py-3">Type</th>
                  <th scope="col" className="px-4 py-3">User</th>
                  <th scope="col" className="px-4 py-3">Details</th>
                  <th scope="col" className="px-4 py-3">Amount/Count</th>
                </tr>
              </thead>
              <tbody>
                {sortedActivities.map((activity) => (
                  <tr key={activity.id} className={`border-b border-${AppColors.border} hover:bg-slate-750`}>
                    <td className="px-4 py-3">{new Date(activity.timestamp).toLocaleTimeString()}</td>
                    <td className="px-4 py-3 font-medium">{activity.type.replace('_', ' ')}</td>
                    <td className="px-4 py-3">{activity.username}</td>
                    <td className="px-4 py-3">
                      {activity.type === 'sub' || activity.type === 'gift_sub' ? `Tier: ${activity.tier}` : ''}
                      {activity.type === 'prime_sub' ? 'Amazon Prime' : ''}
                    </td>
                    <td className="px-4 py-3">
                      {activity.type === 'sub' || activity.type === 'gift_sub' ? activity.count : ''}
                      {activity.type === 'donation' ? `$${activity.amount.toFixed(2)}` : ''}
                      {activity.type === 'prime_sub' ? 1 : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={`text-${AppColors.textSecondary} text-center py-4`}>No activities logged for this stream yet.</p>
        )}
      </Card>

      <Modal
        isOpen={isUnsavedWarningOpen}
        onClose={() => setIsUnsavedWarningOpen(false)}
        title="Unsaved Changes"
        onConfirm={confirmNavigateHome}
        confirmText="Leave Page"
      >
        <div className="flex items-start">
            <Icons.ExclamationTriangle className="w-12 h-12 text-yellow-400 mr-3 shrink-0" />
            <p>You have unsaved changes in the activity form. Are you sure you want to leave this page? Your current input will be lost.</p>
        </div>
      </Modal>
    </div>
  );
};

export default DailyDataPage;