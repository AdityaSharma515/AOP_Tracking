// Employee.gs

/**
 * Create a new employee
 */
function createEmployee(sessionId, empData) {
  const auth = hasPermission(sessionId, [CONFIG.ROLES.ADMIN, CONFIG.ROLES.PLANT_HEAD, CONFIG.ROLES.AGM, CONFIG.ROLES.SR_MANAGER]);
  if (!auth.success) return auth;

  return withLock(() => {
    const sheet = getSheet(CONFIG.SHEETS.EMPLOYEES);
    const employees = getRowsAsObjects(sheet);
    
    if (employees.find(e => e.EmployeeCode === empData.EmployeeCode)) {
      return buildResponse(false, "EmployeeCode already exists");
    }

    const status = empData.Status || "Active";
    const dateOfJoining = empData.DateOfJoining || new Date().toISOString();

    sheet.appendRow([
      empData.EmployeeCode,
      empData.EmployeeName,
      empData.Designation,
      empData.Department,
      empData.SubDepartment,
      empData.PositionID || "",
      dateOfJoining,
      status
    ]);
    
    logAudit(auth.data.email, "Create", "Employee", empData.EmployeeCode, "", JSON.stringify(empData));
    return buildResponse(true, "Employee created successfully", { EmployeeCode: empData.EmployeeCode });
  });
}

/**
 * Update an existing employee
 */
function updateEmployee(sessionId, employeeCode, updateData) {
  const auth = hasPermission(sessionId, [CONFIG.ROLES.ADMIN, CONFIG.ROLES.PLANT_HEAD, CONFIG.ROLES.AGM, CONFIG.ROLES.SR_MANAGER]);
  if (!auth.success) return auth;

  return withLock(() => {
    const sheet = getSheet(CONFIG.SHEETS.EMPLOYEES);
    const employees = getRowsAsObjects(sheet);
    const emp = employees.find(e => e.EmployeeCode === employeeCode);
    
    if (!emp) return buildResponse(false, "Employee not found");

    const oldValue = JSON.stringify(emp);
    const headers = sheet.getDataRange().getValues()[0];
    
    headers.forEach((header, index) => {
      if (updateData[header] !== undefined) {
        sheet.getRange(emp._rowIndex, index + 1).setValue(updateData[header]);
      }
    });

    logAudit(auth.data.email, "Update", "Employee", employeeCode, oldValue, JSON.stringify(updateData));
    return buildResponse(true, "Employee updated successfully");
  });
}

/**
 * Delete an employee record
 */
function deleteEmployee(sessionId, employeeCode) {
  const auth = hasPermission(sessionId, [CONFIG.ROLES.ADMIN]);
  if (!auth.success) return auth;

  return withLock(() => {
    const sheet = getSheet(CONFIG.SHEETS.EMPLOYEES);
    const employees = getRowsAsObjects(sheet);
    const emp = employees.find(e => e.EmployeeCode === employeeCode);
    
    if (!emp) return buildResponse(false, "Employee not found");

    sheet.deleteRow(emp._rowIndex);
    logAudit(auth.data.email, "Delete", "Employee", employeeCode, JSON.stringify(emp), "");
    return buildResponse(true, "Employee deleted successfully");
  });
}

/**
 * Get a single employee details
 */
function getEmployee(sessionId, employeeCode) {
  const auth = validateSession(sessionId);
  if (!auth.success) return auth;

  const sheet = getSheet(CONFIG.SHEETS.EMPLOYEES);
  const employees = getRowsAsObjects(sheet);
  const emp = employees.find(e => e.EmployeeCode === employeeCode);
  
  if (!emp) return buildResponse(false, "Employee not found");
  delete emp._rowIndex;
  return buildResponse(true, "Employee found", emp);
}

/**
 * Get all employees
 */
function getEmployees(sessionId) {
  const auth = validateSession(sessionId);
  if (!auth.success) return auth;

  const sheet = getSheet(CONFIG.SHEETS.EMPLOYEES);
  const employees = getRowsAsObjects(sheet);
  employees.forEach(e => delete e._rowIndex);
  
  return buildResponse(true, "Employees retrieved", employees);
}

/**
 * Search employees by query params
 */
function searchEmployees(sessionId, queryParams) {
  const auth = validateSession(sessionId);
  if (!auth.success) return auth;

  const sheet = getSheet(CONFIG.SHEETS.EMPLOYEES);
  let employees = getRowsAsObjects(sheet);
  
  employees = employees.filter(emp => {
    for (let key in queryParams) {
      if (emp[key] !== queryParams[key]) return false;
    }
    return true;
  });

  employees.forEach(e => delete e._rowIndex);
  return buildResponse(true, "Search results", employees);
}
