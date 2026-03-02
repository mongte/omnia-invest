import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs/promises';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'current_project.json');

async function archive() {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!serviceAccountEmail || !privateKey || !sheetId) {
    console.error('Missing Google Sheet env credentials. Please setup .env.local as described in the architecture spike.');
    process.exit(1);
  }

  // Load local data
  let localData;
  try {
    const fileContent = await fs.readFile(DB_FILE, 'utf-8');
    localData = JSON.parse(fileContent);
  } catch (e) {
    console.error('Failed to read local DB. Does it exist?', e);
    process.exit(1);
  }

  const jwt = new JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  console.log('Connecting to Google Sheets...');
  const doc = new GoogleSpreadsheet(sheetId, jwt);
  await doc.loadInfo();

  console.log(`Connected to Doc: ${doc.title}`);

  // Helpers to get or create sheets
  const getOrCreateSheet = async (title: string, headerValues: string[]) => {
    let sheet = doc.sheetsByTitle[title];
    if (sheet) {
      await sheet.clear();
      await sheet.setHeaderRow(headerValues);
    } else {
      sheet = await doc.addSheet({ title, headerValues });
    }
    return sheet;
  };

  // Archive Tasks
  console.log('Archiving Tasks...');
  const taskSheet = await getOrCreateSheet('Tasks', ['id', 'title', 'description', 'status', 'assigneeId', 'createdAt', 'updatedAt']);
  if (localData.tasks && localData.tasks.length > 0) {
    await taskSheet.addRows(localData.tasks);
  }

  // Archive Agents
  console.log('Archiving Agents...');
  const agentSheet = await getOrCreateSheet('Agents', ['id', 'name', 'role', 'status', 'currentTaskId', 'lastActiveAt']);
  if (localData.agents && localData.agents.length > 0) {
    await agentSheet.addRows(localData.agents);
  }

  console.log('Archive complete ✅');
}

archive().catch(console.error);
