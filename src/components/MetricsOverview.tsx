import React from 'react';
import { ShieldAlert, ShieldCheck, HelpCircle, Users, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { HelmetDetectionResponse } from '../types/helmet';

interface MetricsOverviewProps {
  data: HelmetDetectionResponse | null;
  isLoading: boolean;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-slate-800 rounded w-2/3 mb-2"></div>
            <div className="h-8 bg-slate-800 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const image_analysis = data.image_analysis || {
    total_riders: data.summary?.total_riders || 0,
    wearing_helmet: data.summary?.wearing_helmet || 0,
    no_helmet: data.summary?.no_helmet || 0,
    uncertain: data.summary?.uncertain || 0,
  };
  const final_result = data.final_result || {
    no_helmet_detected: (image_analysis.no_helmet || 0) > 0,
    no_helmet_count: image_analysis.no_helmet || 0,
  };
  const complianceRate =
    image_analysis.total_riders > 0
      ? Math.round((image_analysis.wearing_helmet / image_analysis.total_riders) * 100)
      : 100;

  return (
    <div className="space-y-4 mb-6">
      {/* High Visibility Final Result Banner */}
      {final_result.no_helmet_detected ? (
        <div className="bg-rose-950/80 border-2 border-rose-600 rounded-xl p-4 text-rose-100 shadow-lg shadow-rose-950/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-900/80 border border-rose-500 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-7 h-7 text-rose-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-rose-800 text-rose-200 text-xs font-bold uppercase tracking-wider">
                  Enforcement Alert
                </span>
                <span className="text-xs text-rose-300">
                  Infraction Code: TRF-HLMT-01
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                NO HELMET DETECTED: {final_result.no_helmet_count} Rider Violation{final_result.no_helmet_count > 1 ? 's' : ''}
              </h3>
              <p className="text-xs sm:text-sm text-rose-200/90">
                Clear visual evidence of rider without mandatory head protection. Action recommended.
              </p>
            </div>
          </div>
          <div className="bg-rose-900/60 border border-rose-700/60 rounded-lg px-3.5 py-1.5 text-center shrink-0">
            <div className="text-xs text-rose-300 uppercase tracking-wider font-semibold">Violation Count</div>
            <div className="text-2xl font-black text-white">{final_result.no_helmet_count}</div>
          </div>
        </div>
      ) : image_analysis.total_riders > 0 ? (
        <div className="bg-emerald-950/80 border-2 border-emerald-600 rounded-xl p-4 text-emerald-100 shadow-lg shadow-emerald-950/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-900/80 border border-emerald-500 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded bg-emerald-800 text-emerald-200 text-xs font-bold uppercase tracking-wider">
                Full Compliance
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                All Visible Riders Are Wearing Helmets
              </h3>
              <p className="text-xs sm:text-sm text-emerald-200/90">
                100% traffic safety helmet compliance detected across all visible motorcycles and scooters.
              </p>
            </div>
          </div>
          <div className="bg-emerald-900/60 border border-emerald-700/60 rounded-lg px-3.5 py-1.5 text-center shrink-0">
            <div className="text-xs text-emerald-300 uppercase tracking-wider font-semibold">Compliance</div>
            <div className="text-2xl font-black text-white">100%</div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-slate-300 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">No Two-Wheeler Riders in Frame</h4>
            <p className="text-xs text-slate-400">
              Zero motorcycle or scooter riders identified in the analyzed frame.
            </p>
          </div>
        </div>
      )}

      {/* 4 Standard Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Riders */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium uppercase tracking-wider">Total Riders</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {image_analysis.total_riders}
            </span>
            <span className="text-xs text-slate-400">vehicles/passengers</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            motorcycles & scooters
          </div>
        </div>

        {/* Wearing Helmet */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-400 mb-1.5">
            <span className="text-xs font-medium uppercase tracking-wider">Wearing Helmet</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              {image_analysis.wearing_helmet}
            </span>
            <span className="text-xs text-emerald-400/80">
              ({complianceRate}%)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Compliant head protection
          </div>
        </div>

        {/* No Helmet */}
        <div
          className={`border rounded-xl p-4 shadow-sm transition-all ${
            image_analysis.no_helmet > 0
              ? 'bg-rose-950/40 border-rose-700/80 text-rose-300'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`text-xs font-medium uppercase tracking-wider ${
                image_analysis.no_helmet > 0 ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              No Helmet
            </span>
            <ShieldAlert
              className={`w-4 h-4 ${
                image_analysis.no_helmet > 0 ? 'text-rose-400' : 'text-slate-500'
              }`}
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold ${
                image_analysis.no_helmet > 0 ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              {image_analysis.no_helmet}
            </span>
            {image_analysis.no_helmet > 0 && (
              <span className="text-xs font-bold text-rose-400 uppercase">
                Violations
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Head visible without helmet
          </div>
        </div>

        {/* Uncertain */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-400 mb-1.5">
            <span className="text-xs font-medium uppercase tracking-wider">Uncertain</span>
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">
              {image_analysis.uncertain}
            </span>
            <span className="text-xs text-amber-400/80">occluded</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Head blocked, blurred or too small
          </div>
        </div>
      </div>
    </div>
  );
};
