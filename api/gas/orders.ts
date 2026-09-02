import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const gasUrl = process.env.GAS_WEBAPP_URL;

  if (!gasUrl) {
    return res.status(500).json({ error: 'GAS_WEBAPP_URL is missing in environment variables' });
  }

  try {
    const response = await fetch(gasUrl, {
      method: req.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('GAS Fetch Error:', error);
    return res.status(500).json({ error: 'Failed to communicate with Google Apps Script' });
  }
}
