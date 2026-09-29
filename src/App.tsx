import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { SummaryCards } from './components/SummaryCards';
import { ImageAnalysisView } from './components/ImageAnalysisView';
import { ViolationsList } from './components/ViolationsList';
import { UploadSection } from './components/UploadSection';
import { PresetScenariosTab } from './components/PresetScenariosTab';
import { CitationReportModal } from './components/CitationReportModal';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { EnforcementChallanHub } from './components/EnforcementChallanHub';
import { SAMPLE_SCENARIOS } from './data/sampleScenarios';
import { TrafficSafetyResponse, TrafficDetection, SampleScenario } from './types/helmet';
import { exportViolationsToCSV } from './utils/csvExport';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const initialScenario = SAMPLE_SCENARIOS[0];
  const [activeTab, setActiveTab] = useState<'inspection' | 'challan' | 'scenarios'>('inspection');
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(initialScenario.imageUrl);
  const [detectionData, setDetectionData] = useState<TrafficSafetyResponse | null>(initialScenario.mockResult);
  const [selectedDetectionId, setSelectedDetectionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(initialScenario.id);
  const [citationModalOpen, setCitationModalOpen] = useState<boolean>(false);
  const [cameraDirectOpen, setCameraDirectOpen] = useState<boolean>(false);
  const [citationTarget, setCitationTarget] = useState<TrafficDetection | null>(
    initialScenario.mockResult.detections[0] || null
  );
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState<boolean>(false);
  const [showUploadPanel, setShowUploadPanel] = useState<boolean>(false);

  const runAnalysis = async (imageData: string, sampleFallback?: SampleScenario) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSelectedDetectionId(null);

    try {
      const response = await fetch('/api/analyze-traffic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          mimeType: 'image/jpeg',
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.error || 'Unable to analyze this image. Please try again.');
      }

      const data: TrafficSafetyResponse = await response.json();
      setDetectionData(data);

      const firstIssue = data.detections?.find((d) => d.is_violation || d.is_potential);
      if (firstIssue) {
        setSelectedDetectionId(firstIssue.id);
      }
    } catch (err: any) {
      console.warn('Analysis error:', err);
      if (sampleFallback) {
        setDetectionData(sampleFallback.mockResult);
        const firstIssue = sampleFallback.mockResult.detections?.find((d) => d.is_violation || d.is_potential);
        if (firstIssue) {
          setSelectedDetectionId(firstIssue.id);
        }
      } else {
        setErrorMessage(err.message || 'Unable to analyze this image. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectScenario = (scenario: SampleScenario) => {
    setActiveScenarioId(scenario.id);
    setCurrentImageUrl(scenario.imageUrl);
    setDetectionData(scenario.mockResult);
    const firstIssue = scenario.mockResult.detections?.find((d) => d.is_violation || d.is_potential);
    if (firstIssue) {
      setSelectedDetectionId(firstIssue.id);
    } else {
      setSelectedDetectionId(null);
    }
  };

  const handleImageUploaded = (base64OrUrl: string, sampleData?: SampleScenario) => {
    setActiveScenarioId(null);
    setCurrentImageUrl(base64OrUrl);
    setShowUploadPanel(false);
    runAnalysis(base64OrUrl, sampleData);
  };

  const handleGenerateNotice = (detection: TrafficDetection) => {
    setCitationTarget(detection);
    setCitationModalOpen(true);
  };

  const handleUpdateDetectionPlate = (id: number, newPlate: string) => {
    if (!detectionData) return;
    const updated = {
      ...detectionData,
      detections: detectionData.detections.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            license_plate: {
              value: newPlate,
              confidence: 1.0,
              status: newPlate === 'NOT_READABLE' ? ('NOT_READABLE' as const) : ('READABLE' as const),
            },
          };
        }
        return d;
      }),
    };
    setDetectionData(updated);
  };

  const handleExportCSV = () => {
    if (!detectionData) return;
    const exportItems = detectionData.detections.map((d) => ({
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
    exportViolationsToCSV(exportItems, 'traffic_telemetry_audit');
  };

  const detections = detectionData?.detections || [];
  const summary = detectionData?.summary || {
    total_riders: 0,
    wearing_helmet: 0,
    no_helmet: 0,
    triple_riding: 0,
    cars_detected: 0,
    seatbelt_issues: 0,
    occupancy_issues: 0,
    uncertain: 0,
  };

  const hasViolation = (detectionData?.final_assessment?.confirmed_violations ?? 0) > 0;
  const violationCount = detectionData?.final_assessment?.confirmed_violations ?? 0;
  const potentialCount = detectionData?.final_assessment?.potential_issues ?? 0;

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1C1917] flex">
      {/* Primary Municipal Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasViolation={hasViolation}
        violationCount={violationCount}
        potentialCount={potentialCount}
        isOpenMobile={sidebarMobileOpen}
        onCloseMobile={() => setSidebarMobileOpen(false)}
      />

      {/* Main Screen Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar */}
        <TopNavbar
          activeTab={activeTab}
          onOpenMobileMenu={() => setSidebarMobileOpen(true)}
          onUploadClick={() => setShowUploadPanel(!showUploadPanel)}
          onCameraClick={() => setCameraDirectOpen(true)}
          onAnalyzeClick={() => currentImageUrl && runAnalysis(currentImageUrl)}
          onGenerateCitationClick={() => {
            const firstViolation = detections.find((d) => d.is_violation);
            if (firstViolation) handleGenerateNotice(firstViolation);
          }}
          onExportBatchCSV={handleExportCSV}
          isLoading={isLoading}
          hasViolation={hasViolation}
          activeScenarioTitle={
            activeScenarioId
              ? SAMPLE_SCENARIOS.find((s) => s.id === activeScenarioId)?.title
              : undefined
          }
        />

        {/* Workspace Body */}
        <main className="flex-1 p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="underline hover:text-rose-950 font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Upload Drawer (Collapsible) */}
          {showUploadPanel && (
            <UploadSection
              onImageSelected={handleImageUploaded}
              onAnalyze={() => currentImageUrl && runAnalysis(currentImageUrl)}
              selectedImage={currentImageUrl}
              isLoading={isLoading}
              onClose={() => setShowUploadPanel(false)}
            />
          )}

          {/* TAB 1: Vision Inspection Workstation */}
          {activeTab === 'inspection' && (
            <div className="space-y-6">
              {/* KPI Metrics Strip */}
              <SummaryCards
                summary={summary}
                qualityCheck={detectionData?.quality_check}
                finalAssessment={detectionData?.final_assessment}
                isLoading={isLoading}
              />

              {/* 2-Column Workstation Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left 7 Cols: Camera Surveillance HUD Viewport */}
                <div className="lg:col-span-7 space-y-6">
                  <ImageAnalysisView
                    imageUrl={currentImageUrl}
                    detections={detections}
                    selectedId={selectedDetectionId}
                    onSelectDetection={setSelectedDetectionId}
                    isLoading={isLoading}
                    onSelectScenario={handleSelectScenario}
                    activeScenarioId={activeScenarioId}
                    onUploadClick={() => setShowUploadPanel(true)}
                    onCameraClick={() => setCameraDirectOpen(true)}
                  />
                </div>

                {/* Right 5 Cols: Real-time Detections & Evidence Feed */}
                <div className="lg:col-span-5 bg-[#FAF8F4] border border-[#E2DDD3] rounded-2xl p-5 shadow-sm space-y-5">
                  <ViolationsList
                    detections={detections}
                    selectedId={selectedDetectionId}
                    onSelectDetection={setSelectedDetectionId}
                    onGenerateNotice={handleGenerateNotice}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Challan & Infraction Notice Hub */}
          {activeTab === 'challan' && (
            <EnforcementChallanHub
              detections={detections}
              onSelectDetection={setSelectedDetectionId}
              onOpenCitationModal={handleGenerateNotice}
              onUpdateDetectionPlate={handleUpdateDetectionPlate}
            />
          )}

          {/* TAB 3: Benchmark Ground-Truth Suite */}
          {activeTab === 'scenarios' && (
            <PresetScenariosTab
              onSelectScenario={(sc) => {
                handleSelectScenario(sc);
                setActiveTab('inspection');
              }}
              activeScenarioId={activeScenarioId}
            />
          )}
        </main>
      </div>

      {/* Citation Report Modal */}
      <CitationReportModal
        isOpen={citationModalOpen}
        onClose={() => setCitationModalOpen(false)}
        rider={citationTarget}
        imageUrl={currentImageUrl}
        detectionData={detectionData}
      />

      {/* Direct Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={cameraDirectOpen}
        onClose={() => setCameraDirectOpen(false)}
        onCapture={(base64) => {
          setCameraDirectOpen(false);
          handleImageUploaded(base64);
        }}
      />
    </div>
  );
}
