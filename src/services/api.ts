import type { 
  Anomaly, 
  Survey, 
  DashboardMetrics, 
  TemporalPoint,
  ProcessingJob,
  AnomalyFilters,
  ReviewDecision,
  ReportSummary,
  ModelFeedback
} from '../data/mockData';
import { 
  mockSurveys, 
  mockAnomalies, 
  mockDashboardMetrics,
  mockTemporalSeries,
  mockModelFeedback,
  HARBOURS
} from '../data/mockData';

// Simulated delay to mimic network request
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getDashboardMetrics = async (harbour?: string): Promise<DashboardMetrics> => {
  await delay(400);
  if (harbour && harbour !== 'Mumbai Harbor Q3') {
    const seed = harbour.length;
    return {
      normalRegions: 84 + seed * 2,
      knownAnomalies: 12 - seed % 4,
      unknownAnomalies: 7 + seed % 3,
      newChanges: 5 + seed % 2,
    };
  }
  return mockDashboardMetrics;
};

export const getSurveys = async (): Promise<Survey[]> => {
  await delay(600);
  return mockSurveys;
};

export const getAnomalies = async (filters?: AnomalyFilters, harbour?: string): Promise<Anomaly[]> => {
  await delay(500);
  let anomalies = [...mockAnomalies];
  
  if (harbour && harbour !== 'Mumbai Harbor Q3' && HARBOURS[harbour]) {
     const harborConfig = HARBOURS[harbour];
     
     const seed = harbour.charCodeAt(0) + harbour.length;
     const anomalyCount = 3 + (seed % 6); // Generate 3 to 8 distinct anomalies per harbour
     
     anomalies = Array.from({ length: anomalyCount }).map((_, i) => {
       const baseAnomaly = mockAnomalies[i % mockAnomalies.length];
       const center = harborConfig.waterCenter;
       const spread = harborConfig.spread;
       const randLat = (Math.sin(seed + i * 2) * spread);
       const randLng = (Math.cos(seed + i * 3) * spread);
       
       return {
         ...baseAnomaly,
         id: `ano_${harbour.replace(/\s+/g, '')}_${i}`,
         label: `Anomaly #${100 + (seed * 10) + i}`,
         latitude: center.lat + randLat,
         longitude: center.lng + randLng,
         overallScore: 50 + ((seed * i * 7) % 50),
         depthMeters: 10 + ((seed * i * 3) % 40),
         severity: ['normal', 'unusual', 'high'][(seed + i) % 3] as any,
         classification: ['unknown', 'known', 'false_positive'][(seed + i * 2) % 3] as any,
       };
     });
  }
  
  if (filters?.status && filters.status !== 'All') {
    anomalies = anomalies.filter(a => {
      if (filters.status === 'Unknown') return a.classification === 'unknown';
      if (filters.status === 'Known Object') return a.classification === 'known';
      if (filters.status === 'New Change') return a.severity === 'unusual' || a.severity === 'high';
      if (filters.status === 'High Priority') return a.priority === 'immediate' || a.priority === 'high';
      return true;
    });
  }
  
  return anomalies;
};

export const getAnomalyById = async (id: string, harbour?: string): Promise<Anomaly> => {
  const anomalies = await getAnomalies({}, harbour);
  const anomaly = anomalies.find(a => a.id === id);
  if (!anomaly) throw new Error('Anomaly not found');
  return anomaly;
};

export const startSurveyProcessing = async (_surveyId: string): Promise<ProcessingJob> => {
  await delay(4000); // simulate 4 second processing
  return {
    status: 'complete',
    anomaliesCount: 7
  };
};

export const getTemporalSeries = async (_anomalyId: string, harbour?: string): Promise<TemporalPoint[]> => {
  await delay(300);
  if (harbour && harbour !== 'Mumbai Harbor Q3') {
     const seed = harbour.length;
     return mockTemporalSeries.map(p => ({
       ...p,
       score: Math.min(100, Math.max(0, p.score + (seed % 5) * 5 - 10))
     }));
  }
  return mockTemporalSeries;
};

export const submitReview = async (anomalyId: string, decision: ReviewDecision): Promise<Anomaly> => {
  await delay(800);
  
  // Extract original ID if it has harbour suffix
  const originalId = anomalyId.split('_').length >= 2 ? `${anomalyId.split('_')[0]}_${anomalyId.split('_')[1]}` : anomalyId;
  
  let anomalyIndex = mockAnomalies.findIndex(a => a.id === originalId);
  if (anomalyIndex === -1) {
    anomalyIndex = mockAnomalies.findIndex(a => anomalyId.startsWith(a.id));
  }
  const baseAnomaly = anomalyIndex !== -1 ? mockAnomalies[anomalyIndex] : mockAnomalies[0];
  
  // @ts-ignore (newClass might not be on type, but we handle it)
  const newClass = (decision as any).newClass;
  
  const classification = newClass ? 'unknown' : 
                  decision.status === 'confirmed_unknown' ? 'unknown' : 
                  decision.status === 'known_object' ? 'known' : 
                  decision.status === 'false_positive' ? 'false_positive' : 'unknown';
  
  // In a real app this would call the backend, for mock we update the local copy
  const updatedAnomaly = {
    ...baseAnomaly,
    reviewStatus: decision.status,
    classification,
    label: newClass ? newClass : baseAnomaly.label
  } as Anomaly;
  
  // Mutate mockAnomalies so changes persist across tabs
  if (anomalyIndex !== -1) {
    mockAnomalies[anomalyIndex] = updatedAnomaly;
  }
  
  // Create a copy with the provided ID to return (in case it was a suffixed ID)
  return { ...updatedAnomaly, id: anomalyId };
};

export const getReportSummary = async (_surveyId: string): Promise<ReportSummary> => {
  await delay(500);
  return {
    surveyCoverage: "100%",
    normalRegions: 84,
    knownAnomalies: 12,
    unknownAnomalies: 7,
    newChanges: 5
  };
};

export const getModelFeedback = async (): Promise<ModelFeedback> => {
  await delay(200);
  return mockModelFeedback;
};

// ==========================================
// REAL-TIME WEBSOCKET MOCK
// ==========================================
// In a real application, this would connect to wss://api.abysswatch.com/ws/anomalies
export const subscribeToRealTimeAnomalies = (
  harbour: string,
  onUpdate: (anomalyId: string, updates: Partial<Anomaly>) => void,
  onNew: (anomaly: Anomaly) => void
) => {
  console.log(`[WS] Subscribed to real-time anomalies for ${harbour}`);
  
  // Simulate random confidence/score fluctuations
  const updateInterval = setInterval(() => {
    // Pick a random anomaly
    const randomAnomalyId = mockAnomalies[Math.floor(Math.random() * mockAnomalies.length)].id;
    // Fluctuate score by +/- 2
    const scoreDelta = Math.floor(Math.random() * 5) - 2;
    onUpdate(randomAnomalyId, { 
      overallScore: Math.max(0, Math.min(100, 90 + scoreDelta))
    });
  }, 3000);

  return () => {
    console.log(`[WS] Unsubscribed from real-time anomalies for ${harbour}`);
    clearInterval(updateInterval);
  };
};
