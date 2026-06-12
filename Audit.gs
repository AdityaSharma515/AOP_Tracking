// Audit.gs

/**
 * Log audit events to the AUDIT_LOG sheet
 */
function logAudit(user, action, recordType, recordId, oldValue, newValue) {
  const sheet = getSheet(CONFIG.SHEETS.AUDIT_LOG);
  if (!sheet) return;
  const timestamp = new Date().toISOString();
  sheet.appendRow([timestamp, user, action, recordType, recordId, oldValue, newValue]);
}
