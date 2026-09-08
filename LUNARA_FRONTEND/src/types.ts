export type NavigationTab =
  | 'overview'
  | 'preprocessing'
  | 'workspace'
  | 'comparison'
  | 'experiments';

export type ViewportMode = 'dual' | '4quad' | 'split' | 'vector' | 'checker';

export interface TiePoint {
  id: string;
  movingX: number;
  movingY: number;
  refX: number;
  refY: number;
  lat: string;
  lon: string;
  confidence: number;
  residualError: number;
  status: 'inlier' | 'outlier';
}

export interface ExperimentRecord {
  id: string;
  timestamp: string;
  target: string;
  sensor: string;
  algorithm: string;
  inliers: number;
  totalMatches: number;
  inlierRatio: number;
  rmse: number;
  coverage: number;
  status: 'COMPLETE' | 'VALIDATED' | 'DRIFT' | 'UNMET';
  score: number;
  seed: string;
}

export interface BenchmarkMethod {
  name: string;
  citation: string;
  featureType: string;
  totalMatches: number;
  inliers: number;
  inlierRatio: number;
  rmse: number;
  spatialCoverage: number;
  latencySeconds: number;
  vramUsageMB: number;
  status: string;
  statusType: 'success' | 'marginal' | 'fail';
  description: string;
}
