// Reports.gs

/**
 * Get headcount breakdown by department
 */
function getDepartmentSummary(sessionId) {
  const auth = validateSession(sessionId);
  if (!auth.success) return auth;

  const empSheet = getSheet(CONFIG.SHEETS.EMPLOYEES);
  const employees = getRowsAsObjects(empSheet).filter(e => e.Status === "Active");
  
  const summary = {};
  employees.forEach(emp => {
    const dept = emp.Department || "Unassigned";
    summary[dept] = (summary[dept] || 0) + 1;
  });

  return buildResponse(true, "Department summary retrieved", summary);
}

/**
 * Get positions and vacancies by department
 */
function getVacancySummary(sessionId) {
  const auth = validateSession(sessionId);
  if (!auth.success) return auth;

  const posSheet = getSheet(CONFIG.SHEETS.POSITIONS);
  const positions = getRowsAsObjects(posSheet);
  
  const summary = {};
  positions.forEach(pos => {
    const dept = pos.Department || "Unassigned";
    if (!summary[dept]) summary[dept] = { Total: 0, Vacant: 0, Occupied: 0 };
    
    summary[dept].Total++;
    if (pos.Status === "Vacant") {
      summary[dept].Vacant++;
    } else {
      summary[dept].Occupied++;
    }
  });

  return buildResponse(true, "Vacancy summary retrieved", summary);
}

/**
 * Get AOP (Annual Operating Plan) variance report
 */
function getAOPSummary(sessionId) {
  const auth = validateSession(sessionId);
  if (!auth.success) return auth;

  const aopSheet = getSheet(CONFIG.SHEETS.AOP);
  const aopData = getRowsAsObjects(aopSheet);
  
  // Get active headcount
  const empSheet = getSheet(CONFIG.SHEETS.EMPLOYEES);
  const employees = getRowsAsObjects(empSheet).filter(e => e.Status === "Active");
  
  const activeCount = {};
  employees.forEach(emp => {
    const dept = emp.Department || "Unassigned";
    activeCount[dept] = (activeCount[dept] || 0) + 1;
  });

  const summary = aopData.map(aop => {
    const dept = aop.Department;
    const planned = parseInt(aop.PlannedHeadcount) || 0;
    const actual = activeCount[dept] || 0;
    return {
      Department: dept,
      Planned: planned,
      Actual: actual,
      Variance: planned - actual
    };
  });

  return buildResponse(true, "AOP summary retrieved", summary);
}
