import { Redis } from "@upstash/redis";

const redis = new Redis({ 
  url: process.env.UPSTASH_URL, 
  token: process.env.UPSTASH_TOKEN 
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  if (req.headers.authorization !== `Bearer ${process.env.SECRET}`) {
    return res.status(401).end();
  }
  
  await redis.set("backend_url", req.body.url);
  res.json({ success: true, url: req.body.url });
}
