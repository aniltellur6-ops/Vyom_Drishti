import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const filePath = path.join(process.cwd(), "src", "data", "fallbackExperiments.json");
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(content);
    }
  } catch (e) {
    console.error("Failed to read fallback experiments:", e);
  }

  return res.status(200).json([]);
}
