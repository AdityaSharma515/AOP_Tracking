// Auth.gs

/**
 * SHA-256 password hashing
 */
function hashPassword(password) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  let hexHash = '';
  for (let i = 0; i < rawHash.length; i++) {
    let hashVal = rawHash[i];
    if (hashVal < 0) {
      hashVal += 256;
    }
    if (hashVal.toString(16).length == 1) {
      hexHash += '0';
    }
    hexHash += hashVal.toString(16);
  }
  return hexHash;
}

/**
 * Register a new user
 */
function registerUser(name, email, password, role, positionId) {
  return withLock(() => {
    const sheet = getSheet(CONFIG.SHEETS.USERS);
    const users = getRowsAsObjects(sheet);
    
    if (users.find(u => u.Email === email)) {
      return buildResponse(false, "User with this email already exists");
    }

    const userId = generateId("USR");
    const passwordHash = hashPassword(password);
    const date = new Date().toISOString();

    sheet.appendRow([userId, name, email, passwordHash, role, positionId || "", "Active", date]);
    logAudit("System", "Create", "User", userId, "", JSON.stringify({email, role}));
    return buildResponse(true, "User registered successfully", { userId: userId });
  });
}

/**
 * Login user and create session
 */
function loginUser(email, password) {
  const sheet = getSheet(CONFIG.SHEETS.USERS);
  const users = getRowsAsObjects(sheet);
  
  const user = users.find(u => u.Email === email && u.Status === "Active");
  if (!user || user.PasswordHash !== hashPassword(password)) {
    return buildResponse(false, "Invalid credentials or user is inactive");
  }

  const sessionId = generateId("SESS");
  const sessionData = {
    userId: user.UserID,
    email: user.Email,
    role: user.Role,
    timestamp: new Date().getTime()
  };

  PropertiesService.getScriptProperties().setProperty(sessionId, JSON.stringify(sessionData));
  logAudit(user.Email, "Login", "Session", sessionId, "", "");
  
  return buildResponse(true, "Login successful", { sessionId: sessionId, role: user.Role });
}

/**
 * Logout user by destroying session
 */
function logoutUser(sessionId) {
  PropertiesService.getScriptProperties().deleteProperty(sessionId);
  return buildResponse(true, "Logout successful");
}

/**
 * Validate active session
 */
function validateSession(sessionId) {
  const data = PropertiesService.getScriptProperties().getProperty(sessionId);
  if (!data) return buildResponse(false, "Invalid or expired session");
  
  const sessionData = JSON.parse(data);
  // Session expires in 24 hours
  const now = new Date().getTime();
  if (now - sessionData.timestamp > 24 * 60 * 60 * 1000) {
    PropertiesService.getScriptProperties().deleteProperty(sessionId);
    return buildResponse(false, "Session expired");
  }
  
  return buildResponse(true, "Session valid", sessionData);
}

/**
 * Role based access control validator
 */
function hasPermission(sessionId, allowedRoles) {
  const sessionRes = validateSession(sessionId);
  if (!sessionRes.success) return sessionRes;
  
  const role = sessionRes.data.role;
  if (!allowedRoles.includes(role)) {
    return buildResponse(false, "Access denied. Insufficient permissions.");
  }
  return buildResponse(true, "Permission granted", sessionRes.data);
}
