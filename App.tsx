import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { DataProvider, useData } from './contexts/DataContext';
import SplashScreen from './components/SplashScreen';
import HomePage from './pages/HomePage';
import DailyDataPage from './pages/DailyDataPage';
import MonthlyAnalyticsPage from './pages/MonthlyAnalyticsPage';
import YearlyAnalyticsPage from './pages/YearlyAnalyticsPage';
import type { PageView } from './types';
import { PageView as PageViewValue } from './types'; // Import PageView as a value for use in `useState` etc.
import { RoutePath, AppColors } from './constants';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<PageView>(PageViewValue.Splash);
  // setActiveStreamId is not directly used in AppContent, it's used within DailyDataPageWrapper via its own useData() call

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
    
    // Render DailyDataPage only if streamId is valid and log exists (checked by useEffect redirect)
    // The actual rendering logic of DailyDataPage will use activeStreamId from context
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