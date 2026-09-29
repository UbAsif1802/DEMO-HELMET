import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Upload, CheckCircle2, ShieldAlert } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64DataUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileFallbackRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [flashActive, setFlashActive] = useState<boolean>(false);

  const stopCurrentStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Silent cleanup
        }
      });
      setStream(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
      checkDeviceCameras();
    } else {
      stopCurrentStream();
    }

    return () => {
      stopCurrentStream();
    };
  }, [isOpen, facingMode]);

  const checkDeviceCameras = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      }
    } catch {
      // Ignore if enumeration is restricted
    }
  };

  const startCamera = async () => {
    setIsInitializing(true);
    setErrorMsg(null);
    setIsPermissionDenied(false);
    stopCurrentStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg(
        'Camera API is not supported in this browser or iframe. Use the system snapshot button below.'
      );
      setIsInitializing(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsInitializing(false);
    } catch (err: any) {
      // Prevent uncaught console errors while maintaining clean logging
      setIsInitializing(false);
      const isDenied =
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.message?.includes('Permission denied') ||
        err.message?.includes('permission');

      if (isDenied) {
        setIsPermissionDenied(true);
        setErrorMsg(
          'Camera access was blocked by the browser or iframe security policy. You can grant access via browser address bar permissions or use the system snapshot / file picker below.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('No camera hardware was detected on this workstation.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMsg('Camera hardware is currently reserved by another process or application.');
      } else {
        setErrorMsg(`Camera error: ${err.message || 'Unable to open camera stream.'}`);
      }
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setErrorMsg('Failed to create canvas rendering context.');
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      stopCurrentStream();
      onCapture(dataUrl);
    } catch {
      setErrorMsg('Failed to serialize image from optical stream.');
    }
  };

  const handleFallbackFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        stopCurrentStream();
        onCapture(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/50 backdrop-blur-xs">
      <div className="bg-[#FAF8F4] border border-[#E2DDD3] rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden">
        {/* Hidden Fallback File Input (System Camera / Photo Library) */}
        <input
          ref={fileFallbackRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFallbackFileSelect}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="bg-[#EBE6DC] px-5 py-3.5 border-b border-[#E2DDD3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#0D9488]" />
            <h3 className="text-xs font-mono font-bold text-[#1C1917] uppercase tracking-wider">
              Live Optical Camera Stream
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {!errorMsg && hasMultipleCameras && (
              <button
                onClick={toggleCameraFacing}
                className="p-1.5 rounded-lg border border-[#CDC5B5] bg-white text-[#57534E] hover:text-[#1C1917]"
                title="Switch Camera (Front/Rear)"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => {
                stopCurrentStream();
                onClose();
              }}
              className="p-1.5 text-[#857F75] hover:text-[#1C1917] hover:bg-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Viewport Area */}
        <div className="relative bg-[#1C1917] min-h-[340px] max-h-[480px] flex items-center justify-center overflow-hidden">
          {flashActive && <div className="absolute inset-0 bg-white z-50 pointer-events-none" />}

          {isInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#1C1917]">
              <div className="w-8 h-8 border-2 border-white/20 border-t-[#0D9488] rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-mono text-stone-300">REQUESTING CAMERA STREAM ACCESS...</p>
            </div>
          )}

          {errorMsg && (
            <div className="p-8 text-center bg-[#FAF8F4] w-full h-full flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="space-y-1.5 max-w-md">
                <h4 className="text-sm font-bold text-[#1C1917]">
                  {isPermissionDenied ? 'Camera Permission Required' : 'Camera Hardware Unavailable'}
                </h4>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  {errorMsg}
                </p>
              </div>

              {/* Action options */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  onClick={() => fileFallbackRef.current?.click()}
                  className="px-4 py-2 bg-[#1C1917] hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                >
                  <Upload className="w-4 h-4 text-[#0D9488]" />
                  <span>Choose Photo / System Camera</span>
                </button>

                <button
                  onClick={startCamera}
                  className="px-3.5 py-2 bg-white border border-[#CDC5B5] hover:border-[#1C1917] text-[#1C1917] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#57534E]" />
                  <span>Retry Access</span>
                </button>
              </div>
            </div>
          )}

          {!errorMsg && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-contain max-h-[480px] ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />
          )}

          {/* Guidelines Reticle */}
          {!errorMsg && !isInitializing && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/60"></div>
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/60"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/60"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/60"></div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer with Capture Trigger */}
        <div className="p-4 bg-[#FAF8F4] border-t border-[#E2DDD3] flex items-center justify-between">
          <div className="text-[11px] font-mono text-[#57534E]">
            {!errorMsg ? `MODE: ${facingMode.toUpperCase()}` : 'FALLBACK: FILE PICKER READY'}
          </div>

          <div className="flex items-center gap-2">
            {!errorMsg && (
              <button
                onClick={handleCapture}
                disabled={isInitializing}
                className="px-5 py-2.5 bg-[#1C1917] hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <Camera className="w-4 h-4 text-[#0D9488]" />
                <span>Capture Snapshot</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
