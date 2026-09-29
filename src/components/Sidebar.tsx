import React from 'react';
import {
  Activity,
  FileText,
  Layers,
  Shield,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'inspection' | 'challan' | 'scenarios';
  setActiveTab: (tab: 'inspection' | 'challan' | 'scenarios') => void;
  hasViolation: boolean;
  violationCount: number;
  potentialCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  hasViolation,
  violationCount,
  potentialCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'inspection' as const,
      label: 'Vision Inspection',
      subtitle: 'Camera & Photo',
      icon: Activity,
      badge: violationCount > 0 ? `${violationCount}` : null,
      badgeType: 'danger' as const,
    },
    {
      id: 'scenarios' as const,
      label: 'Benchmark Suite',
      subtitle: 'Calibrated Test Cases',
      icon: Layers,
    },
    {
      id: 'challan' as const,
      label: 'Challan & Notice Hub',
      subtitle: 'Enforcement & Verification',
      icon: FileText,
      badge: violationCount > 0 ? `${violationCount} New` : null,
      badgeType: 'danger' as const,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-[#1C1917]/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#FAF8F4] border-r border-[#E2DDD3] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-[#E2DDD3] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0D9488]/15 border border-[#0D9488]/30 flex items-center justify-center text-[#0D9488]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-[#1C1917] tracking-wider uppercase">
                  MOOS VISION
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              </div>
              <p className="text-[10px] font-mono text-[#857F75] tracking-tight">
                LIGHTWEIGHT SAFETY DETECTOR
              </p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1 text-[#857F75] hover:text-[#1C1917] lg:hidden rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#857F75]">
            Surveillance Console
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center justify-between group ${
                  isActive
                    ? 'bg-[#EBE6DC] text-[#1C1917] font-semibold shadow-xs'
                    : 'text-[#57534E] hover:bg-[#F4F1EA] hover:text-[#1C1917]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#0D9488]' : 'text-[#857F75] group-hover:text-[#1C1917]'
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-xs font-medium tracking-tight truncate">{item.label}</div>
                    <div className="text-[10px] font-mono text-[#857F75] truncate">
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${
                      item.badgeType === 'danger'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-[#EBE6DC] text-[#57534E]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Audit Status */}
        <div className="p-4 border-t border-[#E2DDD3] bg-[#FAF8F4]">
          <div className="p-3 rounded-xl bg-white border border-[#E2DDD3] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#857F75]">MODE</span>
              <span className="text-[#0D9488] font-bold">
                LIGHTWEIGHT
              </span>
            </div>
            <div className="text-[11px] text-[#57534E] font-mono">
              CAMERA & PHOTO INSPECTION
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
