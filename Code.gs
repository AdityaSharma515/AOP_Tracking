// Code.gs

/**
 * Automatically creates all required sheets if they do not exist.
 */
function initializeDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

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

  for (const [sheetName, headers] of Object.entries(sheetDefinitions)) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
    }
  }
  return buildResponse(true, "Database initialized successfully.");
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
