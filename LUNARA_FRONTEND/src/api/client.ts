// src/api/client.ts
import fallbackExperimentsData from '../data/fallbackExperiments.json';

const LOCAL_URL_IPV4 = "http://127.0.0.1:8000";
const LOCAL_URL_NAME = "http://localhost:8000";
const FALLBACK_URL = LOCAL_URL_IPV4;

let CACHED_SERVER_URL = FALLBACK_URL;
let LAST_VERIFIED_URL = "";
let LAST_VERIFIED_TIME = 0;
const URL_CACHE_TTL_MS = 20000; // 20 seconds cache for verified URL

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
  recommended_method_key?: string;
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
async function checkUrlHealth(url: string, timeoutMs: number = 2500): Promise<boolean> {
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

/**
 * Intelligent deduplicating 3-way merge between:
 * 1) Incoming live server records
 * 2) Current localStorage records
 * 3) Bundled static fallback archive
 * Guarantees zero lost records across refreshes or cache wipes!
 */
function mergeExperimentLists(
  primary: Experiment[],
  secondary: Experiment[],
  tertiary: Experiment[] = []
): Experiment[] {
  const map = new Map<string, Experiment>();

  // 1. Add bundled tertiary historical data
  tertiary.forEach(exp => {
    if (exp && exp.id) map.set(exp.id, exp);
  });

  // 2. Add local storage records (preserves local runs)
  secondary.forEach(exp => {
    if (exp && exp.id) {
      const existing = map.get(exp.id);
      map.set(exp.id, {
        ...existing,
        ...exp,
        files: exp.files || existing?.files,
        metrics: {
          ...existing?.metrics,
          ...exp.metrics,
          transformation: exp.metrics?.transformation || existing?.metrics?.transformation
        }
      });
    }
  });

  // 3. Add live server records (highest authority for updated metrics)
  primary.forEach(exp => {
    if (exp && exp.id) {
      const existing = map.get(exp.id);
      map.set(exp.id, {
        ...existing,
        ...exp,
        files: exp.files || existing?.files,
        metrics: {
          ...existing?.metrics,
          ...exp.metrics,
          transformation: exp.metrics?.transformation || existing?.metrics?.transformation
        }
      });
    }
  });

  // Convert to array and sort descending by created_at
  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA;
  });
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
   * Tries local IPv4 127.0.0.1:8000 first on local host, then localhost:8000,
   * then remote Cloudflare tunnel from Vercel.
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

    // 1. If running on local machine, check local endpoints first
    if (isLocalhost) {
      const localIpv4Ok = await checkUrlHealth(LOCAL_URL_IPV4, 2000);
      if (localIpv4Ok) {
        CACHED_SERVER_URL = LOCAL_URL_IPV4;
        LAST_VERIFIED_URL = LOCAL_URL_IPV4;
        LAST_VERIFIED_TIME = now;
        return `${LOCAL_URL_IPV4}/api/v1`;
      }

      const localNameOk = await checkUrlHealth(LOCAL_URL_NAME, 2000);
      if (localNameOk) {
        CACHED_SERVER_URL = LOCAL_URL_NAME;
        LAST_VERIFIED_URL = LOCAL_URL_NAME;
        LAST_VERIFIED_TIME = now;
        return `${LOCAL_URL_NAME}/api/v1`;
      }
    }

    // 2. Query dynamic Cloudflare tunnel registered in Vercel
    try {
      let res = await fetch(`/api/url?_t=${Date.now()}`, { cache: 'no-store' }).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch(`https://vyom-drishti.vercel.app/api/url?_t=${Date.now()}`, { cache: 'no-store' }).catch(() => null);
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data.backendUrl) {
          const candidateUrl = data.backendUrl.replace(/\/$/, '');
          const isHealthy = await checkUrlHealth(candidateUrl, 3000);
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

    // 3. Fallback to local IPv4 check
    const localOk = await checkUrlHealth(FALLBACK_URL, 1500);
    if (localOk) {
      CACHED_SERVER_URL = FALLBACK_URL;
      LAST_VERIFIED_URL = FALLBACK_URL;
      LAST_VERIFIED_TIME = now;
      return `${FALLBACK_URL}/api/v1`;
    }

    // 4. Default fallback
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
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch system status`);
      return res.json();
    } catch (err) {
      LunaraClient.invalidateLiveUrl();
      // Try once more with fresh URL resolution
      const freshBase = await LunaraClient.getLiveUrl(true);
      const res2 = await fetch(`${freshBase}/system/status?_t=${Date.now()}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        cache: 'no-store'
      });
      if (!res2.ok) throw err;
      return res2.json();
    }
  },

  analyzeImages: async (refFile: File, srcFile: File): Promise<ImageCondition> => {
    const makeRequest = async (baseUrl: string) => {
      const formData = new FormData();
      formData.append("reference_img", refFile);
      formData.append("source_img", srcFile);

      return fetch(`${baseUrl}/analyze`, {
        method: "POST",
        headers: { 'ngrok-skip-browser-warning': 'true' },
        body: formData,
      });
    };

    try {
      const baseUrl = await LunaraClient.getLiveUrl();
      const res = await makeRequest(baseUrl);
      if (!res.ok) {
        const errorDetail = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
        throw new Error(errorDetail.detail || "Analysis failed on backend");
      }
      return res.json();
    } catch (err: any) {
      console.warn("First analysis attempt failed, retrying with fresh live URL...", err);
      LunaraClient.invalidateLiveUrl();
      const freshBase = await LunaraClient.getLiveUrl(true);
      const res2 = await makeRequest(freshBase);
      if (!res2.ok) {
        const errorDetail = await res2.json().catch(() => ({ detail: `HTTP ${res2.status}` }));
        throw new Error(errorDetail.detail || err.message || "Failed to analyze image conditions");
      }
      return res2.json();
    }
  },

  previewPreprocessing: async (
    file: File,
    config: {
      resize_scale?: number;
      percentile_norm?: boolean;
      clahe?: boolean;
      denoise?: boolean;
    } = {}
  ): Promise<Blob> => {
    const makeRequest = async (baseUrl: string) => {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("resize_scale", (config.resize_scale ?? 1.0).toString());
      formData.append("percentile_norm", (config.percentile_norm ?? true).toString());
      formData.append("clahe", (config.clahe ?? false).toString());
      formData.append("denoise", (config.denoise ?? false).toString());

      return fetch(`${baseUrl}/preprocess/preview`, {
        method: "POST",
        headers: { 'ngrok-skip-browser-warning': 'true' },
        body: formData,
      });
    };

    let res: Response;
    try {
      const baseUrl = await LunaraClient.getLiveUrl();
      res = await makeRequest(baseUrl);
    } catch (networkErr: any) {
      console.warn("Preprocessing preview hit network drop, retrying...", networkErr);
      LunaraClient.invalidateLiveUrl();
      const freshBase = await LunaraClient.getLiveUrl(true);
      res = await makeRequest(freshBase);
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Preprocessing preview failed with HTTP status ${res.status}`);
    }

    return res.blob();
  },

  runMatching: async (
    refFile: File,
    srcFile: File,
    method: string = "auto",
    preprocessingMethod: string = "AUTO",
    referenceSensor: string = "AUTO",
    movingSensor: string = "AUTO"
  ): Promise<MatchingResult> => {
    const makeRequest = async (baseUrl: string) => {
      const formData = new FormData();
      formData.append("reference_img", refFile);
      formData.append("source_img", srcFile);
      formData.append("requested_method", method);
      formData.append("preprocessing_method", preprocessingMethod);
      formData.append("reference_sensor", referenceSensor);
      formData.append("moving_sensor", movingSensor);

      return fetch(`${baseUrl}/match`, {
        method: "POST",
        headers: { 'ngrok-skip-browser-warning': 'true' },
        body: formData,
      });
    };

    let res: Response;
    try {
      const baseUrl = await LunaraClient.getLiveUrl();
      res = await makeRequest(baseUrl);
    } catch (networkErr: any) {
      console.warn("Matching request hit network drop. Invalidate URL and retry...", networkErr);
      LunaraClient.invalidateLiveUrl();
      const freshBase = await LunaraClient.getLiveUrl(true);
      res = await makeRequest(freshBase);
    }
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Matching pipeline failed with HTTP status ${res.status}`);
    }

    const result: MatchingResult = await res.json();

    // Optimistically record the new experiment with full file provenance
    try {
      const newExp: Experiment = {
        id: result.job_id,
        name: `EXP-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${result.job_id.slice(0, 4)}`,
        method: result.method_used || method,
        status: result.status === 'success' ? 'Successful' : 'Failed',
        created_at: new Date().toISOString(),
        metrics: {
          inliers: result.metrics.inliers,
          inlier_ratio: result.metrics.inlier_ratio,
          rmse: result.metrics.rmse,
          coverage: result.metrics.coverage,
          runtime: result.metrics.runtime,
          transformation: result.metrics.transformation,
        },
        files: result.files,
      };

      const existing = LunaraClient.getCachedExperiments();
      const merged = mergeExperimentLists([newExp], existing, fallbackExperimentsData as Experiment[]);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_EXPERIMENTS, JSON.stringify(merged));
        localStorage.setItem(STORAGE_KEY_LAST_SYNC, Date.now().toString());
        // Broadcast custom event so ExperimentsView updates immediately
        window.dispatchEvent(new CustomEvent('lunara_experiment_added', { detail: newExp }));
      }
    } catch (e) {
      console.warn("Could not cache new experiment locally:", e);
    }

    return result;
  },

  /**
   * Synchronously returns cached or bundled experiment records for instant hydration
   */
  getCachedExperiments: (): Experiment[] => {
    const fallbackList = (fallbackExperimentsData || []) as Experiment[];
    if (typeof window === 'undefined') {
      return fallbackList;
    }
    try {
      const cached = localStorage.getItem(STORAGE_KEY_EXPERIMENTS);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with fallback to ensure bundled historical records are never missing
          return mergeExperimentLists(parsed, [], fallbackList);
        }
      }
    } catch (e) {
      console.warn("Failed reading cached experiments:", e);
    }
    return fallbackList;
  },

  /**
   * Fetches experiments from the backend with deduplicating 3-way merge
   * NEVER drops historical records or newly created experiments!
   */
  getExperiments: async (forceRefresh: boolean = false): Promise<Experiment[]> => {
    const cachedLocal = LunaraClient.getCachedExperiments();
    const fallbackList = (fallbackExperimentsData || []) as Experiment[];

    // 1. Try fetching from live backend
    try {
      const baseUrl = await LunaraClient.getLiveUrl(forceRefresh);
      const res = await fetch(`${baseUrl}/experiments?_t=${Date.now()}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        cache: 'no-store'
      });
      if (res.ok) {
        const serverData: Experiment[] = await res.json();
        if (Array.isArray(serverData)) {
          // Merge server data with local cache and fallback
          const merged = mergeExperimentLists(serverData, cachedLocal, fallbackList);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEY_EXPERIMENTS, JSON.stringify(merged));
              localStorage.setItem(STORAGE_KEY_LAST_SYNC, Date.now().toString());
            } catch (e) {
              console.warn("Could not persist experiments to localStorage:", e);
            }
          }
          return merged;
        }
      }
    } catch (e) {
      console.warn("Live backend experiments fetch failed, using cached records:", e);
      LunaraClient.invalidateLiveUrl();
    }

    // 2. Return merged cached records
    return cachedLocal;
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

  /**
   * Normalizes image and artifact URLs so both relative and absolute paths load cleanly
   */
  getResultUrl: (path?: string): string => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const base = CACHED_SERVER_URL || FALLBACK_URL;
    const cleanBase = base.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  }
};
