// Department.gs

/**
 * Create a new department
 */
function createDepartment(sessionId, deptName) {
  const auth = hasPermission(sessionId, [CONFIG.ROLES.ADMIN, CONFIG.ROLES.PLANT_HEAD]);
  if (!auth.success) return auth;

  return withLock(() => {
    const sheet = getSheet(CONFIG.SHEETS.DEPARTMENTS);
    const depts = getRowsAsObjects(sheet);
    
    if (depts.find(d => d.DepartmentName === deptName)) {
      return buildResponse(false, "Department already exists");
    }

    const deptId = generateId("DEPT");
    sheet.appendRow([deptId, deptName]);
    
    logAudit(auth.data.email, "Create", "Department", deptId, "", deptName);
    return buildResponse(true, "Department created", { DepartmentID: deptId });
  });
}

/**
 * Update department
 */
function updateDepartment(sessionId, deptId, newName) {
  const auth = hasPermission(sessionId, [CONFIG.ROLES.ADMIN, CONFIG.ROLES.PLANT_HEAD]);
  if (!auth.success) return auth;

  return withLock(() => {
    const sheet = getSheet(CONFIG.SHEETS.DEPARTMENTS);
    const depts = getRowsAsObjects(sheet);
    const dept = depts.find(d => d.DepartmentID === deptId);
    
    if (!dept) return buildResponse(false, "Department not found");

    sheet.getRange(dept._rowIndex, 2).setValue(newName);
    logAudit(auth.data.email, "Update", "Department", deptId, dept.DepartmentName, newName);
    
    return buildResponse(true, "Department updated");
  });
}

/**
 * Delete department
 */
function deleteDepartment(sessionId, deptId) {
  const auth = hasPermission(sessionId, [CONFIG.ROLES.ADMIN]);
  if (!auth.success) return auth;

  return withLock(() => {
    const sheet = getSheet(CONFIG.SHEETS.DEPARTMENTS);
    const depts = getRowsAsObjects(sheet);
    const dept = depts.find(d => d.DepartmentID === deptId);
    
    if (!dept) return buildResponse(false, "Department not found");

    sheet.deleteRow(dept._rowIndex);
    logAudit(auth.data.email, "Delete", "Department", deptId, JSON.stringify(dept), "");
    
    return buildResponse(true, "Department deleted");
  });
}

/**
 * Get all departments
 */
function getDepartments(sessionId) {
  const auth = validateSession(sessionId);
  if (!auth.success) return auth;

  const sheet = getSheet(CONFIG.SHEETS.DEPARTMENTS);
  const depts = getRowsAsObjects(sheet);
  depts.forEach(d => delete d._rowIndex);
  
  return buildResponse(true, "Departments retrieved", depts);
}

/**
 * Create sub-department
 */
function createSubDepartment(sessionId, deptId, subDeptName) {
  const auth = hasPermission(sessionId, [CONFIG.ROLES.ADMIN, CONFIG.ROLES.PLANT_HEAD]);
  if (!auth.success) return auth;

  return withLock(() => {
    const sheet = getSheet(CONFIG.SHEETS.SUBDEPARTMENTS);
    const subId = generateId("SUB");
    sheet.appendRow([subId, deptId, subDeptName]);
    
    logAudit(auth.data.email, "Create", "SubDepartment", subId, "", JSON.stringify({deptId, subDeptName}));
    return buildResponse(true, "SubDepartment created", { SubDepartmentID: subId });
  });
}

/**
 * Get all sub-departments
 */
function getSubDepartments(sessionId) {
  const auth = validateSession(sessionId);
  if (!auth.success) return auth;

  const sheet = getSheet(CONFIG.SHEETS.SUBDEPARTMENTS);
  if (!sheet) return buildResponse(true, "No sub-departments", []);
  
  const subDepts = getRowsAsObjects(sheet);
  subDepts.forEach(d => delete d._rowIndex);
  
  return buildResponse(true, "SubDepartments retrieved", subDepts);
}

/**
 * Delete sub-department
 */
function deleteSubDepartment(sessionId, subDeptId) {
  const auth = hasPermission(sessionId, [CONFIG.ROLES.ADMIN]);
  if (!auth.success) return auth;

  return withLock(() => {
    const sheet = getSheet(CONFIG.SHEETS.SUBDEPARTMENTS);
    const subDepts = getRowsAsObjects(sheet);
    const subDept = subDepts.find(d => d.SubDepartmentID === subDeptId);
    
    if (!subDept) return buildResponse(false, "Sub-department not found");

    sheet.deleteRow(subDept._rowIndex);
    logAudit(auth.data.email, "Delete", "SubDepartment", subDeptId, JSON.stringify(subDept), "");
    
    return buildResponse(true, "Sub-department deleted");
  });
}
