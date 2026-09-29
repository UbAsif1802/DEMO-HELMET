import React, { useState } from 'react';
import {
  X,
  Printer,
  ShieldAlert,
  Calendar,
  MapPin,
  Camera,
  AlertTriangle,
  Download,
  Copy,
  Check,
  FileText,
} from 'lucide-react';
import { copyTextToClipboard } from '../utils/clipboard';

interface CitationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rider: any | null;
  imageUrl: string | null;
  detectionData: any | null;
}

export const CitationReportModal: React.FC<CitationReportModalProps> = ({
  isOpen,
  onClose,
  rider,
  imageUrl,
  detectionData,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const citationId = `CIT-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const currentDate = new Date().toLocaleString();
  const riderTarget = rider
    ? {
        rider_id: rider.id || rider.rider_id || 1,
        vehicle_type: rider.vehicle_type || 'vehicle',
        helmet_status: rider.category || rider.helmet_status || 'NO_HELMET',
        confidence: rider.confidence || 0.95,
        observation: rider.evidence || rider.observation || "Rider's head is clearly visible and no helmet is present.",
        role: rider.target_label || rider.role || 'driver',
        license_plate: rider.license_plate?.value || 'NOT_READABLE',
        timestamp: rider.timestamp || 'CAM-04 · 14:55:00',
      }
    : {
        rider_id: 1,
        vehicle_type: 'motorcycle',
        helmet_status: 'NO_HELMET',
        confidence: 0.95,
        observation: "Rider's head is clearly visible and no helmet is present.",
        role: 'driver',
        license_plate: 'NOT_READABLE',
        timestamp: 'CAM-04 · 14:55:00',
      };

  const generatePrintableHtml = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Traffic Infraction Notice - ${citationId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #1c1917; background: #fff; }
    .header { border-bottom: 2px solid #1c1917; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; }
    .title { font-size: 20px; font-weight: bold; text-transform: uppercase; }
    .badge { background: #ffe4e6; color: #9f1239; padding: 4px 8px; font-family: monospace; font-weight: bold; border-radius: 4px; display: inline-block; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .card { border: 1px solid #e7e5e4; padding: 12px; border-radius: 8px; background: #fafaf9; }
    .label { font-size: 11px; text-transform: uppercase; color: #78716c; font-family: monospace; }
    .value { font-size: 15px; font-weight: bold; margin-top: 4px; }
    .evidence-img { max-width: 100%; height: auto; border: 1px solid #e7e5e4; border-radius: 8px; margin-top: 12px; }
    .footer { margin-top: 30px; font-size: 11px; color: #78716c; border-top: 1px solid #e7e5e4; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">Department of Transportation · Traffic Enforcement</div>
      <div style="font-size: 12px; color: #57534e;">AUTOMATED OPTICAL CITATION & INFRACTION REPORT</div>
    </div>
    <div style="text-align: right; font-family: monospace;">
      <div style="font-weight: bold;">${citationId}</div>
      <div style="font-size: 12px;">${currentDate}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="label">Violator / Vehicle</div>
      <div class="value">${riderTarget.role.toUpperCase()} (${riderTarget.vehicle_type.toUpperCase()})</div>
      <div style="margin-top: 8px; font-size: 12px;">License Plate: <b>${riderTarget.license_plate}</b></div>
    </div>
    <div class="card">
      <div class="label">Infraction Status</div>
      <div class="value badge">${riderTarget.helmet_status.replace(/_/g, ' ')}</div>
      <div style="margin-top: 8px; font-size: 12px;">Model Confidence: <b>${(riderTarget.confidence * 100).toFixed(1)}%</b></div>
    </div>
  </div>

  <div class="card">
    <div class="label">Officer Observation & Computer Vision Audit</div>
    <p style="font-size: 13px; line-height: 1.5; margin-top: 6px;">${riderTarget.observation}</p>
    <div style="font-size: 11px; color: #78716c; font-family: monospace; margin-top: 6px;">LOCATION: ${riderTarget.timestamp}</div>
  </div>

  ${imageUrl ? `<img src="${imageUrl}" class="evidence-img" alt="Evidence" />` : ''}

  <div class="footer">
    Notice generated automatically under statutory municipal traffic code. In case of dispute, submit this document ID to the traffic tribunal within 15 calendar days.
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(generatePrintableHtml());
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
      } else {
        downloadPrintableHtml();
      }
    } catch {
      downloadPrintableHtml();
    }
  };

  const downloadPrintableHtml = () => {
    const blob = new Blob([generatePrintableHtml()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citation-${citationId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setPrintStatus('Citation HTML package downloaded.');
    setTimeout(() => setPrintStatus(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/50 backdrop-blur-xs">
      <div className="bg-[#FAF8F4] border border-[#E2DDD3] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#EBE6DC] px-6 py-4 border-b border-[#E2DDD3] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#0D9488]" />
            <div>
              <h3 className="text-sm font-bold text-[#1C1917]">
                Official Traffic Infraction Notice
              </h3>
              <p className="text-[11px] font-mono text-[#857F75]">{citationId}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#857F75] hover:text-[#1C1917] hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-white rounded-xl border border-[#E2DDD3]">
              <span className="text-[#857F75] block text-[11px]">INFRACTION CODE</span>
              <span className="text-sm font-bold text-rose-800 mt-1 block">
                {riderTarget.helmet_status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E2DDD3]">
              <span className="text-[#857F75] block text-[11px]">VEHICLE REGISTRATION PLATE</span>
              <span className="text-sm font-bold text-[#1C1917] mt-1 block">
                {riderTarget.license_plate}
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E2DDD3]">
              <span className="text-[#857F75] block text-[11px]">MODEL CONFIDENCE</span>
              <span className="text-sm font-bold text-[#0D9488] mt-1 block">
                {(riderTarget.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E2DDD3]">
              <span className="text-[#857F75] block text-[11px]">ASSESSED FINE</span>
              <span className="text-sm font-bold text-[#1C1917] mt-1 block">$150.00 USD</span>
            </div>
          </div>

          {/* Evidence Frame Preview */}
          {imageUrl && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase text-[#857F75]">
                Certified Evidence Frame
              </span>
              <img
                src={imageUrl}
                alt="Citation Evidence"
                className="w-full max-h-56 object-cover rounded-xl border border-[#CDC5B5]"
              />
            </div>
          )}

          {printStatus && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-mono">
              {printStatus}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#EBE6DC] border-t border-[#E2DDD3] flex items-center justify-between">
          <button
            onClick={downloadPrintableHtml}
            className="px-3 py-1.5 bg-white border border-[#CDC5B5] hover:border-[#1C1917] text-[#1C1917] rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-4 h-4 text-[#57534E]" />
            <span>Download HTML Notice</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#1C1917] hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Challan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
