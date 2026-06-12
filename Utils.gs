// Utils.gs

const CONFIG = {
  DB_ID: "1YSwIsej5hXiIv9Hz3Rj7rf8fls_u_x4vcZvOH0f6yR4", // Replace with your Google Sheet ID
  SHEETS: {
    USERS: "USERS",
    POSITIONS: "POSITIONS",
    EMPLOYEES: "EMPLOYEES",
    DEPARTMENTS: "DEPARTMENTS",
    SUBDEPARTMENTS: "SUBDEPARTMENTS",
    AOP: "AOP",
    AUDIT_LOG: "AUDIT_LOG"
  },
  ROLES: {
    ADMIN: "Admin",
    PLANT_HEAD: "Plant Head",
    AGM: "AGM",
    SR_MANAGER: "Sr Manager",
    MANAGER: "Manager",
    ASST_MANAGER: "Assistant Manager"
  }
};

/**
 * Standardize API responses
 */
function buildResponse(success, message, dataOrError = null) {
  if (success) {
    return { success: true, message: message, data: dataOrError || {} };
  } else {
    return { success: false, message: message, error: dataOrError || "" };
  }
}

/**
 * Helper to safely get the database spreadsheet
 */
function getDatabase() {
  let id = CONFIG.DB_ID;
  if (!id || id === "YOUR_SPREADSHEET_ID_HERE") {
    return SpreadsheetApp.getActiveSpreadsheet();
  }

  id = id.toString().trim();
  const urlMatch = id.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) {
    id = urlMatch[1];
  }

  if (!id) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }

  try {
    return SpreadsheetApp.openById(id);
  } catch (e) {
    throw new Error("Invalid Spreadsheet ID or URL provided in CONFIG.DB_ID");
  }
}

/**
 * Get sheet object by name
 */
function getSheet(sheetName) {
  const ss = getDatabase();
  return ss ? ss.getSheetByName(sheetName) : null;
}

/**
 * Wrapper for write operations using LockService to handle concurrency
 */
function withLock(callback, timeout = 10000) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(timeout);
    return callback();
  } catch (e) {
    return buildResponse(false, "Could not acquire lock or operation failed", e.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Generate unique IDs
 */
function generateId(prefix) {
  return prefix + "-" + new Date().getTime() + "-" + Math.floor(Math.random() * 1000);
}

/**
 * Helper to convert sheet rows into array of objects with _rowIndex
 */
function getRowsAsObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    // store the row index (1-based) to easily update later
    obj._rowIndex = i + 1;
    rows.push(obj);
  }
  return rows;
}
