import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { google } from "googleapis";
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
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || "").trim().replace(/^https?:\/\//, "");
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
const APP_URL = (process.env.APP_URL || "").trim().replace(/\/$/, "");

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !APP_URL) {
  console.error("❌ CRITICAL ERROR: Missing Google OAuth environment variables!");
}

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${APP_URL}/auth/google/callback`
);

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'openid',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

// Auth Routes
const ADMIN_EMAILS = ['peapranburiforwork@gmail.com'];

app.get("/api/auth/google/url", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.json({ url });
});

app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);
    
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    const email = userInfo.data.email;
    const name = userInfo.data.name;

    if (ADMIN_EMAILS.includes(email!)) {
      // Save admin tokens to file so all users can use them to sync
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
  } catch (error) {
    res.status(500).send('Authentication failed');
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

app.post("/api/sheets/sync", async (req, res) => {
  const config = getAdminConfig();
  if (!config.tokens) {
    return res.status(401).json({ error: 'Admin has not linked Google Drive yet' });
  }

  const { documents } = req.body;
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
