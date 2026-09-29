import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  FileCode,
  CheckCircle2,
  FileText,
  Code2,
  Activity,
  Layers,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'inspection' | 'json' | 'scenarios' | 'citation' | 'api';
  setActiveTab: (tab: 'inspection' | 'json' | 'scenarios' | 'citation' | 'api') => void;
  hasViolation: boolean;
  hasPotentialIssue?: boolean;
  totalIssues?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  hasViolation,
  hasPotentialIssue,
  totalIssues = 0,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Main Title & Subtitle */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold text-sm">
                TS
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-lg font-bold text-white tracking-tight">
                    AI Traffic Safety Analyzer
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                    AI Analysis Ready
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visual traffic-safety analysis powered by Gemini
                </p>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {totalIssues > 0 ? (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                  hasViolation
                    ? 'bg-rose-950/60 border-rose-700/80 text-rose-300'
                    : 'bg-amber-950/60 border-amber-700/80 text-amber-300'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>
                  {hasViolation ? 'Violations Detected' : 'Potential Issues'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>No Confirmed Violations</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-3.5 overflow-x-auto pb-1 border-t border-slate-800/80 pt-2 text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('inspection')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'inspection'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Safety Dashboard
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'json'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Structured JSON
          </button>

          <button
            onClick={() => setActiveTab('scenarios')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'scenarios'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Benchmark Scenarios
          </button>

          <button
            onClick={() => setActiveTab('citation')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'citation'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Infraction Notice
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'api'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            API Spec
          </button>
        </div>
      </div>
    </header>
  );
};
