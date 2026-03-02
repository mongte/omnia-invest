import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs/promises';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'current_project.json');

async function load() {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!serviceAccountEmail || !privateKey || !sheetId) {
    console.error('Missing Google Sheet env credentials. Please setup .env.local as described in the architecture spike.');
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

  const taskSheet = doc.sheetsByTitle['Tasks'];
  const agentSheet = doc.sheetsByTitle['Agents'];

  if (!taskSheet || !agentSheet) {
    console.error('Could not find Tasks or Agents sheets in the document.');
    process.exit(1);
  }

  console.log('Reading Tasks...');
  const taskRows = await taskSheet.getRows();
  const tasks = taskRows.map(row => ({
    id: row.get('id'),
    title: row.get('title'),
    description: row.get('description'),
    status: row.get('status'),
    assigneeId: row.get('assigneeId'),
    createdAt: row.get('createdAt'),
    updatedAt: row.get('updatedAt')
  }));

  console.log('Reading Agents...');
  const agentRows = await agentSheet.getRows();
  const agents = agentRows.map(row => ({
    id: row.get('id'),
    name: row.get('name'),
    role: row.get('role'),
    status: row.get('status'),
    currentTaskId: row.get('currentTaskId'),
    lastActiveAt: row.get('lastActiveAt')
  }));

  const localData = { tasks, agents };

  console.log('Writing to local DB...');
  await fs.mkdir(DB_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(localData, null, 2), 'utf-8');

  console.log('Restore complete ✅');
}

load().catch(console.error);
