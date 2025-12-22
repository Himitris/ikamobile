import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Endpoint proxy pour toutes les requêtes vers Ikariam
 * POST /api/proxy
 * Body: {
 *   url: string,
 *   cookies: string,
 *   method?: string,
 *   body?: any
 * }
 */
app.post('/api/proxy', async (req, res) => {
  try {
    const { url, cookies, method = 'GET', body } = req.body;

    if (!url || !cookies) {
      return res.status(400).json({
        success: false,
        error: 'URL et cookies requis',
      });
    }

    console.log(`[PROXY] ${method} ${url}`);
    console.log(`[COOKIES] ${cookies.substring(0, 50)}...`);

    // Effectue la requête vers Ikariam
    const response = await fetch(url, {
      method,
      headers: {
        'Cookie': cookies,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        ...(body && { 'Content-Type': 'application/x-www-form-urlencoded' }),
      },
      ...(body && { body }),
    });

    const html = await response.text();

    console.log(`[RESPONSE] Status: ${response.status}, Length: ${html.length}`);

    // Récupère les cookies de réponse (si le serveur en envoie)
    const setCookieHeader = response.headers.get('set-cookie');

    res.json({
      success: true,
      data: html,
      status: response.status,
      cookies: setCookieHeader || null,
    });
  } catch (error) {
    console.error('[ERROR]', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur du serveur proxy',
    });
  }
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Proxy Ikariam Mobile opérationnel',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend proxy Ikariam Mobile démarré sur le port ${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/proxy`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
});
