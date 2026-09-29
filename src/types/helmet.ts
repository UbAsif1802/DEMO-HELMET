export type HelmetStatus = 'WEARING_HELMET' | 'NO_HELMET' | 'UNCERTAIN';

export type ViolationCategory =
  | 'NO_HELMET'
  | 'TRIPLE_RIDING'
  | 'POTENTIAL_SEATBELT_ISSUE'
  | 'POTENTIAL_OCCUPANCY_ISSUE'
  | 'NO_CONFIRMED_VIOLATION'
  | 'UNCERTAIN';

export interface LicensePlateInfo {
  value: string; // e.g. "MP04AB1234" or "NOT_READABLE"
  confidence: number;
  status: 'READABLE' | 'PARTIAL' | 'NOT_READABLE';
}

export interface TrafficDetection {
  id: number;
  vehicle_type: 'motorcycle' | 'scooter' | 'car' | 'other' | string;
  target_label: string; // e.g. "Rider 1", "Motorcycle 1", "Car 1"
  category: ViolationCategory;
  is_violation: boolean; // Confirmed visual violation (NO_HELMET, TRIPLE_RIDING)
  is_potential: boolean; // Potential issue (POTENTIAL_SEATBELT_ISSUE, POTENTIAL_OCCUPANCY_ISSUE)
  is_uncertain: boolean; // UNCERTAIN / requires manual review
  confidence: number; // 0.0 to 1.0 (e.g. 0.96)
  confidence_level: 'High' | 'Medium' | 'Low';
  evidence: string; // Short explanation
  occupants_count?: number;
  helmet_status?: HelmetStatus;
  seatbelt_status?: 'SEATBELT_VISIBLE' | 'SEATBELT_NOT_VISIBLE' | 'UNCERTAIN';
  license_plate?: LicensePlateInfo;
  timestamp?: string; // e.g. "00:07" or "00:07 - 00:11"
  evidence_frame?: string; // Captured frame / screenshot image
  box_2d?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
}

export interface VideoEvent {
  event_id: string; // e.g. "EV001"
  timestamp_start: string; // e.g. "00:07"
  timestamp_end: string; // e.g. "00:11"
  vehicle_type: string;
  violation: ViolationCategory;
  status: 'CONFIRMED' | 'POTENTIAL' | 'UNCERTAIN' | 'NO_CONFIRMED_VIOLATION';
  confidence: number;
  license_plate: LicensePlateInfo;
  evidence_frame?: string; // Base64 extracted screenshot frame
  observation: string;
  best_frame_index?: number;
}

export interface VideoMetadata {
  duration_seconds: number;
  frames_analyzed: number;
}

export interface VideoAnalysisReport {
  video_metadata: VideoMetadata;
  summary: {
    vehicles_detected: number;
    violations_detected: number;
  };
  events: VideoEvent[];
}

export interface TrafficSummary {
  total_riders: number;
  wearing_helmet: number;
  no_helmet: number;
  triple_riding: number;
  cars_detected: number;
  seatbelt_issues: number;
  occupancy_issues: number;
  uncertain: number;
}

export interface FinalAssessment {
  confirmed_violations: number;
  potential_issues: number;
  manual_review_required: boolean;
}

export interface QualityCheck {
  is_usable: boolean;
  message?: string;
}

export interface TrafficSafetyResponse {
  quality_check: QualityCheck;
  summary: TrafficSummary;
  detections: TrafficDetection[];
  final_assessment: FinalAssessment;
  video_report?: VideoAnalysisReport;
  // Backward compatibility aliases
  image_analysis?: ImageAnalysisSummary;
  riders?: RiderDetection[];
  final_result?: FinalResult;
}

// Legacy types preserved for backward compatibility
export interface RiderDetection {
  rider_id: number;
  vehicle_type: 'motorcycle' | 'scooter' | string;
  helmet_status: HelmetStatus;
  confidence: number;
  observation: string;
  role?: 'driver' | 'passenger' | string;
  box_2d?: [number, number, number, number];
}

export interface ImageAnalysisSummary {
  total_riders: number;
  wearing_helmet: number;
  no_helmet: number;
  uncertain: number;
}

export interface FinalResult {
  no_helmet_detected: boolean;
  no_helmet_count: number;
}

export type HelmetDetectionResponse = TrafficSafetyResponse;

export interface SampleScenario {
  id: string;
  title: string;
  tag: string;
  category: 'violation' | 'compliant' | 'dual_rider' | 'uncertain' | 'car_seatbelt' | 'triple_riding';
  description: string;
  imageUrl: string;
  mockResult: TrafficSafetyResponse;
}
