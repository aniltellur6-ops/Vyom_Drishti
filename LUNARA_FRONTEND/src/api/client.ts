// src/api/client.ts
import fallbackExperimentsData from '../data/fallbackExperiments.json';

const FALLBACK_URL = "http://localhost:8000";
let CACHED_SERVER_URL = FALLBACK_URL;
let LAST_VERIFIED_URL = "";
let LAST_VERIFIED_TIME = 0;
const URL_CACHE_TTL_MS = 15000; // 15 seconds

export interface SystemStatus {
  status: string;
  gpu_available: boolean;
  extractor: string;
  matcher: string;
}

export interface ImageCondition {
  illumination_difference: string;
  illumination_delta?: number;
  texture: string;
  texture_variance?: number;
  shadow_coverage: number;
  resolution_difference: string;
  feature_density: string;
  overall_difficulty: string;
  recommended_method: string;
  recommended_preprocessing?: string;
  recommended_preprocessing_name?: string;
  preprocessing_reason?: string;
  reason: string;
}

export interface MatchingResult {
  job_id: string;
  status: string;
  method_used?: string;
  metrics: {
    inliers: number;
    inlier_ratio: number;
    rmse: number;
    coverage: number;
    runtime: number;
    transformation: number[][];
  };
  files: {
    registered_image: string;
    overlay_image: string;
    matches_viz: string;
    raw_reference: string;
    raw_moving: string;
    preprocessed_reference: string;
    preprocessed_moving: string;
  };
  preprocessing_metadata?: any;
}

export interface Experiment {
  id: string;
  name: string;
  method: string;
  status: string;
  created_at: string;
  metrics: {
    inliers: number;
    inlier_ratio: number;
    rmse: number;
    coverage: number;
    runtime: number;
    transformation?: number[][];
  };
  files?: {
    registered_image?: string;
    overlay_image?: string;
    matches_viz?: string;
    raw_reference?: string;
    raw_moving?: string;
    preprocessed_reference?: string;
    preprocessed_moving?: string;
  };
}

const STORAGE_KEY_EXPERIMENTS = 'lunara_cached_experiments';
const STORAGE_KEY_LAST_SYNC = 'lunara_experiments_last_sync';

/**
 * Check if a candidate backend URL is responsive and healthy
 */
async function checkUrlHealth(url: string, timeoutMs: number = 2200): Promise<boolean> {
  if (!url) return false;
  const cleanUrl = url.replace(/\/$/, '');
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${cleanUrl}/api/v1/system/status?_t=${Date.now()}`, {
      signal: controller.signal,
      headers: { 'ngrok-skip-browser-warning': 'true' },
      cache: 'no-store'
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

export const LunaraClient = {
  /**
   * Clears cached server URL so the next call performs full discovery
   */
  invalidateLiveUrl: () => {
    LAST_VERIFIED_URL = "";
    LAST_VERIFIED_TIME = 0;
  },

  /**
   * Intelligently resolves the active backend base URL (/api/v1)
   */
  getLiveUrl: async (forceRefresh: boolean = false): Promise<string> => {
    const now = Date.now();
    if (!forceRefresh && LAST_VERIFIED_URL && (now - LAST_VERIFIED_TIME < URL_CACHE_TTL_MS)) {
      return `${LAST_VERIFIED_URL}/api/v1`;
    }

    const isBrowser = typeof window !== 'undefined';
    const isLocalhost = isBrowser && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '[::1]'
    );

    // If running in local environment, check localhost:8000 first
    if (isLocalhost) {
      const localOk = await checkUrlHealth(FALLBACK_URL, 1200);
      if (localOk) {
        CACHED_SERVER_URL = FALLBACK_URL;
        LAST_VERIFIED_URL = FALLBACK_URL;
        LAST_VERIFIED_TIME = now;
        return `${FALLBACK_URL}/api/v1`;
      }
    }

    // Try fetching the dynamic Cloudflare/tunnel URL registered in Vercel/Redis
    try {
      let res = await fetch(`/api/url?_t=${Date.now()}`, { cache: 'no-store' }).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch(`https://vyom-drishti.vercel.app/api/url?_t=${Date.now()}`, { cache: 'no-store' }).catch(() => null);
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data.backendUrl) {
          const candidateUrl = data.backendUrl.replace(/\/$/, '');
          const isHealthy = await checkUrlHealth(candidateUrl, 2500);
          if (isHealthy) {
            CACHED_SERVER_URL = candidateUrl;
            LAST_VERIFIED_URL = candidateUrl;
            LAST_VERIFIED_TIME = now;
            return `${candidateUrl}/api/v1`;
          }
          console.warn(`Remote tunnel ${candidateUrl} is offline or unreachable.`);
        }
      }
    } catch (e) {
      console.warn("Failed to query dynamic tunnel URL:", e);
    }

    // If remote tunnel is not healthy or unreachable, try localhost as fallback
    const localOk = await checkUrlHealth(FALLBACK_URL, 1200);
    if (localOk) {
      CACHED_SERVER_URL = FALLBACK_URL;
      LAST_VERIFIED_URL = FALLBACK_URL;
      LAST_VERIFIED_TIME = now;
      return `${FALLBACK_URL}/api/v1`;
    }

    // Default fallback
    CACHED_SERVER_URL = FALLBACK_URL;
    return `${FALLBACK_URL}/api/v1`;
  },

  getSystemStatus: async (): Promise<SystemStatus> => {
    try {
      const baseUrl = await LunaraClient.getLiveUrl();
      const res = await fetch(`${baseUrl}/system/status?_t=${Date.now()}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        cache: 'no-store'
      });
      if (!res.ok) throw new Error("Failed to fetch system status");
      return res.json();
    } catch (err) {
      LunaraClient.invalidateLiveUrl();
      throw err;
    }
  },

  analyzeImages: async (refFile: File, srcFile: File): Promise<ImageCondition> => {
    const baseUrl = await LunaraClient.getLiveUrl();
    const formData = new FormData();
    formData.append("reference_img", refFile);
    formData.append("source_img", srcFile);

    const res = await fetch(`${baseUrl}/analyze`, {
      method: "POST",
      headers: { 'ngrok-skip-browser-warning': 'true' },
      body: formData,
    });
    if (!res.ok) {
      LunaraClient.invalidateLiveUrl();
      throw new Error("Failed to analyze images");
    }
    return res.json();
  },

  runMatching: async (
    refFile: File,
    srcFile: File,
    method: string = "auto",
    preprocessingMethod: string = "AUTO",
    referenceSensor: string = "AUTO",
    movingSensor: string = "AUTO"
  ): Promise<MatchingResult> => {
    const baseUrl = await LunaraClient.getLiveUrl();
    const formData = new FormData();
    formData.append("reference_img", refFile);
    formData.append("source_img", srcFile);
    formData.append("requested_method", method);
    formData.append("preprocessing_method", preprocessingMethod);
    formData.append("reference_sensor", referenceSensor);
    formData.append("moving_sensor", movingSensor);

    const res = await fetch(`${baseUrl}/match`, {
      method: "POST",
      headers: { 'ngrok-skip-browser-warning': 'true' },
      body: formData,
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to run matching pipeline");
    }

    const result: MatchingResult = await res.json();

    // Optimistically record the new experiment in local cache so ledger shows it immediately
    try {
      const newExp: Experiment = {
        id: result.job_id,
        name: `EXP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${result.job_id.slice(0, 4)}`,
        method: result.method_used || method,
        status: result.status === 'success' ? 'Successful' : 'Failed',
        created_at: new Date().toISOString(),
        metrics: {
          inliers: result.metrics.inliers,
          inlier_ratio: result.metrics.inlier_ratio,
          rmse: result.metrics.rmse,
          coverage: result.metrics.coverage,
          runtime: result.metrics.runtime,
        },
      };

      const existing = LunaraClient.getCachedExperiments();
      const updated = [newExp, ...existing.filter(e => e.id !== newExp.id)];
      localStorage.setItem(STORAGE_KEY_EXPERIMENTS, JSON.stringify(updated));
      localStorage.setItem(STORAGE_KEY_LAST_SYNC, Date.now().toString());
    } catch (e) {
      console.warn("Could not cache new experiment locally:", e);
    }

    return result;
  },

  /**
   * Synchronously returns cached or bundled experiment records for instant hydration
   */
  getCachedExperiments: (): Experiment[] => {
    if (typeof window === 'undefined') {
      return fallbackExperimentsData as Experiment[];
    }
    try {
      const cached = localStorage.getItem(STORAGE_KEY_EXPERIMENTS);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed reading cached experiments:", e);
    }
    return fallbackExperimentsData as Experiment[];
  },

  /**
   * Fetches experiments from the backend with automatic caching & fallback
   */
  getExperiments: async (forceRefresh: boolean = false): Promise<Experiment[]> => {
    // 1. Try fetching from live backend
    try {
      const baseUrl = await LunaraClient.getLiveUrl(forceRefresh);
      const res = await fetch(`${baseUrl}/experiments?_t=${Date.now()}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        cache: 'no-store'
      });
      if (res.ok) {
        const data: Experiment[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEY_EXPERIMENTS, JSON.stringify(data));
              localStorage.setItem(STORAGE_KEY_LAST_SYNC, Date.now().toString());
            } catch (e) {
              console.warn("Could not persist experiments to localStorage:", e);
            }
          }
          return data;
        }
      }
    } catch (e) {
      console.warn("Live backend experiments fetch failed, using cached records:", e);
      LunaraClient.invalidateLiveUrl();
    }

    // 2. Fallback to localStorage or bundled experiments
    return LunaraClient.getCachedExperiments();
  },

  /**
   * Clear localStorage cache and reload fallback data
   */
  clearExperimentCache: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_EXPERIMENTS);
      localStorage.removeItem(STORAGE_KEY_LAST_SYNC);
    }
    LunaraClient.invalidateLiveUrl();
  },

  /**
   * Returns current cache provenance metadata
   */
  getCacheInfo: (): { hasLiveSync: boolean; lastSyncTime: number | null } => {
    if (typeof window === 'undefined') {
      return { hasLiveSync: false, lastSyncTime: null };
    }
    const sync = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
    return {
      hasLiveSync: !!sync,
      lastSyncTime: sync ? parseInt(sync, 10) : null
    };
  },

  getResultUrl: (path: string): string => {
    return `${CACHED_SERVER_URL}${path}`;
  }
};
