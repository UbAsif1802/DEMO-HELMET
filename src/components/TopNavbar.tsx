import React, { useState, useEffect } from 'react';
import {
  Menu,
  UploadCloud,
  FileText,
  Camera,
  Download,
} from 'lucide-react';

interface TopNavbarProps {
  activeTab: 'inspection' | 'challan' | 'scenarios';
  onOpenMobileMenu: () => void;
  onUploadClick: () => void;
  onCameraClick?: () => void;
  onAnalyzeClick: () => void;
  onGenerateCitationClick: () => void;
  onExportBatchCSV?: () => void;
  isLoading: boolean;
  hasViolation: boolean;
  activeScenarioTitle?: string;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  onOpenMobileMenu,
  onUploadClick,
  onCameraClick,
  onAnalyzeClick,
  onGenerateCitationClick,
  onExportBatchCSV,
  isLoading,
  hasViolation,
  activeScenarioTitle,
}) => {
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'inspection':
        return activeScenarioTitle || 'Optical Vision Inspector';
      case 'scenarios':
        return 'Ground-Truth Benchmark Suite';
      case 'challan':
        return 'Challan & Notice Hub · Officer Verification';
      default:
        return 'Moos Vision Inspector';
    }
  };

  return (
    <header className="h-16 bg-[#FAF8F4] border-b border-[#E2DDD3] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile trigger & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-[#57534E] hover:text-[#1C1917] hover:bg-[#EBE6DC] rounded-lg lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-bold text-xs sm:text-sm text-[#1C1917] tracking-tight">
            {getBreadcrumbTitle()}
          </span>
          <span className="hidden md:inline-block text-[11px] font-mono text-[#857F75] px-2 py-0.5 rounded bg-[#EBE6DC]">
            {timeString}
          </span>
        </div>
      </div>

      {/* Right: Primary Fast Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Fast Action 1: Live Camera Snapshot */}
        {onCameraClick && (
          <button
            onClick={onCameraClick}
            disabled={isLoading}
            className="px-3 py-2 bg-white hover:bg-[#EBE6DC] border border-[#CDC5B5] text-[#1C1917] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
            title="Snap photo with device camera"
          >
            <Camera className="w-3.5 h-3.5 text-[#0D9488]" />
            <span className="hidden sm:inline">Camera</span>
          </button>
        )}

        {/* Fast Action 2: Upload / Drag & Drop Photo */}
        <button
          onClick={onUploadClick}
          disabled={isLoading}
          className="px-3.5 py-2 bg-[#EBE6DC] hover:bg-[#E2DDD3] text-[#1C1917] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
        >
          <UploadCloud className="w-3.5 h-3.5 text-[#57534E]" />
          <span>Upload Photo</span>
        </button>

        {/* Fast Action 3: Export CSV */}
        {onExportBatchCSV && (
          <button
            onClick={onExportBatchCSV}
            className="p-2 bg-white hover:bg-[#EBE6DC] border border-[#CDC5B5] text-[#1C1917] rounded-xl text-xs font-medium transition-colors"
            title="Export CSV Audit"
          >
            <Download className="w-3.5 h-3.5 text-[#57534E]" />
          </button>
        )}

        {/* Fast Action 4: Generate Citation */}
        {hasViolation && (
          <button
            onClick={onGenerateCitationClick}
            className="px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Issue Challan</span>
          </button>
        )}
      </div>
    </header>
  );
};
