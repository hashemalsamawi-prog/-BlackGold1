import React from 'react';
import { Smartphone, X, Wifi, Battery, Signal } from 'lucide-react';

interface AndroidSimulatorWrapperProps {
  deviceMode: 'web' | 'android';
  onToggleDeviceMode: () => void;
  children: React.ReactNode;
}

export const AndroidSimulatorWrapper: React.FC<AndroidSimulatorWrapperProps> = ({
  deviceMode,
  onToggleDeviceMode,
  children
}) => {
  if (deviceMode === 'web') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-2 sm:p-6 flex flex-col items-center justify-center">
      
      {/* Top Banner Notice for Simulator */}
      <div className="mb-4 bg-slate-900 border border-amber-500/40 px-4 py-2 rounded-xl text-xs text-amber-300 font-bold flex items-center gap-3">
        <Smartphone className="w-4 h-4 text-amber-400" />
        <span>محاكي تطبيق أندرويد (Black Gold Android Flutter App)</span>
        <button
          onClick={onToggleDeviceMode}
          className="bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg text-[11px] font-black hover:bg-amber-400"
        >
          العودة للويب Full Screen
        </button>
      </div>

      {/* Phone Hardware Frame */}
      <div className="w-full max-w-[410px] h-[840px] bg-[#18181F] rounded-[48px] p-3 border-[6px] border-[#2A2A35] shadow-2xl shadow-amber-500/10 relative flex flex-col overflow-hidden">
        
        {/* Camera Punchhole & Status Bar */}
        <div className="bg-[#0A0A0C] text-slate-300 px-6 py-2 text-[11px] font-bold flex items-center justify-between border-b border-slate-800 rounded-t-[36px] z-20">
          <span>09:41</span>
          
          {/* Camera Notch */}
          <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-800" />

          <div className="flex items-center gap-1.5 text-slate-400">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>

        {/* Scrollable Screen Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#0A0A0C] rounded-b-[36px] relative">
          {children}
        </div>

        {/* Android Bottom Navigation Pill */}
        <div className="bg-[#0A0A0C] py-2 flex justify-center z-20">
          <div className="w-32 h-1 bg-slate-600 rounded-full" />
        </div>

      </div>

    </div>
  );
};
