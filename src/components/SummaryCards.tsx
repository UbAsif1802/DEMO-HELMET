import React, { useState } from 'react';
import { TrafficSummary, QualityCheck, FinalAssessment } from '../types/helmet';
import {
  Users,
  ShieldAlert,
  AlertTriangle,
  Car,
  ShieldCheck,
  HelpCircle,
  AlertOctagon,
  ArrowUpRight,
} from 'lucide-react';

interface SummaryCardsProps {
  summary: TrafficSummary;
  qualityCheck?: QualityCheck;
  finalAssessment?: FinalAssessment;
  isLoading: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  summary,
  qualityCheck,
  finalAssessment,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-[#FAF8F4] border border-[#E2DDD3] rounded-xl p-4 animate-pulse"
          >
            <div className="h-3 bg-[#EBE6DC] rounded w-2/3 mb-3"></div>
            <div className="h-7 bg-[#EBE6DC] rounded w-1/2 mb-2"></div>
            <div className="h-2 bg-[#EBE6DC] rounded w-4/5"></div>
          </div>
        ))}
      </div>
    );
  }

  const hasConfirmedViolations = (finalAssessment?.confirmed_violations ?? 0) > 0;
  const hasPotentialIssues = (finalAssessment?.potential_issues ?? 0) > 0;

  return (
    <div className="space-y-4 mb-6">
      {/* Quality Check Alert */}
      {qualityCheck && !qualityCheck.is_usable && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-3 shadow-xs">
          <AlertOctagon className="w-5 h-5 text-amber-700 shrink-0" />
          <div className="flex-1">
            <span className="font-bold block">Quality Assessment Advisory:</span>
            <span>
              {qualityCheck.message ||
                'Optical conditions are suboptimal for automated legal enforcement.'}
            </span>
          </div>
        </div>
      )}

      {/* Main KPI Strip - Horizontal snap carousel on mobile, grid on tablets/desktop */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 snap-x no-scrollbar">
        {/* 1. Confirmed Violations */}
        <div
          className={`border rounded-xl p-3 sm:p-3.5 transition-all shadow-xs shrink-0 w-[155px] sm:w-auto snap-start ${
            hasConfirmedViolations
              ? 'bg-rose-50/80 border-rose-300 text-rose-950'
              : 'bg-[#FAF8F4] border-[#E2DDD3] text-[#1C1917]'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#57534E]">
              Confirmed Infractions
            </span>
            <ShieldAlert
              className={`w-4 h-4 ${hasConfirmedViolations ? 'text-rose-700' : 'text-[#857F75]'}`}
            />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight">
            {finalAssessment?.confirmed_violations ?? summary.no_helmet + summary.triple_riding}
          </div>
          <div className="text-[11px] text-[#57534E] mt-1 font-mono">
            {hasConfirmedViolations ? 'Immediate citation warrant' : 'Zero violations confirmed'}
          </div>
        </div>

        {/* 2. Potential / Review Required */}
        <div
          className={`border rounded-xl p-3 sm:p-3.5 transition-all shadow-xs shrink-0 w-[155px] sm:w-auto snap-start ${
            hasPotentialIssues
              ? 'bg-amber-50/80 border-amber-300 text-amber-950'
              : 'bg-[#FAF8F4] border-[#E2DDD3] text-[#1C1917]'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#57534E]">
              Officer Review
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${hasPotentialIssues ? 'text-amber-700' : 'text-[#857F75]'}`}
            />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight">
            {finalAssessment?.potential_issues ??
              summary.seatbelt_issues + summary.occupancy_issues}
          </div>
          <div className="text-[11px] text-[#57534E] mt-1 font-mono">
            {hasPotentialIssues ? 'Manual audit queued' : 'No review flags'}
          </div>
        </div>

        {/* 3. Total Riders Monitored */}
        <div className="bg-[#FAF8F4] border border-[#E2DDD3] rounded-xl p-3 sm:p-3.5 shadow-xs shrink-0 w-[155px] sm:w-auto snap-start">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#57534E]">
              Two-Wheeler Riders
            </span>
            <Users className="w-4 h-4 text-[#857F75]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#1C1917] tracking-tight">
            {summary.total_riders}
          </div>
          <div className="text-[11px] text-[#57534E] mt-1 font-mono">
            {summary.wearing_helmet} compliant helmets
          </div>
        </div>

        {/* 4. Excessive Occupancy */}
        <div className="bg-[#FAF8F4] border border-[#E2DDD3] rounded-xl p-3 sm:p-3.5 shadow-xs shrink-0 w-[155px] sm:w-auto snap-start">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#57534E]">
              Triple Riding
            </span>
            <Users className="w-4 h-4 text-[#857F75]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#1C1917] tracking-tight">
            {summary.triple_riding}
          </div>
          <div className="text-[11px] text-[#57534E] mt-1 font-mono">
            Chassis overload detections
          </div>
        </div>

        {/* 5. Passenger Vehicles */}
        <div className="bg-[#FAF8F4] border border-[#E2DDD3] rounded-xl p-3 sm:p-3.5 shadow-xs shrink-0 w-[155px] sm:w-auto snap-start">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#57534E]">
              Vehicles / Cars
            </span>
            <Car className="w-4 h-4 text-[#857F75]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#1C1917] tracking-tight">
            {summary.cars_detected}
          </div>
          <div className="text-[11px] text-[#57534E] mt-1 font-mono">
            {summary.seatbelt_issues > 0 ? `${summary.seatbelt_issues} seatbelt flags` : 'Clear cabin'}
          </div>
        </div>

        {/* 6. Corridor Safety Rate */}
        <div className="bg-[#FAF8F4] border border-[#E2DDD3] rounded-xl p-3 sm:p-3.5 shadow-xs shrink-0 w-[155px] sm:w-auto snap-start">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#57534E]">
              Compliance Rate
            </span>
            <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#0D9488] tracking-tight">
            {summary.total_riders > 0
              ? `${Math.round((summary.wearing_helmet / summary.total_riders) * 100)}%`
              : '100%'}
          </div>
          <div className="text-[11px] text-[#57534E] mt-1 font-mono">
            Helmet compliance index
          </div>
        </div>
      </div>
    </div>
  );
};
