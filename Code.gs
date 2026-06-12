// Code.gs

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
  // Default to Login page if no page parameter is provided
  let page = e.parameter.page || "Login";

  // Security check: ensure only valid pages can be requested
  const validPages = [
    "Login",
    "Signup",
    "Dashboard",
    "Employees",
    "Positions",
    "Departments",
    "Hierarchy",
    "Reports",
  ];
  if (!validPages.includes(page)) {
    page = "Login";
  }

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
