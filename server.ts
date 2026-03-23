import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import cookieParser from "cookie-parser";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// Google OAuth Configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL}/auth/google/callback`
);

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

// Auth Routes
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
    // Store tokens in a secure cookie
    res.cookie('google_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).send('Authentication failed');
  }
});

app.get("/api/auth/google/status", (req, res) => {
  const tokens = req.cookies.google_tokens;
  res.json({ isAuthenticated: !!tokens });
});

app.post("/api/sheets/sync", async (req, res) => {
  const tokensStr = req.cookies.google_tokens;
  if (!tokensStr) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  const { documents, sheetId } = req.body;
  const tokens = JSON.parse(tokensStr);
  oauth2Client.setCredentials(tokens);

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  try {
    let targetSheetId = sheetId;

    // If no sheetId provided, create a new one
    if (!targetSheetId) {
      const spreadsheet = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `DocDelivery_Database_System`
          }
        }
      });
      targetSheetId = spreadsheet.data.spreadsheetId;
    }

    // Prepare data
    const values = [
      ['ID', 'Document Number', 'Item', 'Payee', 'Amount', 'Sender', 'Submitted At', 'Status', 'Received By', 'Received At', 'Verification Code', 'Timeline/Messages'],
      ...documents.map((doc: any) => [
        doc.id,
        doc.documentNumber,
        doc.item,
        doc.payee,
        doc.amount,
        doc.sender,
        doc.submittedAt,
        doc.status,
        doc.receivedBy || '-',
        doc.receivedAt || '-',
        doc.verificationCode,
        (doc.history || []).map((h: any) => 
          `[${new Date(h.timestamp).toISOString()}] ${h.user}: ${h.action}${h.message ? ` - ${h.message}` : ''}`
        ).join('\n')
      ])
    ];

    // Update the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: targetSheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: { values }
    });

    res.json({ success: true, sheetId: targetSheetId, url: `https://docs.google.com/spreadsheets/d/${targetSheetId}` });
  } catch (error) {
    console.error('Error syncing to sheets:', error);
    res.status(500).json({ error: 'Failed to sync to Google Sheets' });
  }
});

app.get("/api/sheets/load", async (req, res) => {
  const tokensStr = req.cookies.google_tokens;
  if (!tokensStr) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  const { sheetId } = req.query;
  if (!sheetId) {
    return res.status(400).json({ error: 'Sheet ID is required' });
  }

  const tokens = JSON.parse(tokensStr);
  oauth2Client.setCredentials(tokens);
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId as string,
      range: 'Sheet1!A2:L', // Skip headers
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
