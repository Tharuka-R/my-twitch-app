import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { DataProvider, useData } from './contexts/DataContext';
import SplashScreen from './components/SplashScreen';
import HomePage from './pages/HomePage';
import DailyDataPage from './pages/DailyDataPage';
import MonthlyAnalyticsPage from './pages/MonthlyAnalyticsPage';
import YearlyAnalyticsPage from './pages/YearlyAnalyticsPage';
import type { PageView } from './types';
// Import PageView as a value for use in `useState` etc.
// Note: If PageView is a 'const enum', it's inlined, and this specific value import might change depending on bundler behavior.
// For now, we assume 'types.ts' might use 'enum' or 'const enum'. This covers 'const enum PageViewValue'.
import { PageView as PageViewValue } from './types'; 
import { RoutePath, AppColors } from './constants';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<PageView>(PageViewValue.Splash);
  // setActiveStreamId from useData() is aliased to contextSetActiveStreamId and used in DailyDataPageWrapper.
  // The TS6133 error for 'setActiveStreamId' in App.tsx (line 15 in error log) is likely due to this indirect usage.
  // The primary destructuring happens in DailyDataPageWrapper.

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentView(PageViewValue.Home);
    }, 2000); // Splash screen duration
    return () => clearTimeout(timer);
  }, []);

  if (currentView === PageViewValue.Splash) {
    return <SplashScreen />;
  }
  
  // Wrapper to handle streamId param for DailyDataPage
  const DailyDataPageWrapper = () => {
    const { streamId } = useParams<{ streamId: string }>();
    const navigate = useNavigate();
    const { getStreamLogById, setActiveStreamId: contextSetActiveStreamId } = useData();

    useEffect(() => {
      if (streamId) {
        const log = getStreamLogById(streamId);
        if (log) {
          contextSetActiveStreamId(streamId);
        } else {
          // If streamId is invalid or log not found, redirect to home
          console.warn(`Stream log not found for ID: ${streamId}, redirecting to home.`);
          navigate(RoutePath.Home);
        }
      }
      // Cleanup activeStreamId when navigating away or unmounting
      return () => {
        contextSetActiveStreamId(null);
      };
    }, [streamId, getStreamLogById, contextSetActiveStreamId, navigate]);
    
    return streamId ? <DailyDataPage /> : <Navigate to={RoutePath.Home} replace />;
  };


  return (
    <HashRouter>
      <div className={`min-h-screen bg-${AppColors.background} text-${AppColors.textPrimary} flex flex-col`}>
        {/* Navigation could go here if needed globally, but requirements imply page-specific back buttons */}
        <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
          <Routes>
            <Route path={RoutePath.Home} element={<HomePage />} />
            <Route path={RoutePath.DailyData} element={<DailyDataPageWrapper />} />
            <Route path={RoutePath.MonthlyAnalytics} element={<MonthlyAnalyticsPage />} />
            <Route path={RoutePath.YearlyAnalytics} element={<YearlyAnalyticsPage />} />
            <Route path="*" element={<Navigate to={RoutePath.Home} replace />} />
          </Routes>
        </main>
        <footer className={`bg-slate-800 text-center p-4 text-sm text-${AppColors.textSecondary} border-t border-${AppColors.border}`}>
          Twitch Analytics App &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;