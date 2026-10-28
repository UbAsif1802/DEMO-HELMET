import React from 'react';
import { Activity, Layers, FileText, Camera, UploadCloud } from 'lucide-react';

interface FlutterMobileNavProps {
  activeTab: 'inspection' | 'challan' | 'scenarios';
  setActiveTab: (tab: 'inspection' | 'challan' | 'scenarios') => void;
  onCameraClick: () => void;
  onUploadClick: () => void;
  violationCount: number;
}

/**
 * Flutter-inspired Mobile Bottom Navigation Bar & Floating Action Button (FAB)
 * Replicates Flutter's Scaffold.bottomNavigationBar with Center-Docked FloatingActionButton:
 * - Flutter Material 3 NavigationBar styling
 * - Smooth haptic-like active pill indicators
 * - Docked/Elevated Center Action Button for instant camera capture
 * - Badge indicators for municipal enforcement alerts
 */
export const FlutterMobileNav: React.FC<FlutterMobileNavProps> = ({
  activeTab,
  setActiveTab,
  onCameraClick,
  onUploadClick,
  violationCount,
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 select-none pb-safe">
      {/* Background with Flutter Material elevation blur */}
      <div className="relative bg-[#FAF8F4]/95 backdrop-blur-md border-t border-[#E2DDD3] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-3 pt-1.5 pb-2">
        <div className="max-w-md mx-auto flex items-center justify-between relative">
          {/* Tab 1: Vision Inspection (Flutter NavigationDestination) */}
          <button
            onClick={() => setActiveTab('inspection')}
            className="flex-1 flex flex-col items-center justify-center py-1 transition-all group"
            aria-label="Vision Inspection Tab"
          >
            <div
              className={`px-4 py-1 rounded-full transition-all flex items-center justify-center ${
                activeTab === 'inspection'
                  ? 'bg-[#0D9488]/15 text-[#0D9488] scale-105'
                  : 'text-[#857F75] group-hover:text-[#1C1917]'
              }`}
            >
              <Activity className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span
              className={`text-[10px] mt-0.5 tracking-tight font-medium transition-colors ${
                activeTab === 'inspection'
                  ? 'text-[#0D9488] font-bold'
                  : 'text-[#857F75]'
              }`}
            >
              Inspect
            </span>
          </button>

          {/* Tab 2: Benchmark Suite */}
          <button
            onClick={() => setActiveTab('scenarios')}
            className="flex-1 flex flex-col items-center justify-center py-1 transition-all group"
            aria-label="Benchmark Scenarios Tab"
          >
            <div
              className={`px-4 py-1 rounded-full transition-all flex items-center justify-center ${
                activeTab === 'scenarios'
                  ? 'bg-[#0D9488]/15 text-[#0D9488] scale-105'
                  : 'text-[#857F75] group-hover:text-[#1C1917]'
              }`}
            >
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span
              className={`text-[10px] mt-0.5 tracking-tight font-medium transition-colors ${
                activeTab === 'scenarios'
                  ? 'text-[#0D9488] font-bold'
                  : 'text-[#857F75]'
              }`}
            >
              Benchmarks
            </span>
          </button>

          {/* CENTER DOCKED FLOATING ACTION BUTTON (Flutter FloatingActionButton.extended / centered) */}
          <div className="flex-none px-2 -mt-6">
            <button
              onClick={onCameraClick}
              className="relative w-13 h-13 rounded-2xl bg-[#0D9488] hover:bg-[#0f766e] active:scale-95 text-white shadow-lg shadow-[#0D9488]/30 flex flex-col items-center justify-center border-2 border-white transition-transform"
              title="Snap Instant Camera Photo"
              aria-label="Capture with Camera"
            >
              <Camera className="w-6 h-6 stroke-[2.4]" />
              <span className="sr-only">Take Photo</span>
            </button>
          </div>

          {/* Tab 3: Upload Photo Drawer Trigger */}
          <button
            onClick={onUploadClick}
            className="flex-1 flex flex-col items-center justify-center py-1 transition-all group"
            aria-label="Upload Photo"
          >
            <div className="px-4 py-1 rounded-full text-[#857F75] group-hover:text-[#1C1917] transition-all flex items-center justify-center">
              <UploadCloud className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium text-[#857F75]">
              Upload
            </span>
          </button>

          {/* Tab 4: Challan Hub with Badge */}
          <button
            onClick={() => setActiveTab('challan')}
            className="flex-1 flex flex-col items-center justify-center py-1 transition-all group relative"
            aria-label="Challan & Notice Hub Tab"
          >
            <div
              className={`px-4 py-1 rounded-full transition-all flex items-center justify-center relative ${
                activeTab === 'challan'
                  ? 'bg-rose-100 text-rose-800 scale-105'
                  : 'text-[#857F75] group-hover:text-[#1C1917]'
              }`}
            >
              <FileText className="w-5 h-5 stroke-[2.2]" />
              {violationCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[16px] h-4 rounded-full bg-rose-600 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                  {violationCount}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] mt-0.5 tracking-tight font-medium transition-colors ${
                activeTab === 'challan' ? 'text-rose-800 font-bold' : 'text-[#857F75]'
              }`}
            >
              Challan
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
