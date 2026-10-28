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
import { FlutterMobileNav } from './components/FlutterMobileNav';
import { SAMPLE_SCENARIOS } from './data/sampleScenarios';
import { TrafficSafetyResponse, TrafficDetection, SampleScenario } from './types/helmet';
import { exportViolationsToCSV } from './utils/csvExport';
import { AlertCircle, Copy, Check, FileText } from 'lucide-react';
import { buildChallengeSummary, validateChallengeSummaryInputs } from './utils/challengeSummary';
import { copyTextToClipboard } from './utils/clipboard';

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
  const [aiMode, setAiMode] = useState<'cloud' | 'local'>('cloud');
  const [challengeInput, setChallengeInput] = useState({
    problem: '',
    affected: '',
    solution: '',
    features: '',
    assumptions: '',
  });
  const [challengeSummary, setChallengeSummary] = useState('');
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [challengeCopied, setChallengeCopied] = useState(false);

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
          mode: aiMode,
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
      // Never replace a failed live analysis with demo/mock detections.
      setDetectionData(null);
      setSelectedDetectionId(null);
      setErrorMessage(err.message || 'Unable to analyze this image. Please try again.');
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

  const handleChallengeInput = (field: keyof typeof challengeInput, value: string) => {
    setChallengeInput((prev) => ({ ...prev, [field]: value }));
    setChallengeError(null);
  };

  const handleGenerateChallengeSummary = () => {
    const validation = validateChallengeSummaryInputs(challengeInput);
    if (!validation.valid) {
      setChallengeError(validation.message);
      return;
    }

    const result = buildChallengeSummary(challengeInput);
    setChallengeSummary(result);
    setChallengeError(null);
  };

  const handleCopyChallengeSummary = async () => {
    if (!challengeSummary) return;
    const success = await copyTextToClipboard(challengeSummary);
    if (success) {
      setChallengeCopied(true);
      window.setTimeout(() => setChallengeCopied(false), 2000);
    }
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

        {/* Workspace Body (with bottom padding for Flutter mobile nav bar) */}
        <main className="flex-1 p-3.5 sm:p-4 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
          {/* AI Provider Selector */}
          <section className="rounded-2xl border border-[#E2DDD3] bg-[#FAF8F4] p-4 sm:p-5 shadow-sm" aria-label="AI analysis mode">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#1C1917]">AI Analysis Mode</h2>
                <p className="mt-1 text-xs text-[#57534E]">
                  {aiMode === 'cloud'
                    ? 'Cloud Mode sends the selected image to Gemini. Each analysis uses your Gemini API quota.'
                    : 'Local Mode sends the image to your configured Ollama server only. It will not fall back to Gemini.'}
                </p>
              </div>
              <div className="inline-flex rounded-xl border border-[#CDC5B5] bg-white p-1 self-start" role="group" aria-label="Choose AI provider">
                <button type="button" onClick={() => setAiMode('cloud')} aria-pressed={aiMode === 'cloud'} className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${aiMode === 'cloud' ? 'bg-[#1C1917] text-white' : 'text-[#57534E] hover:bg-[#F4F1EA]'}`}>Cloud · Gemini</button>
                <button type="button" onClick={() => setAiMode('local')} aria-pressed={aiMode === 'local'} className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${aiMode === 'local' ? 'bg-[#0D9488] text-white' : 'text-[#57534E] hover:bg-[#F4F1EA]'}`}>Local · Ollama</button>
              </div>
            </div>
            {aiMode === 'local' && <p className="mt-3 rounded-lg bg-teal-50 p-3 text-xs text-teal-900">Requires Ollama running where the MOOS backend runs, with a vision model pulled (default: <code>gemma3:12b</code>). If MOOS is hosted remotely, this does not use your laptop’s Ollama automatically.</p>}
          </section>

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
            <div className="space-y-6">
              <PresetScenariosTab
                onSelectScenario={(sc) => {
                  handleSelectScenario(sc);
                  setActiveTab('inspection');
                }}
                activeScenarioId={activeScenarioId}
              />

              <section className="rounded-2xl border border-[#E2DDD3] bg-[#FAF8F4] p-4 sm:p-5 shadow-sm" aria-label="Challenge summary maker">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#857F75]">Challenge Summary Maker</p>
                    <h3 className="mt-1 text-base font-bold text-[#1C1917]">Hackathon summary</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateChallengeSummary}
                    className="rounded-lg bg-[#1C1917] px-3 py-2 text-xs font-bold text-white hover:bg-[#2C2927]"
                  >
                    Generate summary
                  </button>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {[
                    { key: 'problem', label: 'Problem or challenge' },
                    { key: 'affected', label: 'Who is affected and why it matters' },
                    { key: 'solution', label: 'Proposed MOOS solution' },
                    { key: 'features', label: 'Key features and intended impact' },
                    { key: 'assumptions', label: 'Assumptions, limitations, and what still needs validation' },
                  ].map(({ key, label }) => (
                    <label key={key} className="block text-xs font-bold text-[#1C1917]">
                      <span className="mb-2 block">{label}</span>
                      <textarea
                        aria-label={label}
                        value={challengeInput[key as keyof typeof challengeInput]}
                        onChange={(event) => handleChallengeInput(key as keyof typeof challengeInput, event.target.value)}
                        rows={key === 'problem' || key === 'affected' ? 5 : 4}
                        className="w-full rounded-xl border border-[#CDC5B5] bg-white px-3 py-2 text-sm text-[#1C1917] shadow-sm outline-none transition focus:border-[#0D9488] focus:ring-2 focus:ring-[#99F6E4]"
                      />
                    </label>
                  ))}
                </div>

                {challengeError && (
                  <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800" role="alert">
                    {challengeError}
                  </p>
                )}

                <div className="mt-5 rounded-2xl border border-[#E2DDD3] bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[#1C1917]">
                      <FileText className="h-4 w-4 text-[#0D9488]" />
                      <span className="text-xs font-bold uppercase tracking-[0.2em]">Generated summary</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyChallengeSummary}
                      disabled={!challengeSummary}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#CDC5B5] bg-[#FAF8F4] px-3 py-2 text-xs font-bold text-[#1C1917] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {challengeCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {challengeCopied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <textarea
                    aria-label="Challenge summary output"
                    readOnly
                    value={challengeSummary}
                    onFocus={(event) => event.currentTarget.select()}
                    rows={14}
                    className="w-full rounded-xl border border-[#E2DDD3] bg-[#FAF8F4] px-3 py-3 text-sm leading-6 text-[#1C1917] outline-none"
                  />
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Flutter Material 3 Mobile Navigation Bar with Centered FAB */}
      <FlutterMobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onCameraClick={() => setCameraDirectOpen(true)}
        onUploadClick={() => setShowUploadPanel((prev) => !prev)}
        violationCount={violationCount}
      />

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
