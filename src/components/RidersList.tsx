import React from 'react';
import { RiderDetection, HelmetStatus } from '../types/helmet';
import { ShieldAlert, ShieldCheck, HelpCircle, Bike, User, FileText, ChevronRight } from 'lucide-react';

interface RidersListProps {
  riders: RiderDetection[];
  selectedRiderId: number | null;
  onSelectRider: (riderId: number | null) => void;
  onGenerateCitation?: (rider: RiderDetection) => void;
}

export const RidersList: React.FC<RidersListProps> = ({
  riders,
  selectedRiderId,
  onSelectRider,
  onGenerateCitation,
}) => {
  if (riders.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <Bike className="w-10 h-10 mx-auto text-slate-600 mb-2" />
        <p className="text-sm font-medium text-slate-300">No riders detected in frame</p>
        <p className="text-xs text-slate-400 mt-1">
          When motorcycle or scooter riders appear in the surveillance capture, they will be listed here.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: HelmetStatus) => {
    switch (status) {
      case 'NO_HELMET':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950/80 border border-rose-700/80 text-rose-300">
            <ShieldAlert className="w-3.5 h-3.5" />
            NO_HELMET (VIOLATION)
          </span>
        );
      case 'WEARING_HELMET':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/80 border border-emerald-700/80 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            WEARING_HELMET
          </span>
        );
      case 'UNCERTAIN':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950/80 border border-amber-700/80 text-amber-300">
            <HelpCircle className="w-3.5 h-3.5" />
            UNCERTAIN
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span>Target Classification Breakdown</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-400 font-mono">
            {riders.length} {riders.length === 1 ? 'Target' : 'Targets'}
          </span>
        </h3>
        <span className="text-xs text-slate-400">Strict Single-Count Enforcement</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {riders.map((rider) => {
          const isSelected = selectedRiderId === rider.rider_id;
          const isViolation = rider.helmet_status === 'NO_HELMET';

          return (
            <div
              key={rider.rider_id}
              onClick={() => onSelectRider(isSelected ? null : rider.rider_id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg'
                  : isViolation
                  ? 'bg-slate-900/90 border-rose-900/60 hover:border-rose-700/80'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-1 rounded text-xs border border-slate-700">
                    RIDER #{rider.rider_id}
                  </span>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-slate-800 text-indigo-300 border border-slate-700 uppercase">
                    <Bike className="w-3.5 h-3.5" />
                    {rider.vehicle_type}
                  </span>

                  {rider.role && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-800/60 text-slate-400 border border-slate-700/60 capitalize">
                      <User className="w-3 h-3" />
                      {rider.role}
                    </span>
                  )}

                  {getStatusBadge(rider.helmet_status)}
                </div>

                {/* Confidence Meter */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400 font-mono">Confidence:</span>
                  <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isViolation
                          ? 'bg-rose-500'
                          : rider.helmet_status === 'WEARING_HELMET'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.round(rider.confidence * 100)}%` }}
                    ></div>
                  </div>
                  <span className="font-mono text-xs font-bold text-white">
                    {(rider.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Observation Paragraph */}
              <div className="mt-2.5 pt-2.5 border-t border-slate-800/80">
                <div className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider flex items-center gap-1">
                  <span>Vision Observation:</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  {rider.observation}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
                <span className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1">
                  {isSelected ? 'Focused in HUD' : 'Click to highlight on visual canvas'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>

                {onGenerateCitation && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenerateCitation(rider);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded border font-medium transition-colors ${
                      isViolation
                        ? 'bg-rose-900/50 hover:bg-rose-900 text-rose-200 border-rose-700'
                        : rider.helmet_status === 'WEARING_HELMET'
                        ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/80'
                        : 'bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border-amber-700/80'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {isViolation
                      ? 'Issue Citation Notice'
                      : rider.helmet_status === 'WEARING_HELMET'
                      ? 'Compliance Cert'
                      : 'Inspection Notice'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
