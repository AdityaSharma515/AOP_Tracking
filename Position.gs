// Position.gs

/**
 * Create a new position
 */
function createPosition(sessionId, posData) {
  const auth = hasPermission(sessionId, [CONFIG.ROLES.ADMIN, CONFIG.ROLES.PLANT_HEAD]);
  if (!auth.success) return auth;

  return withLock(() => {
    const sheet = getSheet(CONFIG.SHEETS.POSITIONS);
    const posId = generateId("POS");
    const status = posData.Status || "Vacant";
    const date = new Date().toISOString();

    sheet.appendRow([
      posId,
      posData.PositionTitle,
      posData.Department,
      posData.SubDepartment,
      posData.ReportsToPositionID || "",
      status,
      date
    ]);

    logAudit(auth.data.email, "Create", "Position", posId, "", JSON.stringify(posData));
    return buildResponse(true, "Position created successfully", { PositionID: posId });
  });
}

/**
 * Update an existing position
 */
function updatePosition(sessionId, positionId, updateData) {
  const auth = hasPermission(sessionId, [CONFIG.ROLES.ADMIN, CONFIG.ROLES.PLANT_HEAD]);
  if (!auth.success) return auth;

  return withLock(() => {
    const sheet = getSheet(CONFIG.SHEETS.POSITIONS);
    const positions = getRowsAsObjects(sheet);
    const pos = positions.find(p => p.PositionID === positionId);
    
    if (!pos) return buildResponse(false, "Position not found");

    const oldValue = JSON.stringify(pos);
    const headers = sheet.getDataRange().getValues()[0];
    
    headers.forEach((header, index) => {
      if (updateData[header] !== undefined) {
        sheet.getRange(pos._rowIndex, index + 1).setValue(updateData[header]);
      }
    });

    logAudit(auth.data.email, "Update", "Position", positionId, oldValue, JSON.stringify(updateData));
    return buildResponse(true, "Position updated successfully");
  });
}

/**
 * Delete a position
 */
function deletePosition(sessionId, positionId) {
  const auth = hasPermission(sessionId, [CONFIG.ROLES.ADMIN]);
  if (!auth.success) return auth;

  return withLock(() => {
    const sheet = getSheet(CONFIG.SHEETS.POSITIONS);
    const positions = getRowsAsObjects(sheet);
    const pos = positions.find(p => p.PositionID === positionId);
    
    if (!pos) return buildResponse(false, "Position not found");

    // Check if other positions report to this one
    const dependentPositions = positions.filter(p => p.ReportsToPositionID === positionId);
    if (dependentPositions.length > 0) {
      return buildResponse(false, "Cannot delete position. Other positions report to it.");
    }

    sheet.deleteRow(pos._rowIndex);
    logAudit(auth.data.email, "Delete", "Position", positionId, JSON.stringify(pos), "");
    return buildResponse(true, "Position deleted successfully");
  });
}

/**
 * Get a specific position
 */
function getPosition(sessionId, positionId) {
  const auth = validateSession(sessionId);
  if (!auth.success) return auth;

  const sheet = getSheet(CONFIG.SHEETS.POSITIONS);
  const positions = getRowsAsObjects(sheet);
  const pos = positions.find(p => p.PositionID === positionId);
  
  if (!pos) return buildResponse(false, "Position not found");
  delete pos._rowIndex;
  return buildResponse(true, "Position found", pos);
}

/**
 * Get all positions
 */
function getPositions(sessionId) {
  const auth = validateSession(sessionId);
  if (!auth.success) return auth;

  const sheet = getSheet(CONFIG.SHEETS.POSITIONS);
  const positions = getRowsAsObjects(sheet);
  positions.forEach(p => delete p._rowIndex);
  
  return buildResponse(true, "Positions retrieved", positions);
}
