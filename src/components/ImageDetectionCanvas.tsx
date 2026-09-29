import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Eye, ShieldAlert, ShieldCheck, HelpCircle, Layers, Maximize2, Sparkles } from 'lucide-react';
import { RiderDetection, HelmetStatus } from '../types/helmet';

interface ImageDetectionCanvasProps {
  imageUrl: string | null;
  riders: RiderDetection[];
  selectedRiderId: number | null;
  onSelectRider: (riderId: number | null) => void;
  isLoading: boolean;
}

export const ImageDetectionCanvas: React.FC<ImageDetectionCanvasProps> = ({
  imageUrl,
  riders,
  selectedRiderId,
  onSelectRider,
  isLoading,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [nightVision, setNightVision] = useState<boolean>(false);
  const [scanlines, setScanlines] = useState<boolean>(true);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoom(1);

  const getStatusColor = (status: HelmetStatus) => {
    switch (status) {
      case 'NO_HELMET':
        return {
          border: 'border-rose-500',
          bg: 'bg-rose-500/15',
          text: 'text-rose-400',
          badgeBg: 'bg-rose-950/90 text-rose-300 border-rose-600',
          dot: 'bg-rose-500',
        };
      case 'WEARING_HELMET':
        return {
          border: 'border-emerald-500',
          bg: 'bg-emerald-500/15',
          text: 'text-emerald-400',
          badgeBg: 'bg-emerald-950/90 text-emerald-300 border-emerald-600',
          dot: 'bg-emerald-500',
        };
      case 'UNCERTAIN':
      default:
        return {
          border: 'border-amber-500',
          bg: 'bg-amber-500/15',
          text: 'text-amber-400',
          badgeBg: 'bg-amber-950/90 text-amber-300 border-amber-600',
          dot: 'bg-amber-500',
        };
    }
  };

  if (!imageUrl) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[420px]">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 mb-4">
          <Eye className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">No Image Loaded</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Upload a traffic camera still, paste from clipboard, or pick a preset scenario to run helmet detection.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Top HUD Controls Bar */}
      <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            SURVEILLANCE HUD
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono">
            {riders.length} Target{riders.length === 1 ? '' : 's'} Identified
          </span>
        </div>

        {/* Viewport & Overlay Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              showBoxes
                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Toggle Bounding Boxes"
          >
            <Layers className="w-3.5 h-3.5" />
            Boxes
          </button>

          <button
            onClick={() => setNightVision(!nightVision)}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              nightVision
                ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Night Vision Filter"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Night Vision
          </button>

          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={handleZoomOut}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[11px] text-slate-300 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoom !== 1 && (
              <button
                onClick={handleResetZoom}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors ml-0.5"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative overflow-auto bg-slate-950 flex items-center justify-center min-h-[460px] max-h-[640px] select-none">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-30 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-indigo-400">
                <Eye className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <h4 className="text-sm font-semibold text-white">Running Vision Neural Scan</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1 font-mono">
              Detecting motorcycle & scooter riders and evaluating helmet compliance...
            </p>
          </div>
        )}

        {/* Scalable Container */}
        <div
          className={`relative transition-transform duration-150 ease-out origin-center inline-block ${
            nightVision ? 'filter brightness-125 contrast-150 hue-rotate-90 sepia-[.3]' : ''
          }`}
          style={{ transform: `scale(${zoom})` }}
        >
          <img
            src={imageUrl}
            alt="Surveillance analysis capture"
            className="block max-w-full max-h-[580px] object-contain rounded-lg pointer-events-auto"
          />

          {/* Optional Scanlines effect for high-tech HUD */}
          {scanlines && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent bg-[length:100%_4px] opacity-40"></div>
          )}

          {/* Bounding Box Overlays */}
          {showBoxes &&
            riders.map((rider) => {
              const isSelected = selectedRiderId === rider.rider_id;
              const colors = getStatusColor(rider.helmet_status);

              // Calculate coordinates if available
              let style: React.CSSProperties = {};
              if (rider.box_2d && rider.box_2d.length === 4) {
                const [ymin, xmin, ymax, xmax] = rider.box_2d;
                style = {
                  top: `${Math.max(0, (ymin / 1000) * 100)}%`,
                  left: `${Math.max(0, (xmin / 1000) * 100)}%`,
                  height: `${Math.min(100, ((ymax - ymin) / 1000) * 100)}%`,
                  width: `${Math.min(100, ((xmax - xmin) / 1000) * 100)}%`,
                };
              } else {
                // If box_2d was not provided, fallback to synthetic center box
                const indexOffset = ((rider.rider_id - 1) % 3) * 20;
                style = {
                  top: `${20 + indexOffset}%`,
                  left: `${30 + indexOffset}%`,
                  height: '40%',
                  width: '30%',
                };
              }

              return (
                <div
                  key={rider.rider_id}
                  onClick={() => onSelectRider(isSelected ? null : rider.rider_id)}
                  style={style}
                  className={`absolute cursor-pointer border-2 transition-all duration-200 z-20 ${colors.border} ${
                    colors.bg
                  } ${
                    isSelected
                      ? 'ring-4 ring-white shadow-2xl scale-[1.02]'
                      : 'hover:border-white hover:bg-white/10'
                  }`}
                >
                  {/* Corner Reticles for vision camera aesthetic */}
                  <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white"></span>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white"></span>
                  <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white"></span>
                  <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white"></span>

                  {/* Identification Label Tag */}
                  {showLabels && (
                    <div
                      className={`absolute -top-7 left-0 border px-1.5 py-0.5 rounded text-[11px] font-mono whitespace-nowrap shadow-md flex items-center gap-1.5 backdrop-blur-md ${colors.badgeBg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`}></span>
                      <span className="font-bold">
                        #{rider.rider_id} {rider.vehicle_type}
                      </span>
                      <span>•</span>
                      <span className="uppercase font-semibold">
                        {rider.helmet_status === 'NO_HELMET'
                          ? 'NO HELMET [VIOLATION]'
                          : rider.helmet_status === 'WEARING_HELMET'
                          ? 'HELMET OK'
                          : 'UNCERTAIN'}
                      </span>
                      <span className="text-[10px] opacity-75">
                        {Math.round(rider.confidence * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            NO_HELMET (Violation)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            WEARING_HELMET (Compliant)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            UNCERTAIN (Occluded/Blur)
          </span>
        </div>
        <span className="hidden sm:inline text-slate-400">
          Click any bounding box to focus rider evidence
        </span>
      </div>
    </div>
  );
};
