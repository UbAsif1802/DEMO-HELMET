import React, { useState } from 'react';
import { TrafficDetection, SampleScenario } from '../types/helmet';
import {
  Eye,
  Layers,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Camera,
  UploadCloud,
  CheckCircle2,
} from 'lucide-react';

interface ImageAnalysisViewProps {
  imageUrl: string | null;
  detections: TrafficDetection[];
  selectedId: number | null;
  onSelectDetection: (id: number | null) => void;
  isLoading: boolean;
  onSelectScenario?: (scenario: SampleScenario) => void;
  activeScenarioId?: string | null;
  onUploadClick?: () => void;
  onCameraClick?: () => void;
}

export const ImageAnalysisView: React.FC<ImageAnalysisViewProps> = ({
  imageUrl,
  detections,
  selectedId,
  onSelectDetection,
  isLoading,
  onUploadClick,
  onCameraClick,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [showCrosshairs, setShowCrosshairs] = useState<boolean>(true);
  const [highContrastMode, setHighContrastMode] = useState<boolean>(false);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoom(1);

  const getCategoryBadgeStyle = (detection: TrafficDetection) => {
    if (detection.is_violation) {
      return {
        boxBorder: 'border-rose-600 bg-rose-500/15',
        badge: 'bg-rose-900 text-white border-rose-700',
        cornerColor: 'border-rose-500',
        label: detection.category.replace(/_/g, ' '),
      };
    }
    if (detection.is_potential) {
      return {
        boxBorder: 'border-amber-600 bg-amber-500/15',
        badge: 'bg-amber-900 text-white border-amber-700',
        cornerColor: 'border-amber-500',
        label: detection.category.replace(/_/g, ' '),
      };
    }
    if (detection.is_uncertain) {
      return {
        boxBorder: 'border-blue-600 bg-blue-500/15',
        badge: 'bg-blue-900 text-white border-blue-700',
        cornerColor: 'border-blue-500',
        label: 'REVIEW REQUIRED',
      };
    }
    return {
      boxBorder: 'border-emerald-600 bg-emerald-500/15',
      badge: 'bg-emerald-950 text-emerald-100 border-emerald-700',
      cornerColor: 'border-emerald-500',
      label: detection.helmet_status === 'WEARING_HELMET' ? 'HELMET' : 'COMPLIANT',
    };
  };

  return (
    <div className="bg-[#FAF8F4] border border-[#E2DDD3] rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* 1. Camera Surveillance Bar */}
      <div className="bg-[#EBE6DC] px-4 py-2.5 border-b border-[#E2DDD3] flex items-center justify-between text-xs flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="font-mono font-bold text-[#1C1917] tracking-wider text-[11px]">
              CAM-04 · CORRIDOR NORTH CHECKPOINT
            </span>
          </div>
          <span className="text-[#CDC5B5] hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-[#57534E]">
            <span>MULTI-TARGET SCANNER</span>
            <span>·</span>
            <span className="text-[#0D9488] font-bold">{detections.length} TARGETS SEGMENTED</span>
          </div>
        </div>

        {/* HUD Controls Toolbar */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
              showBoxes
                ? 'bg-[#FAF8F4] border-[#0D9488] text-[#0D9488] font-bold shadow-2xs'
                : 'bg-white border-[#CDC5B5] text-[#57534E]'
            }`}
            title="Toggle Bounding Boxes"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Boxes ({detections.length})</span>
          </button>

          <button
            onClick={() => setShowCrosshairs(!showCrosshairs)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showCrosshairs
                ? 'bg-[#FAF8F4] border-[#0D9488] text-[#0D9488] shadow-2xs'
                : 'bg-white border-[#CDC5B5] text-[#57534E]'
            }`}
            title="Toggle Reticle Crosshairs"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setHighContrastMode(!highContrastMode)}
            className={`p-1.5 rounded-lg border transition-colors ${
              highContrastMode
                ? 'bg-[#FAF8F4] border-amber-600 text-amber-700 shadow-2xs'
                : 'bg-white border-[#CDC5B5] text-[#57534E]'
            }`}
            title="Toggle High Contrast / Night Filter"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {onCameraClick && (
            <button
              onClick={onCameraClick}
              className="p-1.5 rounded-lg border transition-colors bg-white border-[#CDC5B5] text-[#57534E] hover:text-[#1C1917]"
              title="Capture Frame from Camera"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Zoom controls */}
          <div className="flex items-center bg-white rounded-lg p-0.5 border border-[#CDC5B5]">
            <button
              onClick={handleZoomOut}
              className="p-1 text-[#57534E] hover:text-[#1C1917] rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[10px] text-[#57534E] min-w-[34px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 text-[#57534E] hover:text-[#1C1917] rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoom !== 1 && (
              <button
                onClick={handleResetZoom}
                className="px-1.5 py-0.5 text-[10px] text-[#0D9488] font-bold border-l border-[#CDC5B5] hover:bg-[#FAF8F4]"
                title="Reset Zoom"
              >
                1x
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Viewport Canvas */}
      <div className="relative bg-[#1C1917] min-h-[460px] flex items-center justify-center p-4 overflow-hidden select-none">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-[#1C1917]/85 backdrop-blur-xs flex flex-col items-center justify-center z-40 text-white">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-[#0D9488]/30"></div>
              <div className="absolute inset-0 rounded-full border-2 border-t-[#0D9488] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              <div className="absolute inset-2 rounded-full border border-dashed border-emerald-400/50 animate-pulse"></div>
            </div>
            <h4 className="mt-4 font-mono font-bold text-xs tracking-wider uppercase text-emerald-400">
              Scanning All Road Users in Corridor...
            </h4>
            <p className="text-xs text-stone-300 mt-1 max-w-sm text-center">
              Segmenting multiple motorcycle drivers, pillion passengers, cars, and evaluating protective headgear.
            </p>
          </div>
        )}

        {/* Empty state if no image */}
        {!imageUrl && (
          <div className="text-center p-12 space-y-3 bg-[#FAF8F4] w-full h-full flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[#EBE6DC] border border-[#CDC5B5] flex items-center justify-center mx-auto text-[#57534E]">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#1C1917]">No Optical Feed Selected</h4>
            <p className="text-xs text-[#57534E] max-w-sm mx-auto">
              Capture a frame using the camera or upload a traffic photo to inspect participants.
            </p>
            <div className="flex items-center justify-center gap-2">
              {onUploadClick && (
                <button
                  onClick={onUploadClick}
                  className="px-4 py-2 bg-[#1C1917] hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload Photo
                </button>
              )}
              {onCameraClick && (
                <button
                  onClick={onCameraClick}
                  className="px-4 py-2 bg-white hover:bg-[#EBE6DC] text-[#1C1917] border border-[#CDC5B5] rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-2"
                >
                  <Camera className="w-4 h-4 text-[#0D9488]" />
                  Capture Camera
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loaded Image + Multi-Target Bounding Boxes */}
        {imageUrl && (
          <div
            className={`relative transition-transform duration-100 ease-out origin-center inline-block max-w-full ${
              highContrastMode ? 'contrast-125 saturate-50 brightness-90' : ''
            }`}
            style={{ transform: `scale(${zoom})` }}
          >
            <img
              src={imageUrl}
              alt="Surveillance Feed"
              className="max-h-[540px] max-w-full w-auto object-contain rounded-lg shadow-2xl block"
            />

            {/* Reticle Crosshair Guidelines */}
            {showCrosshairs && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border border-white/10"></div>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/15"></div>
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/15"></div>
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/40"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/40"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/40"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/40"></div>
              </div>
            )}

            {/* Bounding Boxes for Every Target */}
            {showBoxes &&
              detections.map((detection) => {
                const isSelected = selectedId === detection.id;
                const style = getCategoryBadgeStyle(detection);
                const [ymin, xmin, ymax, xmax] = detection.box_2d || [200, 200, 800, 800];

                const topPercent = Math.max(0, Math.min(100, ymin / 10));
                const leftPercent = Math.max(0, Math.min(100, xmin / 10));
                const heightPercent = Math.max(2, Math.min(100 - topPercent, (ymax - ymin) / 10));
                const widthPercent = Math.max(2, Math.min(100 - leftPercent, (xmax - xmin) / 10));

                return (
                  <div
                    key={detection.id}
                    onClick={() => onSelectDetection(isSelected ? null : detection.id)}
                    style={{
                      top: `${topPercent}%`,
                      left: `${leftPercent}%`,
                      height: `${heightPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                    className={`absolute border-2 transition-all cursor-pointer group ${style.boxBorder} ${
                      isSelected
                        ? 'ring-2 ring-white shadow-xl scale-[1.01] z-30'
                        : 'hover:scale-[1.01] z-20'
                    }`}
                  >
                    {/* Corner Reticle Accents */}
                    <div
                      className={`absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 ${style.cornerColor}`}
                    />
                    <div
                      className={`absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 ${style.cornerColor}`}
                    />
                    <div
                      className={`absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 ${style.cornerColor}`}
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 ${style.cornerColor}`}
                    />

                    {/* HUD Label Tag */}
                    <div className="absolute -top-6 left-0 flex items-center gap-1 max-w-[200px] overflow-hidden whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight border shadow-xs ${style.badge}`}
                      >
                        #{detection.id} {detection.target_label || 'Target'} · {style.label}
                      </span>
                      <span className="px-1 py-0.5 rounded bg-black/80 text-white text-[9px] font-mono">
                        {(detection.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    {/* License Plate Indicator */}
                    {detection.license_plate?.value && detection.license_plate.value !== 'NOT_READABLE' && (
                      <div className="absolute -bottom-5 right-0 px-1.5 py-0.5 rounded bg-black/90 text-amber-300 font-mono text-[9px] flex items-center gap-1 border border-amber-500/40">
                        <span>{detection.license_plate.value}</span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* 3. Footer Bar with Scan Counter */}
      <div className="bg-[#FAF8F4] px-4 py-2 border-t border-[#E2DDD3] flex items-center justify-between text-xs text-[#57534E]">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></span>
          <span>{detections.length} Target{detections.length === 1 ? '' : 's'} Detected in Frame</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-rose-700 font-bold">
            {detections.filter((d) => d.is_violation).length} Infractions
          </span>
          <span>·</span>
          <span className="text-emerald-700 font-bold">
            {detections.filter((d) => !d.is_violation && !d.is_potential && !d.is_uncertain).length} Compliant
          </span>
        </div>
      </div>
    </div>
  );
};
