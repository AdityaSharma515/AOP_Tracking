// Dashboard.gs

/**
 * Get overview statistics for the dashboard
 */
function getDashboardStats(sessionId) {
  const auth = validateSession(sessionId);
  if (!auth.success) return auth;

  const empSheet = getSheet(CONFIG.SHEETS.EMPLOYEES);
  const posSheet = getSheet(CONFIG.SHEETS.POSITIONS);
  const deptSheet = getSheet(CONFIG.SHEETS.DEPARTMENTS);
  const subDeptSheet = getSheet(CONFIG.SHEETS.SUBDEPARTMENTS);

  const employees = getRowsAsObjects(empSheet);
  const positions = getRowsAsObjects(posSheet);
  const depts = getRowsAsObjects(deptSheet);
  const subDepts = getRowsAsObjects(subDeptSheet);

  const totalEmployees = employees.filter(e => e.Status === "Active").length;
  const totalPositions = positions.length;
  const vacantPositions = positions.filter(p => p.Status === "Vacant").length;
  const totalDepartments = depts.length;
  const totalSubDepartments = subDepts.length;

  const stats = {
    totalEmployees: totalEmployees,
    totalPositions: totalPositions,
    vacantPositions: vacantPositions,
    departments: totalDepartments,
    subDepartments: totalSubDepartments
  };

  return buildResponse(true, "Dashboard stats retrieved", stats);
}

/**
 * Get recent activity logs for the dashboard
 */
function getRecentActivity(sessionId) {
  const auth = validateSession(sessionId);
  if (!auth.success) return auth;

  const auditSheet = getSheet(CONFIG.SHEETS.AUDIT_LOG);
  if (!auditSheet) {
    return buildResponse(true, "No recent activity", []);
  }
  
  const logs = getRowsAsObjects(auditSheet);
  
  // Sort descending by timestamp
  logs.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
  
  // Get top 5
  const recent = logs.slice(0, 5).map(log => ({
    timestamp: log.Timestamp,
    user: log.User,
    action: log.Action,
    recordType: log.RecordType
  }));

  return buildResponse(true, "Recent activity retrieved", recent);
}
