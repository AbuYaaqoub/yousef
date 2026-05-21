import { google } from 'googleapis';
import { StoreLead } from '@/types';

export async function appendToGoogleSheets(leads: StoreLead[]) {
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const spreadsheetId = process.env.SPREADSHEET_ID;

    if (!privateKey || !clientEmail || !spreadsheetId) {
        console.warn('⚠️ Google Sheets not configured. Skipping save.');
        return;
    }

    const auth = new google.auth.JWT(clientEmail, '', privateKey, ['https://www.googleapis.com/auth/spreadsheets']);
    const sheets = google.sheets({ version: 'v4', auth });

    const rows = leads.map(lead => [
        lead.storeName,
        lead.phone,
        lead.email,
        lead.domain,
        lead.whatsapp,
        lead.tiktok,
        lead.instagram,
        lead.snapchat,
        lead.twitter,
        lead.rating
    ]);

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'A1:J1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: rows }
    });
}