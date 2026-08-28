export type AnomalyClassification = "unknown" | "known" | "false_positive";
export type AnomalySeverity = "normal" | "unusual" | "high";
export type ReviewStatus = "pending" | "confirmed_unknown" | "known_object" | "false_positive";

export interface Survey {
  id: string;
  name: string;
  vessel: string;
  area: string;
  surveyDate: string;
  depthRange: string;
  status: "ready" | "processing" | "complete";
}

export interface Anomaly {
  id: string;
  label: string;
  classification: AnomalyClassification;
  severity: AnomalySeverity;
  reviewStatus: ReviewStatus;
  overallScore: number;
  spatialDeviationScore: number;
  temporalChangeScore: number;
  confidence: number;
  latitude: number;
  longitude: number;
  depthMeters: number;
  detectedAt: string;
  firstObserved: string;
  explanation: string;
  sonarImage: string;
  priority: "low" | "medium" | "high" | "immediate";
  notes?: string;
}

export interface ModelFeedback {
  currentModel: string;
  feedbackSamples: number;
  potentialRetrainingSet: number;
  nextModel: string;
}

export interface DashboardMetrics {
  normalRegions: number;
  knownAnomalies: number;
  unknownAnomalies: number;
  newChanges: number;
}

export interface ReportSummary {
  surveyCoverage: string;
  normalRegions: number;
  knownAnomalies: number;
  unknownAnomalies: number;
  newChanges: number;
}

export interface TemporalPoint {
  date: string;
  score: number;
}

export interface ProcessingJob {
  status: "complete";
  anomaliesCount: number;
}

export interface AnomalyFilters {
  status?: string;
  priority?: string;
}

export interface ReviewDecision {
  status: ReviewStatus;
  notes?: string;
  newClass?: string;
}

export const HARBOURS: Record<string, { lat: number; lng: number, waterCenter: { lat: number, lng: number }, spread: number }> = {
  'Mumbai Harbor Q3': { lat: 18.9387, lng: 72.8353, waterCenter: { lat: 18.90, lng: 72.78 }, spread: 0.03 },
  'Chennai Port': { lat: 13.0827, lng: 80.2707, waterCenter: { lat: 13.08, lng: 80.32 }, spread: 0.02 },
  'Kochi Harbor': { lat: 9.9312, lng: 76.2673, waterCenter: { lat: 9.95, lng: 76.20 }, spread: 0.02 },
  'Visakhapatnam Port': { lat: 17.6868, lng: 83.2185, waterCenter: { lat: 17.64, lng: 83.28 }, spread: 0.01 },
  'Jawaharlal Nehru Port': { lat: 18.9500, lng: 72.9500, waterCenter: { lat: 18.93, lng: 72.91 }, spread: 0.015 },
  'Kolkata Port': { lat: 22.5314, lng: 88.3225, waterCenter: { lat: 22.55, lng: 88.315 }, spread: 0.002 }, // Narrow river
  'Paradip Port': { lat: 20.2662, lng: 86.6775, waterCenter: { lat: 20.22, lng: 86.72 }, spread: 0.02 },
};

// Generate realistic mock coordinates around Mumbai harbor (approx 18.9387 N, 72.8353 E)
// Mumbai water is South and West of the port, so we offset negatively
const BASE_LAT = HARBOURS['Mumbai Harbor Q3'].waterCenter.lat;
const BASE_LNG = HARBOURS['Mumbai Harbor Q3'].waterCenter.lng;

const generateOffshoreLat = (base: number, offset: number) => base + (Math.random() - 0.5) * offset;
const generateOffshoreLng = (base: number, offset: number) => base + (Math.random() - 0.5) * offset;

export const mockSurveys: Survey[] = [
  {
    id: "surv_001",
    name: "Mumbai Harbor Approach - Q3",
    vessel: "R/V Samudra",
    area: "Sector 7A",
    surveyDate: "2026-08-27T10:00:00Z",
    depthRange: "15-45m",
    status: "ready",
  },
  {
    id: "surv_002",
    name: "Coastal Baseline 2025",
    vessel: "USV-09",
    area: "Sector 7A",
    surveyDate: "2025-11-15T08:00:00Z",
    depthRange: "15-45m",
    status: "complete",
  },
];

export const mockAnomalies: Anomaly[] = [
  {
    id: "ano_017",
    label: "Anomaly #017",
    classification: "unknown",
    severity: "high",
    reviewStatus: "pending",
    overallScore: 92,
    spatialDeviationScore: 88,
    temporalChangeScore: 95,
    confidence: 91,
    latitude: generateOffshoreLat(BASE_LAT, 0.015),
    longitude: generateOffshoreLng(BASE_LNG, 0.015),
    depthMeters: 38.4,
    detectedAt: "2026-08-27T14:32:00Z",
    firstObserved: "2026-08-27T14:32:00Z",
    explanation: "The model detected a high-contrast edge cluster that differs from the local seabed texture. The feature was not present in the previous survey and remains spatially coherent across adjacent tiles. Because the temporal change score is high, the model recommends immediate human review.",
    sonarImage: "sonar_017.png",
    priority: "immediate",
  },
  {
    id: "ano_021",
    label: "Anomaly #021",
    classification: "unknown",
    severity: "high",
    reviewStatus: "pending",
    overallScore: 89,
    spatialDeviationScore: 85,
    temporalChangeScore: 90,
    confidence: 88,
    latitude: generateOffshoreLat(BASE_LAT, 0.01),
    longitude: generateOffshoreLng(BASE_LNG, 0.01),
    depthMeters: 41.2,
    detectedAt: "2026-08-27T14:45:00Z",
    firstObserved: "2026-08-27T14:45:00Z",
    explanation: "A distinct shadow indicates an object protruding 2.5m above the seabed. Geometric regularity suggests a man-made origin.",
    sonarImage: "sonar_021.png",
    priority: "high",
  },
  {
    id: "ano_009",
    label: "Anomaly #009",
    classification: "known",
    severity: "unusual",
    reviewStatus: "known_object",
    overallScore: 65,
    spatialDeviationScore: 70,
    temporalChangeScore: 20,
    confidence: 98,
    latitude: generateOffshoreLat(BASE_LAT, 0.015),
    longitude: generateOffshoreLng(BASE_LNG, 0.015),
    depthMeters: 22.5,
    detectedAt: "2026-08-27T11:15:00Z",
    firstObserved: "2025-11-15T08:00:00Z",
    explanation: "Matches acoustic signature and coordinates of known sunken barge (Wreck #45). Negligible temporal change.",
    sonarImage: "sonar_009.png",
    priority: "low",
  },
  {
    id: "ano_004",
    label: "Anomaly #004",
    classification: "unknown",
    severity: "unusual",
    reviewStatus: "pending",
    overallScore: 72,
    spatialDeviationScore: 78,
    temporalChangeScore: 65,
    confidence: 82,
    latitude: generateOffshoreLat(BASE_LAT, 0.02),
    longitude: generateOffshoreLng(BASE_LNG, 0.02),
    depthMeters: 31.0,
    detectedAt: "2026-08-27T10:45:00Z",
    firstObserved: "2026-08-27T10:45:00Z",
    explanation: "Area of high reflectivity contrasting with surrounding mud. Potential debris field or changing sediment pattern.",
    sonarImage: "sonar_004.png",
    priority: "medium",
  },
  {
    id: "ano_001",
    label: "Anomaly #001",
    classification: "false_positive",
    severity: "normal",
    reviewStatus: "false_positive",
    overallScore: 35,
    spatialDeviationScore: 40,
    temporalChangeScore: 10,
    confidence: 95,
    latitude: generateOffshoreLat(BASE_LAT, 0.005),
    longitude: generateOffshoreLng(BASE_LNG, 0.005),
    depthMeters: 28.5,
    detectedAt: "2026-08-27T10:10:00Z",
    firstObserved: "2026-08-27T10:10:00Z",
    explanation: "Initially flagged as an anomaly due to aeration in the water column (wake from a passing vessel).",
    sonarImage: "sonar_001.png",
    priority: "low",
  },
  {
    id: "ano_028",
    label: "Anomaly #028",
    classification: "unknown",
    severity: "unusual",
    reviewStatus: "pending",
    overallScore: 75,
    spatialDeviationScore: 60,
    temporalChangeScore: 88,
    confidence: 85,
    latitude: generateOffshoreLat(BASE_LAT, 0.025),
    longitude: generateOffshoreLng(BASE_LNG, 0.025),
    depthMeters: 18.2,
    detectedAt: "2026-08-27T15:20:00Z",
    firstObserved: "2026-08-27T15:20:00Z",
    explanation: "Significant scouring observed around existing pipeline infrastructure, representing a new change from the baseline.",
    sonarImage: "sonar_028.png",
    priority: "medium",
  },
  {
    id: "ano_012",
    label: "Anomaly #012",
    classification: "known",
    severity: "unusual",
    reviewStatus: "known_object",
    overallScore: 55,
    spatialDeviationScore: 85,
    temporalChangeScore: 5,
    confidence: 99,
    latitude: generateOffshoreLat(BASE_LAT, 0.012),
    longitude: generateOffshoreLng(BASE_LNG, 0.012),
    depthMeters: 15.0,
    detectedAt: "2026-08-27T12:05:00Z",
    firstObserved: "2024-05-10T09:00:00Z",
    explanation: "Confirmed rock outcropping. Matches historical survey data with no morphological changes.",
    sonarImage: "sonar_012.png",
    priority: "low",
  },
  {
    id: "ano_031",
    label: "Anomaly #031",
    classification: "unknown",
    severity: "high",
    reviewStatus: "pending",
    overallScore: 88,
    spatialDeviationScore: 82,
    temporalChangeScore: 92,
    confidence: 89,
    latitude: generateOffshoreLat(BASE_LAT, 0.008),
    longitude: generateOffshoreLng(BASE_LNG, 0.008),
    depthMeters: 45.5,
    detectedAt: "2026-08-27T16:10:00Z",
    firstObserved: "2026-08-27T16:10:00Z",
    explanation: "Linear feature spanning 15 meters, inconsistent with natural topology. High temporal deviation indicates recent placement.",
    sonarImage: "sonar_031.png",
    priority: "high",
  },
  {
    id: "ano_015",
    label: "Anomaly #015",
    classification: "unknown",
    severity: "unusual",
    reviewStatus: "pending",
    overallScore: 68,
    spatialDeviationScore: 75,
    temporalChangeScore: 50,
    confidence: 78,
    latitude: generateOffshoreLat(BASE_LAT, 0.018),
    longitude: generateOffshoreLng(BASE_LNG, 0.018),
    depthMeters: 29.8,
    detectedAt: "2026-08-27T13:40:00Z",
    firstObserved: "2026-08-27T13:40:00Z",
    explanation: "Diffuse acoustic return. May represent a school of fish near the seabed or a transient sediment cloud.",
    sonarImage: "sonar_015.png",
    priority: "low",
  },
  {
    id: "ano_007",
    label: "Anomaly #007",
    classification: "known",
    severity: "normal",
    reviewStatus: "known_object",
    overallScore: 42,
    spatialDeviationScore: 60,
    temporalChangeScore: 15,
    confidence: 96,
    latitude: generateOffshoreLat(BASE_LAT, 0.005),
    longitude: generateOffshoreLng(BASE_LNG, 0.005),
    depthMeters: 33.3,
    detectedAt: "2026-08-27T10:55:00Z",
    firstObserved: "2025-11-15T08:00:00Z",
    explanation: "Known telecommunications cable track. Acoustic signature is consistent with baseline.",
    sonarImage: "sonar_007.png",
    priority: "low",
  }
];

export const mockDashboardMetrics: DashboardMetrics = {
  normalRegions: 84,
  knownAnomalies: 12,
  unknownAnomalies: 7,
  newChanges: 5
};

export const mockModelFeedback: ModelFeedback = {
  currentModel: "v1.0",
  feedbackSamples: 18,
  potentialRetrainingSet: 7,
  nextModel: "v1.1"
};

export const mockTemporalSeries: TemporalPoint[] = [
  { date: "Mar '25", score: 10 },
  { date: "Jun '25", score: 12 },
  { date: "Sep '25", score: 15 },
  { date: "Dec '25", score: 11 },
  { date: "Mar '26", score: 14 },
  { date: "Aug '26", score: 95 }
];
