import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import cookieParser from "cookie-parser";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

const ADMIN_CONFIG_PATH = path.join(process.cwd(), 'admin-config.json');

// Helper to get/set admin config (tokens and sheetId)
const getAdminConfig = () => {
  if (fs.existsSync(ADMIN_CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(ADMIN_CONFIG_PATH, 'utf-8'));
    } catch (e) {
      return {};
    }
  }
  return {};
};

const saveAdminConfig = (config: any) => {
  const current = getAdminConfig();
  fs.writeFileSync(ADMIN_CONFIG_PATH, JSON.stringify({ ...current, ...config }));
};

// Google OAuth Configuration
const getGoogleCredentials = () => {
  const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
  
  if (!clientId || !clientSecret) {
    console.error("❌ CRITICAL ERROR: Missing Google OAuth environment variables (GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)");
  }
  
  return { clientId, clientSecret };
};

// Helper to get dynamic redirect URI
const getRedirectUri = (req: express.Request) => {
  // Force use of APP_URL environment variable to ensure consistency
  const base = (process.env.APP_URL || "").trim().replace(/\/$/, "");
  const uri = `${base}/auth/google/callback`;
  console.log(`🔗 Forced Redirect URI: ${uri}`);
  return uri;
};

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'openid',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

// Auth Routes
const ADMIN_EMAILS = ['peapranburiforwork@gmail.com'];

app.get("/api/debug/env", (req, res) => {
  const { clientId, clientSecret } = getGoogleCredentials();
  res.json({
    clientId: clientId ? `${clientId.substring(0, 5)}...` : 'MISSING',
    clientSecret: clientSecret ? `${clientSecret.substring(0, 5)}...` : 'MISSING',
    nodeEnv: process.env.NODE_ENV,
    generatedRedirectUri: getRedirectUri(req),
    headers: {
      host: req.get('host'),
      forwardedHost: req.headers['x-forwarded-host'],
      forwardedProto: req.headers['x-forwarded-proto']
    }
  });
});

app.get("/api/auth/google/url", (req, res) => {
  const { clientId, clientSecret } = getGoogleCredentials();
  
  if (!clientId || !clientSecret) {
    return res.status(500).json({ 
      error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the app settings.' 
    });
  }

  const oauth2Client = new OAuth2Client(
    clientId,
    clientSecret,
    getRedirectUri(req)
  );
  
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.json({ url });
});

app.get(["/auth/google/callback", "/auth/google/callback/"], async (req, res) => {
  const { code } = req.query;
  const { clientId, clientSecret } = getGoogleCredentials();

  console.log('DEBUG: Callback received');
  console.log('DEBUG: clientId exists:', !!clientId);
  console.log('DEBUG: code exists:', !!code);

  if (!clientId || !clientSecret) {
    console.error("❌ Google OAuth credentials missing in callback");
    return res.status(500).send("Google OAuth is not configured on the server.");
  }

  if (!code) {
    console.error("❌ Authorization code missing in callback");
    return res.status(400).send("Authorization code is missing.");
  }

  const redirectUri = getRedirectUri(req);
  console.log(`DEBUG: Using Redirect URI: ${redirectUri}`);

  const oauth2Client = new OAuth2Client(
    clientId,
    clientSecret,
    redirectUri
  );

  try {
    console.log('DEBUG: Attempting to get tokens...');
    const { tokens } = await oauth2Client.getToken(code as string);
    console.log('DEBUG: Tokens received successfully');
    oauth2Client.setCredentials(tokens);
    
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    console.log('DEBUG: Fetching user info...');
    const userInfo = await oauth2.userinfo.get();
    
    const email = userInfo.data.email;
    const name = userInfo.data.name;
    console.log(`DEBUG: User authenticated: ${email}`);

    if (ADMIN_EMAILS.includes(email!)) {
      saveAdminConfig({ tokens });
    }

    const userProfile = {
      id: userInfo.data.id,
      email,
      name,
      role: ADMIN_EMAILS.includes(email!) ? 'admin' : 'sender',
      department: 'Admin Office'
    };

    res.cookie('user_profile', JSON.stringify(userProfile), {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', user: ${JSON.stringify(userProfile)} }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('❌ Auth Callback Error:', error);
    const errorDetails = error.response?.data || error.message || 'Unknown error';
    res.status(500).send(`Authentication failed: ${JSON.stringify(errorDetails)}`);
  }
});

app.get("/api/auth/me", (req, res) => {
  const profileStr = req.cookies.user_profile;
  if (!profileStr) return res.status(401).json({ error: 'Not authenticated' });
  res.json(JSON.parse(profileStr));
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie('user_profile');
  res.json({ success: true });
});

app.get("/api/admin/status", (req, res) => {
  const config = getAdminConfig();
  res.json({ 
    isConfigured: !!config.tokens,
    hasSheet: !!config.sheetId 
  });
});

// Middleware to check if user is admin
const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const profileStr = req.cookies.user_profile;
  if (!profileStr) return res.status(401).json({ error: 'Not authenticated' });
  const profile = JSON.parse(profileStr);
  if (profile.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

// Protected Admin Routes
app.post("/api/sheets/sync", isAdmin, async (req, res) => {
  const config = getAdminConfig();
  if (!config.tokens) {
    return res.status(401).json({ error: 'Admin has not linked Google Drive yet' });
  }

  const { documents } = req.body;
  const { clientId, clientSecret } = getGoogleCredentials();
  
  const oauth2Client = new OAuth2Client(
    clientId,
    clientSecret
  );
  oauth2Client.setCredentials(config.tokens);
  
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  try {
    let targetSheetId = config.sheetId;
    let firstSheetName = 'Sheet1';

    // Verify if sheet exists, if not, we'll create a new one
    if (targetSheetId) {
      try {
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: targetSheetId });
        firstSheetName = spreadsheet.data.sheets?.[0]?.properties?.title || 'Sheet1';
      } catch (e) {
        targetSheetId = null; // Sheet might have been deleted or inaccessible
      }
    }

    if (!targetSheetId) {
      const spreadsheet = await sheets.spreadsheets.create({
        requestBody: { properties: { title: `DocDelivery_Database_System` } }
      });
      targetSheetId = spreadsheet.data.spreadsheetId;
      firstSheetName = spreadsheet.data.sheets?.[0]?.properties?.title || 'Sheet1';
      saveAdminConfig({ sheetId: targetSheetId });
    }

    const values = [
      ['ID', 'Document Number', 'Item', 'Payee', 'Amount', 'Sender', 'Submitted At', 'Status', 'Received By', 'Received At', 'Verification Code', 'Timeline/Messages'],
      ...documents.map((doc: any) => [
        doc.id, doc.documentNumber, doc.item, doc.payee, doc.amount, doc.sender, doc.submittedAt, doc.status,
        doc.receivedBy || '-', doc.receivedAt || '-', doc.verificationCode,
        (doc.history || []).map((h: any) => `[${new Date(h.timestamp).toISOString()}] ${h.user}: ${h.action}${h.message ? ` - ${h.message}` : ''}`).join('\n')
      ])
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: targetSheetId!,
      range: `${firstSheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values }
    });

    res.json({ success: true, sheetId: targetSheetId, url: `https://docs.google.com/spreadsheets/d/${targetSheetId}` });
  } catch (error: any) {
    console.error('❌ Sync Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to sync to Google Sheets', details: error.message });
  }
});

app.get("/api/sheets/load", async (req, res) => {
  const config = getAdminConfig();
  if (!config.tokens || !config.sheetId) {
    return res.status(401).json({ error: 'Admin has not configured the database yet' });
  }

  const { clientId, clientSecret } = getGoogleCredentials();
  const oauth2Client = new OAuth2Client(
    clientId,
    clientSecret
  );
  oauth2Client.setCredentials(config.tokens);
  
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: config.sheetId });
    const firstSheetName = spreadsheet.data.sheets?.[0]?.properties?.title || 'Sheet1';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.sheetId,
      range: `${firstSheetName}!A2:L`, // Skip headers
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.json({ documents: [] });
    }

    const documents = rows.map((row: any) => {
      // Parse timeline/messages back to history format if possible
      // For now, we'll just reconstruct the basic fields
      // and keep the history as a single entry if we can't parse it perfectly
      const historyStr = row[11] || '';
      const history = historyStr.split('\n').filter(Boolean).map((line: string) => {
        const match = line.match(/\[(.*?)\] (.*?): (.*?)(?: - (.*))?$/);
        if (match) {
          return {
            timestamp: new Date(match[1]),
            user: match[2],
            action: match[3],
            message: match[4] || ''
          };
        }
        return { timestamp: new Date(), user: 'System', action: 'Imported', message: line };
      });

      return {
        id: row[0],
        documentNumber: row[1],
        item: row[2],
        payee: row[3],
        amount: Number(row[4]),
        sender: row[5],
        submittedAt: new Date(row[6]),
        status: row[7],
        receivedBy: row[8] === '-' ? undefined : row[8],
        receivedAt: row[9] === '-' ? undefined : new Date(row[9]),
        verificationCode: row[10],
        history: history.length > 0 ? history : []
      };
    });

    res.json({ documents });
  } catch (error) {
    console.error('Error loading from sheets:', error);
    res.status(500).json({ error: 'Failed to load data from Google Sheets' });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`🌍 Mode: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
});
