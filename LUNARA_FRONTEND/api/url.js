import { Redis } from "@upstash/redis";

const redis = new Redis({ 
  url: process.env.UPSTASH_URL, 
  token: process.env.UPSTASH_TOKEN 
});

export default async function handler(req, res) {
  // Add CORS headers for local development testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  // Anti-cache headers to prevent serving stale tunnel URLs
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = await redis.get("backend_url");
  res.json({ backendUrl: url });
}

