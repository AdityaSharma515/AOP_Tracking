// Code.gs

/**
 * STANDALONE SETUP: Run this directly in Apps Script editor.
 * Does NOT depend on Utils.gs or getDatabase().
 * Paste your Google Sheet ID below and run this function.
 */
function setupDatabase() {
  var SHEET_ID = "1YSwIsej5hXiIv9Hz3Rj7rf8fls_u_x4vcZvOH0f6yR4"; // Your Sheet ID

  var ss;
  try {
    ss = SpreadsheetApp.openById(SHEET_ID);
    Logger.log("Connected to: " + ss.getName());
  } catch (e) {
    Logger.log("ERROR: Could not open spreadsheet. Check your SHEET_ID. Details: " + e.message);
    return;
  }

  var sheetDefs = {
    "USERS":          ["UserID","Name","Email","PasswordHash","Role","PositionID","Status","CreatedDate"],
    "POSITIONS":      ["PositionID","PositionTitle","Department","SubDepartment","ReportsToPositionID","Status","CreatedDate"],
    "EMPLOYEES":      ["EmployeeCode","EmployeeName","Designation","Department","SubDepartment","PositionID","DateOfJoining","Status"],
    "DEPARTMENTS":    ["DepartmentID","DepartmentName"],
    "SUBDEPARTMENTS": ["SubDepartmentID","DepartmentID","SubDepartmentName"],
    "AOP":            ["Department","PlannedHeadcount"],
    "AUDIT_LOG":      ["Timestamp","User","Action","RecordType","RecordID","OldValue","NewValue"]
  };

  var created = [], existing = [];
  for (var name in sheetDefs) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(sheetDefs[name]);
      created.push(name);
      Logger.log("Created sheet: " + name);
    } else {
      existing.push(name);
      Logger.log("Already exists: " + name);
    }
  }
  SpreadsheetApp.flush();
  Logger.log("DONE. Created: [" + created.join(", ") + "] | Already existed: [" + existing.join(", ") + "]");
}

/**
 * Automatically creates all required sheets if they do not exist.
 */
function initializeDatabase() {
  let ss;
  const activeSs = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log('CONFIG.DB_ID = %s', CONFIG.DB_ID);
  Logger.log('Active spreadsheet = %s', activeSs ? `${activeSs.getName()} (${activeSs.getUrl()})` : 'none');

  try {
    ss = getDatabase();
  } catch (e) {
    Logger.log('initializeDatabase error: %s', e.message);
    return buildResponse(false, e.message);
  }

  if (!ss) {
    Logger.log('initializeDatabase failed: no spreadsheet returned.');
    return buildResponse(false, "No active spreadsheet found. Please add your Sheet ID or URL to CONFIG.DB_ID in Utils.gs");
  }

  Logger.log('Database spreadsheet = %s', `${ss.getName()} (${ss.getUrl()})`);

  const sheetDefinitions = {
    [CONFIG.SHEETS.USERS]: [
      "UserID",
      "Name",
      "Email",
      "PasswordHash",
      "Role",
      "PositionID",
      "Status",
      "CreatedDate",
    ],
    [CONFIG.SHEETS.POSITIONS]: [
      "PositionID",
      "PositionTitle",
      "Department",
      "SubDepartment",
      "ReportsToPositionID",
      "Status",
      "CreatedDate",
    ],
    [CONFIG.SHEETS.EMPLOYEES]: [
      "EmployeeCode",
      "EmployeeName",
      "Designation",
      "Department",
      "SubDepartment",
      "PositionID",
      "DateOfJoining",
      "Status",
    ],
    [CONFIG.SHEETS.DEPARTMENTS]: ["DepartmentID", "DepartmentName"],
    [CONFIG.SHEETS.SUBDEPARTMENTS]: [
      "SubDepartmentID",
      "DepartmentID",
      "SubDepartmentName",
    ],
    [CONFIG.SHEETS.AOP]: ["Department", "PlannedHeadcount"],
    [CONFIG.SHEETS.AUDIT_LOG]: [
      "Timestamp",
      "User",
      "Action",
      "RecordType",
      "RecordID",
      "OldValue",
      "NewValue",
    ],
  };

  const createdSheets = [];
  const existingSheets = [];
  const beforeSheetNames = ss.getSheets().map((sheet) => sheet.getName());
  Logger.log('Sheets before initialize: %s', beforeSheetNames.join(', '));

  for (const [sheetName, headers] of Object.entries(sheetDefinitions)) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
      createdSheets.push(sheetName);
    } else {
      existingSheets.push(sheetName);
    }
  }

  SpreadsheetApp.flush();
  const afterSheetNames = ss.getSheets().map((sheet) => sheet.getName());
  Logger.log('Sheets after initialize: %s', afterSheetNames.join(', '));

  const url = ss.getUrl();
  const msg = createdSheets.length
    ? `Database initialized successfully. Created sheets: ${createdSheets.join(", ")}.` 
    : `Database already contained all required sheets: ${existingSheets.join(", ")}.`;

  Logger.log('initializeDatabase result: %s', msg);
  return buildResponse(true, `${msg} Spreadsheet: ${url}`);
}

/**
 * Return database connectivity and sheet list info for debugging.
 */
function getDatabaseDebugInfo() {
  const activeSs = SpreadsheetApp.getActiveSpreadsheet();
  let dbSs;
  let error = null;

  try {
    dbSs = getDatabase();
  } catch (e) {
    error = e.message;
  }

  return buildResponse(true, "Database debug info", {
    configDbId: CONFIG.DB_ID,
    activeSpreadsheet: activeSs
      ? { name: activeSs.getName(), url: activeSs.getUrl(), sheets: activeSs.getSheets().map((sheet) => sheet.getName()) }
      : null,
    databaseSpreadsheet: dbSs
      ? { name: dbSs.getName(), url: dbSs.getUrl(), sheets: dbSs.getSheets().map((sheet) => sheet.getName()) }
      : null,
    error,
  });
}

/**
 * Serves the requested HTML page
 */
function doGet(e) {
  // Single Page Application serves App.html
  let page = "App";

  return HtmlService.createTemplateFromFile(page)
    .evaluate()
    .setTitle("PlantOrg Management System")
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

/**
 * Helper function to inject HTML/JS files into other HTML files
 */
function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}
