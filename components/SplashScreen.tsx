import React from 'react';
import { Icons, AppColors } from '../constants';

// onAnimationEnd was handled by App.tsx's timer for simplicity.
// This component is purely presentational during that time.
// useEffect is not needed here.
const SplashScreen: React.FC = () => {
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-${AppColors.primary} to-${AppColors.secondary} text-white`}>
      <div className="animate-bounce"> {/* Simple animation */}
        <Icons.Tv className="w-24 h-24 md:w-32 md:h-32 text-purple-300" />
      </div>
      <h1 className="mt-6 text-3xl md:text-5xl font-bold tracking-tight">Twitch Analytics</h1>
      <p className="mt-2 text-lg md:text-xl text-purple-200">Loading your dashboard...</p>
    </div>
  );
};

export default SplashScreen;