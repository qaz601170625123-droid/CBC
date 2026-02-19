// /api/line-token.js
// 將 LINE 的 authorization code 換成 access token 和用戶 profile

export default async function handler(req, res) {
  // 只接受 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, redirectUri } = req.body;

  if (!code || !redirectUri) {
    return res.status(400).json({ error: 'Missing code or redirectUri' });
  }

  try {
    // Step 1: 用 code 換 access token
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: process.env.LINE_CHANNEL_ID,
        client_secret: process.env.LINE_CHANNEL_SECRET
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('Token 換取失敗:', tokenData);
      return res.status(400).json({ error: 'Token exchange failed', detail: tokenData });
    }

    // Step 2: 用 access token 取得用戶 profile
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const profile = await profileRes.json();

    if (!profile.userId) {
      return res.status(400).json({ error: 'Failed to get profile' });
    }

    // 回傳 profile（userId, displayName, pictureUrl）
    return res.status(200).json({
      success: true,
      profile: {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl || ''
      }
    });

  } catch (err) {
    console.error('line-token error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
