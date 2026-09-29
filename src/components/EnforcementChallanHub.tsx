import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Edit3,
  Check,
  X,
  Printer,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  Car,
} from 'lucide-react';
import { TrafficDetection } from '../types/helmet';
import { exportViolationsToCSV } from '../utils/csvExport';

interface EnforcementChallanHubProps {
  detections: TrafficDetection[];
  onSelectDetection?: (id: number | null) => void;
  onOpenCitationModal?: (detection: TrafficDetection) => void;
  onUpdateDetectionPlate?: (id: number, newPlate: string) => void;
}

export const EnforcementChallanHub: React.FC<EnforcementChallanHubProps> = ({
  detections,
  onSelectDetection,
  onOpenCitationModal,
  onUpdateDetectionPlate,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPlateValue, setEditPlateValue] = useState<string>('');
  const [fineSchedule, setFineSchedule] = useState<Record<string, number>>({
    NO_HELMET: 150,
    TRIPLE_RIDING: 250,
    POTENTIAL_SEATBELT_ISSUE: 100,
    POTENTIAL_OCCUPANCY_ISSUE: 120,
    UNCERTAIN: 50,
  });

  const confirmedViolations = detections.filter((d) => d.is_violation || d.is_potential);

  const startEditPlate = (id: number, currentPlate: string) => {
    setEditingId(id);
    setEditPlateValue(currentPlate === 'NOT_READABLE' ? '' : currentPlate);
  };

  const saveEditPlate = (id: number) => {
    if (onUpdateDetectionPlate) {
      onUpdateDetectionPlate(id, editPlateValue.trim().toUpperCase() || 'NOT_READABLE');
    }
    setEditingId(null);
  };

  const handleExportBatchCSV = () => {
    const exportItems = detections.map((d) => ({
      id: d.id,
      timestamp: d.timestamp || '00:00',
      vehicle_type: d.vehicle_type,
      violation: d.category,
      status: d.is_violation ? 'CONFIRMED' : d.is_potential ? 'POTENTIAL' : 'COMPLIANT',
      confidence: d.confidence,
      license_plate: d.license_plate?.value || 'NOT_READABLE',
      plate_status: d.license_plate?.status || 'NOT_READABLE',
      officer_verified: false,
      evidence_summary: d.evidence,
    }));
    exportViolationsToCSV(exportItems, 'traffic_enforcement_batch');
  };

  return (
    <div className="space-y-6">
      {/* Overview & Controls */}
      <div className="bg-[#FAF8F4] border border-[#E2DDD3] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-[#0D9488]" />
              <span className="font-mono text-xs uppercase tracking-wider text-[#857F75] font-semibold">
                Official Municipal Enforcement · Challan Registry
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#1C1917] tracking-tight">
              Traffic Infraction Citations & Officer Verification
            </h2>
            <p className="text-xs text-[#57534E] mt-1 max-w-xl">
              Inspect automated optical citations, verify or correct vehicle registration plates with audit trails, and export standard CSV/PDF packages.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportBatchCSV}
              className="px-4 py-2.5 bg-white border border-[#CDC5B5] hover:border-[#1C1917] text-[#1C1917] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-[#0D9488]" />
              <span>Export Batch CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Citations Queue Table */}
      <div className="bg-[#FAF8F4] border border-[#E2DDD3] rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-[#EBE6DC] px-5 py-3 border-b border-[#E2DDD3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#1C1917] uppercase tracking-wider">
              Recorded Infractions Queue ({confirmedViolations.length} Pending Citations)
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#57534E]">
            TOTAL ASSESSED FINES: ${' '}
            {confirmedViolations.reduce(
              (acc, curr) => acc + (fineSchedule[curr.category] || 100),
              0
            )}
          </span>
        </div>

        {confirmedViolations.length === 0 ? (
          <div className="p-12 text-center text-[#857F75] space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <div className="text-sm font-bold text-[#1C1917]">Zero Violations in Current Queue</div>
            <div className="text-xs">
              All monitored vehicles and riders are currently operating in full compliance.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F4] border-b border-[#E2DDD3] text-[#857F75] font-mono uppercase text-[11px]">
                <tr>
                  <th className="px-4 py-3">Infraction / Target</th>
                  <th className="px-4 py-3">Timestamp / Loc</th>
                  <th className="px-4 py-3">License Plate (OCR / Manual)</th>
                  <th className="px-4 py-3">Statutory Fine</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3 text-right">Notice Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD3]">
                {confirmedViolations.map((detection) => {
                  const plateVal = detection.license_plate?.value || 'NOT_READABLE';
                  const fine = fineSchedule[detection.category] || 100;
                  const isEditing = editingId === detection.id;

                  return (
                    <tr
                      key={detection.id}
                      className="hover:bg-white transition-colors cursor-pointer"
                      onClick={() => onSelectDetection && onSelectDetection(detection.id)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              detection.is_violation
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-[#1C1917]">
                              {detection.category.replace(/_/g, ' ')}
                            </div>
                            <div className="text-[11px] text-[#57534E]">
                              {detection.target_label} · {detection.vehicle_type}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[#57534E]">
                        <div>{detection.timestamp || 'CAM-04'}</div>
                        <div className="text-[10px] text-[#857F75]">CORRIDOR NORTH</div>
                      </td>

                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editPlateValue}
                              onChange={(e) => setEditPlateValue(e.target.value)}
                              placeholder="e.g. MP04AB1234"
                              className="px-2 py-1 rounded bg-white border border-[#0D9488] font-mono text-xs font-bold text-[#1C1917] uppercase w-28"
                              autoFocus
                            />
                            <button
                              onClick={() => saveEditPlate(detection.id)}
                              className="p-1 rounded bg-[#0D9488] text-white hover:bg-[#0f766e]"
                              title="Save Verification"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded bg-[#E2DDD3] text-[#57534E] hover:text-[#1C1917]"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded font-mono text-xs font-bold border ${
                                plateVal !== 'NOT_READABLE'
                                  ? 'bg-white text-[#1C1917] border-[#CDC5B5]'
                                  : 'bg-[#EBE6DC] text-[#857F75] border-[#E2DDD3]'
                              }`}
                            >
                              {plateVal}
                            </span>
                            <button
                              onClick={() => startEditPlate(detection.id, plateVal)}
                              className="p-1 text-[#857F75] hover:text-[#1C1917] hover:bg-[#EBE6DC] rounded"
                              title="Verify or Edit License Plate"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-[#1C1917]">
                        ${fine}.00
                      </td>

                      <td className="px-4 py-3.5 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            detection.confidence > 0.85
                              ? 'bg-rose-50 text-rose-800 border border-rose-300'
                              : 'bg-amber-50 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {(detection.confidence * 100).toFixed(0)}%
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenCitationModal && onOpenCitationModal(detection)}
                          className="px-3 py-1.5 bg-white border border-[#CDC5B5] hover:border-[#1C1917] text-[#1C1917] rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#57534E]" />
                          <span>Generate Challan</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
