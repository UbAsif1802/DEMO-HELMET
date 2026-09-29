import React, { useState } from 'react';
import { TrafficDetection } from '../types/helmet';
import {
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  FileText,
  Filter,
  CheckCircle2,
  ChevronRight,
  Printer,
} from 'lucide-react';

interface ViolationsListProps {
  detections: TrafficDetection[];
  selectedId: number | null;
  onSelectDetection: (id: number | null) => void;
  onGenerateNotice?: (detection: TrafficDetection) => void;
}

export const ViolationsList: React.FC<ViolationsListProps> = ({
  detections,
  selectedId,
  onSelectDetection,
  onGenerateNotice,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'violations' | 'potential' | 'compliant'>('all');

  const confirmedViolations = detections.filter((d) => d.is_violation);
  const potentialIssues = detections.filter((d) => d.is_potential);
  const uncertainDetections = detections.filter((d) => d.is_uncertain);
  const compliantDetections = detections.filter(
    (d) => !d.is_violation && !d.is_potential && !d.is_uncertain
  );

  const filteredDetections = detections.filter((d) => {
    if (filterType === 'violations') return d.is_violation;
    if (filterType === 'potential') return d.is_potential;
    if (filterType === 'compliant') return !d.is_violation && !d.is_potential && !d.is_uncertain;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header & Filter Segmented Control */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#0D9488]" />
            <h3 className="text-xs font-mono font-bold text-[#1C1917] tracking-wider uppercase">
              Detections & Analysis Feed
            </h3>
          </div>
          <span className="font-mono text-xs text-[#57534E] bg-white px-2 py-0.5 rounded-md border border-[#CDC5B5]">
            {detections.length} Target{detections.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white border border-[#E2DDD3] rounded-xl text-xs overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
              filterType === 'all'
                ? 'bg-[#EBE6DC] text-[#1C1917] font-bold shadow-2xs'
                : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            All ({detections.length})
          </button>
          <button
            onClick={() => setFilterType('violations')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
              filterType === 'violations'
                ? 'bg-rose-100 text-rose-900 font-bold border border-rose-300'
                : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            Infractions ({confirmedViolations.length})
          </button>
          <button
            onClick={() => setFilterType('potential')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
              filterType === 'potential'
                ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            Review ({potentialIssues.length})
          </button>
          <button
            onClick={() => setFilterType('compliant')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
              filterType === 'compliant'
                ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            Compliant ({compliantDetections.length})
          </button>
        </div>
      </div>

      {/* Detections Feed List */}
      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
        {filteredDetections.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-[#E2DDD3] text-[#857F75] text-xs">
            No detections match the selected filter category.
          </div>
        ) : (
          filteredDetections.map((detection) => {
            const isSelected = selectedId === detection.id;
            const isViolation = detection.is_violation;
            const isPotential = detection.is_potential;

            return (
              <div
                key={detection.id}
                onClick={() => onSelectDetection(isSelected ? null : detection.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-[#0D9488] ring-2 ring-[#0D9488]/20 shadow-sm'
                    : 'bg-white/80 border-[#E2DDD3] hover:border-[#CDC5B5] hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isViolation
                          ? 'bg-rose-100 text-rose-800'
                          : isPotential
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isViolation ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : isPotential ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#1C1917] truncate">
                          {detection.target_label}
                        </span>
                        <span className="text-[10px] font-mono text-[#857F75] uppercase">
                          · {detection.vehicle_type}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-[#1C1917] mt-0.5">
                        {detection.category.replace(/_/g, ' ')}
                      </div>

                      <p className="text-[11px] text-[#57534E] mt-1 line-clamp-2">
                        {detection.evidence}
                      </p>

                      {/* Plate and timestamp info */}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-mono">
                        {detection.license_plate && (
                          <span
                            className={`px-1.5 py-0.5 rounded border ${
                              detection.license_plate.status === 'READABLE'
                                ? 'bg-[#EBE6DC] text-[#1C1917] border-[#CDC5B5] font-bold'
                                : 'bg-[#FAF8F4] text-[#857F75] border-[#E2DDD3]'
                            }`}
                          >
                            PLATE: {detection.license_plate.value}
                          </span>
                        )}

                        {detection.timestamp && (
                          <span className="px-1.5 py-0.5 rounded bg-[#FAF8F4] text-[#57534E] border border-[#E2DDD3]">
                            ⏱ {detection.timestamp}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        detection.confidence > 0.85
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-[#EBE6DC] text-[#57534E]'
                      }`}
                    >
                      {(detection.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Evidence screenshot preview if available */}
                {detection.evidence_frame && (
                  <div className="mt-2.5 pt-2.5 border-t border-[#E2DDD3]">
                    <div className="text-[10px] font-mono text-[#857F75] mb-1">
                      EXTRACTED VIDEO EVIDENCE FRAME:
                    </div>
                    <img
                      src={detection.evidence_frame}
                      alt="Evidence Frame"
                      className="w-full h-24 object-cover rounded-lg border border-[#CDC5B5]"
                    />
                  </div>
                )}

                {/* Action button */}
                {onGenerateNotice && (isViolation || isPotential) && (
                  <div className="mt-3 pt-2.5 border-t border-[#E2DDD3] flex items-center justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onGenerateNotice(detection);
                      }}
                      className="px-2.5 py-1 rounded bg-[#EBE6DC] hover:bg-[#CDC5B5] text-[#1C1917] text-[11px] font-bold transition-colors inline-flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#57534E]" />
                      <span>Issue Notice</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
