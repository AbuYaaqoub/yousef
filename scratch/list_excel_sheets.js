const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function run() {
    const EXCEL_FILE_PATH = path.join(__dirname, '../Mahally_Leads.xlsx');
    console.log("Checking Excel file path:", EXCEL_FILE_PATH);
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
        console.log("Excel file does not exist.");
        return;
    }
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(EXCEL_FILE_PATH);
    const sheetNames = workbook.worksheets.map(w => w.name);
    console.log("Sheet names in Mahally_Leads.xlsx:", sheetNames);
}

run();
