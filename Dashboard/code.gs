/************************************
 * VR Therapy Platform Backend (Apps Script)
 * Single-file backend for:
 * - Admin
 * - Center
 * - Specialist
 ************************************/

// ====== SHEET NAMES ======
const SHEET_ADMIN                  = 'Admin';
const SHEET_CENTERS                = 'Centers';
const SHEET_SPECIALISTS            = 'Specialists';
const SHEET_CHILDREN               = 'Children';
const SHEET_MODULES                = 'VR_Modules';
const SHEET_MODULE_ASSIGNMENTS     = 'VR_Module_Assignments';
const SHEET_QUESTIONS              = 'Assessment_Questions';
const SHEET_RESPONSES              = 'Assessment_Responses';
const SHEET_SESSIONS               = 'Children_Sessions';
const SHEET_AUDIT                  = 'Audit_Log';
const SHEET_ID_COUNTERS            = 'ID_Counters';

// ====== COLUMN INDEXES (1-based) ======

// Centers
const COL_CENTER_ID        = 1;
const COL_CENTER_NAME      = 2;
const COL_CENTER_DESC      = 3;
const COL_CENTER_USERNAME  = 4;
const COL_CENTER_PASSWORD  = 5;
const COL_CENTER_STATUS    = 6;

// Specialists
const COL_SPEC_ID          = 1;
const COL_SPEC_NAME        = 2;
const COL_SPEC_DESC        = 3;
const COL_SPEC_USERNAME    = 4;
const COL_SPEC_PASSWORD    = 5;
const COL_SPEC_TYPE        = 6; // freelance / center
const COL_SPEC_CENTER_ID   = 7;
const COL_SPEC_STATUS      = 8;

// Children
const COL_CHILD_ID         = 1;
const COL_CHILD_NAME       = 2;
const COL_CHILD_AGE        = 3;
const COL_CHILD_MOBILE     = 4;
const COL_CHILD_SPEC_ID    = 5;
const COL_CHILD_CENTER_ID  = 6;
const COL_CHILD_NOTES      = 7;
const COL_CHILD_STATUS     = 8;

// VR_Modules
const COL_MOD_ID           = 1;
const COL_MOD_NAME         = 2;
const COL_MOD_PHOTO        = 3;
const COL_MOD_DESC         = 4;
const COL_MOD_MINUTES      = 5;
const COL_MOD_STATUS       = 6;

// VR_Module_Assignments
const COL_ASSIGN_ID        = 1;
const COL_ASSIGN_MOD_ID    = 2;
const COL_ASSIGN_CENTER_ID = 3;
const COL_ASSIGN_STATUS    = 4;

// Assessment_Questions
const COL_Q_ID             = 1;
const COL_Q_TEXT           = 2;
const COL_Q_CATEGORY       = 3;
const COL_Q_DIFFICULTY     = 4;
const COL_Q_STATUS         = 5;

// Assessment_Responses
const COL_RESP_ID          = 1;
const COL_RESP_CHILD_ID    = 2;
const COL_RESP_SPEC_ID     = 3;
const COL_RESP_CENTER_ID   = 4;
const COL_RESP_DATE        = 5;
const COL_RESP_Q_ID        = 6;
const COL_RESP_SCORE       = 7;
const COL_RESP_NOTES       = 8;
const COL_RESP_STATUS      = 9;

// Children_Sessions
const COL_SESS_ID          = 1;
const COL_SESS_CHILD_ID    = 2;
const COL_SESS_SPEC_ID     = 3;
const COL_SESS_CENTER_ID   = 4;
const COL_SESS_DATE        = 5;
const COL_SESS_MODULE_ID   = 6;
const COL_SESS_DURATION    = 7;
const COL_SESS_NOTES       = 8;

// Audit_Log
const COL_LOG_ID           = 1;
const COL_LOG_TIMESTAMP    = 2;
const COL_LOG_USERNAME     = 3;
const COL_LOG_ROLE         = 4;
const COL_LOG_ACTION       = 5;
const COL_LOG_ENTITY_TYPE  = 6;
const COL_LOG_ENTITY_ID    = 7;
const COL_LOG_NOTES        = 8;

// ID_Counters
const COL_COUNTER_ENTITY   = 1;
const COL_COUNTER_LAST_ID  = 2;


// ====== ENTRY POINTS ======

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const action = (e.parameter.action || '').trim();
  if (!action) {
    return jsonResponse({ success: false, error: 'No action specified' });
  }

  try {
    switch (action) {

      // ---- AUTH ----
      case 'login':                return login(e);

      // ---- ADMIN / GLOBAL STATS ----
      case 'getAdminStats':        return getAdminStats(e);
      case 'getCenterStats':       return getCenterStats(e);
      case 'getSpecialistStats':   return getSpecialistStats(e);

      // ---- CENTERS ----
      case 'listCenters':          return listCenters(e);
      case 'createCenter':         return createCenter(e);
      case 'updateCenter':         return updateCenter(e);
      case 'deleteCenter':         return deleteCenter(e);
      case 'getCenterSpecialists': return getCenterSpecialists(e);

      // ---- SPECIALISTS ----
      case 'listSpecialists':      return listSpecialists(e);
      case 'createSpecialist':     return createSpecialist(e);
      case 'updateSpecialist':     return updateSpecialist(e);
      case 'deleteSpecialist':     return deleteSpecialist(e);

      // ---- CHILDREN ----
      case 'listChildren':         return listChildren(e);
      case 'createChild':          return createChild(e);
      case 'updateChild':          return updateChild(e);
      case 'deleteChild':          return deleteChild(e);
      case 'getChildProfile':      return getChildProfile(e);

      // ---- MODULES ----
      case 'listModules':          return listModules(e);
      case 'createModule':         return createModule(e);
      case 'updateModule':         return updateModule(e);
      case 'deleteModule':         return deleteModule(e);
      case 'assignModuleToCenter': return assignModuleToCenter(e);
      case 'assignModulesToCenter': return assignModulesToCenter(e);
      case 'removeModuleFromCenter': return removeModuleFromCenter(e);
      case 'listCenterModules':    return listCenterModules(e);

      // ---- ASSESSMENTS ----
      case 'listQuestions':        return listQuestions(e);
      case 'createQuestion':       return createQuestion(e);
      case 'updateQuestion':       return updateQuestion(e);
      case 'deleteQuestion':       return deleteQuestion(e);
      case 'listAssessmentResponses': return listAssessmentResponses(e);
      case 'createAssessment':     return createAssessment(e);
      case 'updateAssessment':     return updateAssessment(e);

      // ---- SESSIONS ----
      case 'listSessionsByChild':  return listSessionsByChild(e);
      case 'createSession':        return createSession(e);
      case 'updateSession':        return updateSession(e);

      // ---- AUDIT ----
      case 'getAuditLog':          return getAuditLog(e);
      case 'reportsDashboard':     return getDashboardReports(e);

      default:
        return jsonResponse({ success: false, error: 'Invalid action: ' + action });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.message, stack: err.stack });
  }
}

// ====== UTILITIES ======

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error('Sheet not found: ' + name);
  }
  return sheet;
}

function getDataRangeValues(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return []; // no data
  return sheet.getRange(2, 1, lastRow - 1, lastCol).getValues(); // skip header
}

function generateId(entityType) {
  const sheet = getSheet(SHEET_ID_COUNTERS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    // no counters yet
    sheet.appendRow([entityType, 0]);
  }
  const values = getDataRangeValues(sheet);
  let rowIndex = -1;
  let lastId = 0;

  for (let i = 0; i < values.length; i++) {
    if (values[i][COL_COUNTER_ENTITY - 1] === entityType) {
      rowIndex = i + 2; // account for header
      lastId = Number(values[i][COL_COUNTER_LAST_ID - 1]) || 0;
      break;
    }
  }

  if (rowIndex === -1) {
    // new row
    const newId = 1;
    sheet.appendRow([entityType, newId]);
    return String(newId);
  } else {
    const newId = lastId + 1;
    sheet.getRange(rowIndex, COL_COUNTER_LAST_ID).setValue(newId);
    return String(newId);
  }
}

function appendAuditLog(username, role, action, entityType, entityId, notes) {
  const sheet = getSheet(SHEET_AUDIT);
  const logId = generateId('audit_log');
  const timestamp = new Date();
  sheet.appendRow([
    logId,
    timestamp,
    username || '',
    role || '',
    action || '',
    entityType || '',
    entityId || '',
    notes || ''
  ]);
}

function getActorContext(e) {
  const role = String(e.parameter.actor_role || 'admin').trim() || 'admin';
  const username = String(e.parameter.actor_username || '').trim();
  let centerId = String(e.parameter.actor_center_id || '').trim();
  let specialistId = String(e.parameter.actor_specialist_id || '').trim();

  if (!centerId && role === 'center' && username) {
    centerId = findCenterIdByUsername(username);
  }
  if (!specialistId && role === 'specialist' && username) {
    specialistId = findSpecialistIdByUsername(username);
  }
  if (!centerId && role === 'specialist' && specialistId) {
    centerId = findCenterIdBySpecialistId(specialistId);
  }

  return { role: role, username: username, center_id: centerId, specialist_id: specialistId };
}

function findCenterIdByUsername(username) {
  const centers = getDataRangeValues(getSheet(SHEET_CENTERS));
  for (let i = 0; i < centers.length; i++) {
    if (String(centers[i][COL_CENTER_USERNAME - 1]).trim() === username &&
        centers[i][COL_CENTER_STATUS - 1] !== 'deleted') {
      return String(centers[i][COL_CENTER_ID - 1]);
    }
  }
  return '';
}

function findSpecialistIdByUsername(username) {
  const specs = getDataRangeValues(getSheet(SHEET_SPECIALISTS));
  for (let i = 0; i < specs.length; i++) {
    if (String(specs[i][COL_SPEC_USERNAME - 1]).trim() === username &&
        specs[i][COL_SPEC_STATUS - 1] !== 'deleted') {
      return String(specs[i][COL_SPEC_ID - 1]);
    }
  }
  return '';
}

function findCenterIdBySpecialistId(specId) {
  const specs = getDataRangeValues(getSheet(SHEET_SPECIALISTS));
  for (let i = 0; i < specs.length; i++) {
    if (String(specs[i][COL_SPEC_ID - 1]) === String(specId) &&
        specs[i][COL_SPEC_STATUS - 1] !== 'deleted') {
      return String(specs[i][COL_SPEC_CENTER_ID - 1] || '');
    }
  }
  return '';
}

function ensureAdmin(actor) {
  if (actor.role !== 'admin') {
    return jsonResponse({ success: false, error: 'Admin access required' });
  }
  return null;
}

function ensureCenterAccess(actor, centerId) {
  if (actor.role === 'center') {
    if (!actor.center_id || String(centerId) !== String(actor.center_id)) {
      return jsonResponse({ success: false, error: 'Center access denied' });
    }
  }
  if (actor.role === 'specialist' && centerId) {
    if (!actor.center_id || String(centerId) !== String(actor.center_id)) {
      return jsonResponse({ success: false, error: 'Center access denied' });
    }
  }
  return null;
}

function ensureSpecialistAccess(actor, specialistId) {
  if (actor.role === 'specialist') {
    if (!actor.specialist_id || String(specialistId) !== String(actor.specialist_id)) {
      return jsonResponse({ success: false, error: 'Specialist access denied' });
    }
  }
  return null;
}

function getChildRowById(childId) {
  const data = getDataRangeValues(getSheet(SHEET_CHILDREN));
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][COL_CHILD_ID - 1]) === String(childId)) {
      return data[i];
    }
  }
  return null;
}

function getSessionRowById(sessionId) {
  const data = getDataRangeValues(getSheet(SHEET_SESSIONS));
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][COL_SESS_ID - 1]) === String(sessionId)) {
      return data[i];
    }
  }
  return null;
}

// ====== AUTH / LOGIN ======

function login(e) {
  const username = (e.parameter.username || '').trim();
  const password = (e.parameter.password || '').trim();

  if (!username || !password) {
    return jsonResponse({ success: false, error: 'Username and password required' });
  }

  // 1. Check Admin sheet
  const adminSheet = getSheet(SHEET_ADMIN);
  const adminData = getDataRangeValues(adminSheet);
  for (let i = 0; i < adminData.length; i++) {
    const row = adminData[i]; // [username, password]
    const rowUser = String(row[0]).trim();
    const rowPass = String(row[1]).trim();

    if (rowUser === username && rowPass === password) {
      appendAuditLog(username, 'admin', 'login', 'Admin', 'admin', '');
      return jsonResponse({
        success: true,
        role: 'admin',
        user: { username: username }
      });
    }
  }

  // 2. Check Centers
  const centersSheet = getSheet(SHEET_CENTERS);
  const centers = getDataRangeValues(centersSheet);
  for (let i = 0; i < centers.length; i++) {
    const row = centers[i];
    const rowUser = String(row[COL_CENTER_USERNAME - 1]).trim();
    const rowPass = String(row[COL_CENTER_PASSWORD - 1]).trim();

    if (rowUser === username &&
        rowPass === password &&
        row[COL_CENTER_STATUS - 1] !== 'deleted') {

      const centerId = row[COL_CENTER_ID - 1];
      appendAuditLog(username, 'center', 'login', 'Center', centerId, '');
      return jsonResponse({
        success: true,
        role: 'center',
        user: {
          center_id: centerId,
          name: row[COL_CENTER_NAME - 1],
          username: username
        }
      });
    }
  }

  // 3. Check Specialists
  const specSheet = getSheet(SHEET_SPECIALISTS);
  const specs = getDataRangeValues(specSheet);
  for (let i = 0; i < specs.length; i++) {
    const row = specs[i];
    const rowUser = String(row[COL_SPEC_USERNAME - 1]).trim();
    const rowPass = String(row[COL_SPEC_PASSWORD - 1]).trim();

    if (rowUser === username &&
        rowPass === password &&
        row[COL_SPEC_STATUS - 1] !== 'deleted') {

      const specId = row[COL_SPEC_ID - 1];
      const centerId = row[COL_SPEC_CENTER_ID - 1] || '';
      appendAuditLog(username, 'specialist', 'login', 'Specialist', specId, '');
      return jsonResponse({
        success: true,
        role: 'specialist',
        user: {
          specialist_id: specId,
          center_id: centerId,
          name: row[COL_SPEC_NAME - 1],
          username: username,
          type: row[COL_SPEC_TYPE - 1]
        }
      });
    }
  }

  return jsonResponse({ success: false, error: 'Invalid username or password' });
}


// ====== STATS ======

function getAdminStats(e) {
  const actor = getActorContext(e);
  const denied = ensureAdmin(actor);
  if (denied) return denied;
  const centers = getDataRangeValues(getSheet(SHEET_CENTERS))
    .filter(r => r[COL_CENTER_STATUS - 1] !== 'deleted');
  const specs = getDataRangeValues(getSheet(SHEET_SPECIALISTS))
    .filter(r => r[COL_SPEC_STATUS - 1] !== 'deleted');
  const children = getDataRangeValues(getSheet(SHEET_CHILDREN))
    .filter(r => r[COL_CHILD_STATUS - 1] !== 'deleted');
  const modules = getDataRangeValues(getSheet(SHEET_MODULES))
    .filter(r => r[COL_MOD_STATUS - 1] !== 'deleted');

  return jsonResponse({
    success: true,
    totals: {
      centers: centers.length,
      specialists: specs.length,
      children: children.length,
      modules: modules.length
    }
    // You can add chart data later here
  });
}

function getCenterStats(e) {
  const actor = getActorContext(e);
  const centerId = (e.parameter.center_id || '').trim();
  if (!centerId) return jsonResponse({ success: false, error: 'center_id is required' });
  const denied = ensureCenterAccess(actor, centerId);
  if (denied) return denied;

  const specs = getDataRangeValues(getSheet(SHEET_SPECIALISTS))
    .filter(r => r[COL_SPEC_CENTER_ID - 1] == centerId && r[COL_SPEC_STATUS - 1] !== 'deleted');

  const children = getDataRangeValues(getSheet(SHEET_CHILDREN))
    .filter(r => r[COL_CHILD_CENTER_ID - 1] == centerId && r[COL_CHILD_STATUS - 1] !== 'deleted');

  const assignments = getDataRangeValues(getSheet(SHEET_MODULE_ASSIGNMENTS))
    .filter(r => r[COL_ASSIGN_CENTER_ID - 1] == centerId && r[COL_ASSIGN_STATUS - 1] !== 'deleted');

  const sessions = getDataRangeValues(getSheet(SHEET_SESSIONS))
    .filter(r => r[COL_SESS_CENTER_ID - 1] == centerId);

  return jsonResponse({
    success: true,
    center_id: centerId,
    totals: {
      specialists: specs.length,
      children: children.length,
      modules_assigned: assignments.length,
      sessions: sessions.length
    }
  });
}

function getSpecialistStats(e) {
  const actor = getActorContext(e);
  const specialistId = (e.parameter.specialist_id || '').trim();
  if (!specialistId) return jsonResponse({ success: false, error: 'specialist_id is required' });
  const denied = ensureSpecialistAccess(actor, specialistId);
  if (denied) return denied;

  const children = getDataRangeValues(getSheet(SHEET_CHILDREN))
    .filter(r => r[ COL_CHILD_SPEC_ID - 1 ] == specialistId && r[COL_CHILD_STATUS - 1] !== 'deleted');

  const sessions = getDataRangeValues(getSheet(SHEET_SESSIONS))
    .filter(r => r[ COL_SESS_SPEC_ID - 1 ] == specialistId);

  const responses = getDataRangeValues(getSheet(SHEET_RESPONSES))
    .filter(r => r[ COL_RESP_SPEC_ID - 1 ] == specialistId)
    .filter(r => String(r[COL_RESP_STATUS - 1] || '').toLowerCase() !== 'deleted');

  return jsonResponse({
    success: true,
    specialist_id: specialistId,
    totals: {
      children: children.length,
      sessions: sessions.length,
      assessments: responses.length // number of response rows (not unique assessments)
    }
  });
}

// ====== CENTERS CRUD ======

function listCenters(e) {
  const actor = getActorContext(e);
  const denied = ensureAdmin(actor);
  if (denied) return denied;
  const statusFilter = String(e.parameter.status || '').trim().toLowerCase();
  const data = getDataRangeValues(getSheet(SHEET_CENTERS));
  const children = getDataRangeValues(getSheet(SHEET_CHILDREN));
  const specs = getDataRangeValues(getSheet(SHEET_SPECIALISTS));

  const centers = data
    .filter(r => {
      const status = String(r[COL_CENTER_STATUS - 1] || '').toLowerCase();
      if (statusFilter) return status === statusFilter;
      return status !== 'deleted';
    })
    .map(r => {
      const id = r[COL_CENTER_ID - 1];
      const numChildren = children.filter(c => c[COL_CHILD_CENTER_ID - 1] == id && c[COL_CHILD_STATUS - 1] !== 'deleted').length;
      const numSpecs = specs.filter(s => s[COL_SPEC_CENTER_ID - 1] == id && s[COL_SPEC_STATUS - 1] !== 'deleted').length;
      return {
        center_id: id,
        name: r[COL_CENTER_NAME - 1],
        description: r[COL_CENTER_DESC - 1],
        username: r[COL_CENTER_USERNAME - 1],
        password: r[COL_CENTER_PASSWORD - 1],
        status: r[COL_CENTER_STATUS - 1],
        num_specialists: numSpecs,
        num_children: numChildren
      };
    });

  return jsonResponse({ success: true, centers: centers });
}

function createCenter(e) {
  const actorCtx = getActorContext(e);
  const denied = ensureAdmin(actorCtx);
  if (denied) return denied;
  const name = (e.parameter.name || '').trim();
  const desc = (e.parameter.description || '').trim();
  const username = (e.parameter.username || '').trim();
  const password = (e.parameter.password || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || 'admin');

  if (!name || !username || !password) {
    return jsonResponse({ success: false, error: 'name, username, password required' });
  }

  const sheet = getSheet(SHEET_CENTERS);
  const newId = generateId('center');

  sheet.appendRow([
    newId,
    name,
    desc,
    username,
    password,
    'active'
  ]);

  appendAuditLog(actor, role, 'create', 'Center', newId, 'Created center: ' + name);

  return jsonResponse({ success: true, center_id: newId });
}

function updateCenter(e) {
  const actorCtx = getActorContext(e);
  const denied = ensureAdmin(actorCtx);
  if (denied) return denied;
  const centerId = (e.parameter.center_id || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || 'admin');
  if (!centerId) return jsonResponse({ success: false, error: 'center_id required' });

  const sheet = getSheet(SHEET_CENTERS);
  const data = getDataRangeValues(sheet);

  let foundRowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][COL_CENTER_ID - 1] == centerId) {
      foundRowIndex = i + 2; // with header
      break;
    }
  }
  if (foundRowIndex === -1) {
    return jsonResponse({ success: false, error: 'Center not found' });
  }

  const name = e.parameter.name;
  const desc = e.parameter.description;
  const username = e.parameter.username;
  const password = e.parameter.password;
  const status = e.parameter.status;

  if (name != null)      sheet.getRange(foundRowIndex, COL_CENTER_NAME).setValue(name);
  if (desc != null)      sheet.getRange(foundRowIndex, COL_CENTER_DESC).setValue(desc);
  if (username != null)  sheet.getRange(foundRowIndex, COL_CENTER_USERNAME).setValue(username);
  if (password != null)  sheet.getRange(foundRowIndex, COL_CENTER_PASSWORD).setValue(password);
  if (status != null)    sheet.getRange(foundRowIndex, COL_CENTER_STATUS).setValue(status);

  appendAuditLog(actor, role, 'update', 'Center', centerId, 'Updated center');

  return jsonResponse({ success: true });
}

function deleteCenter(e) {
  const actorCtx = getActorContext(e);
  const denied = ensureAdmin(actorCtx);
  if (denied) return denied;
  const centerId = (e.parameter.center_id || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || 'admin');
  if (!centerId) return jsonResponse({ success: false, error: 'center_id required' });

  const sheet = getSheet(SHEET_CENTERS);
  const data = getDataRangeValues(sheet);

  let foundRowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][COL_CENTER_ID - 1] == centerId) {
      foundRowIndex = i + 2;
      break;
    }
  }
  if (foundRowIndex === -1) {
    return jsonResponse({ success: false, error: 'Center not found' });
  }

  sheet.getRange(foundRowIndex, COL_CENTER_STATUS).setValue('deleted');
  appendAuditLog(actor, role, 'delete', 'Center', centerId, 'Soft delete center');

  return jsonResponse({ success: true });
}

// ====== SPECIALISTS CRUD ======

function listSpecialists(e) {
  const actor = getActorContext(e);
  if (actor.role === 'specialist') {
    return jsonResponse({ success: false, error: 'Specialist access denied' });
  }
  let centerIdFilter = (e.parameter.center_id || '').trim(); // optional
  const statusFilter = String(e.parameter.status || '').trim().toLowerCase();
  if (actor.role === 'center') {
    centerIdFilter = actor.center_id;
  }
  const children = getDataRangeValues(getSheet(SHEET_CHILDREN));
  const data = getDataRangeValues(getSheet(SHEET_SPECIALISTS));

  const specs = data
    .filter(r => {
      const status = String(r[COL_SPEC_STATUS - 1] || '').toLowerCase();
      if (statusFilter) return status === statusFilter;
      return status !== 'deleted';
    })
    .filter(r => !centerIdFilter || r[COL_SPEC_CENTER_ID - 1] == centerIdFilter)
    .map(r => {
      const id = r[COL_SPEC_ID - 1];
      const numChildren = children.filter(c => c[COL_CHILD_SPEC_ID - 1] == id && c[COL_CHILD_STATUS - 1] !== 'deleted').length;
      return {
        specialist_id: id,
        name: r[COL_SPEC_NAME - 1],
        description: r[COL_SPEC_DESC - 1],
        username: r[COL_SPEC_USERNAME - 1],
        password: r[COL_SPEC_PASSWORD - 1],
        type: r[COL_SPEC_TYPE - 1],
        center_id: r[COL_SPEC_CENTER_ID - 1],
        status: r[COL_SPEC_STATUS - 1],
        num_children: numChildren
      };
    });

  return jsonResponse({ success: true, specialists: specs });
}

function createSpecialist(e) {
  const actorCtx = getActorContext(e);
  const name = (e.parameter.name || '').trim();
  const desc = (e.parameter.description || '').trim();
  const username = (e.parameter.username || '').trim();
  const password = (e.parameter.password || '').trim();
  let type = (e.parameter.type || 'freelance').trim(); // freelance / center
  let centerId = (e.parameter.center_id || '').trim(); // optional if freelance

  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || 'admin');

  if (!name || !username || !password) {
    return jsonResponse({ success: false, error: 'name, username, password required' });
  }
  if (actorCtx.role === 'center') {
    type = 'center';
    centerId = actorCtx.center_id;
    if (!centerId) return jsonResponse({ success: false, error: 'center_id required' });
  }

  const sheet = getSheet(SHEET_SPECIALISTS);
  const newId = generateId('specialist');

  sheet.appendRow([
    newId,
    name,
    desc,
    username,
    password,
    type,
    type === 'center' ? centerId : '',
    'active'
  ]);

  appendAuditLog(actor, role, 'create', 'Specialist', newId, 'Created specialist: ' + name);

  return jsonResponse({ success: true, specialist_id: newId });
}

function updateSpecialist(e) {
  const actorCtx = getActorContext(e);
  const specId = (e.parameter.specialist_id || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || 'admin');

  if (!specId) return jsonResponse({ success: false, error: 'specialist_id required' });
  if (actorCtx.role === 'specialist') {
    return jsonResponse({ success: false, error: 'Specialist access denied' });
  }

  const sheet = getSheet(SHEET_SPECIALISTS);
  const data = getDataRangeValues(sheet);

  let foundRowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][COL_SPEC_ID - 1] == specId) {
      foundRowIndex = i + 2;
      break;
    }
  }
  if (foundRowIndex === -1) {
    return jsonResponse({ success: false, error: 'Specialist not found' });
  }
  if (actorCtx.role === 'center') {
    const rowCenterId = data[foundRowIndex - 2][COL_SPEC_CENTER_ID - 1];
    if (String(rowCenterId || '') !== String(actorCtx.center_id || '')) {
      return jsonResponse({ success: false, error: 'Center access denied' });
    }
  }

  const name = e.parameter.name;
  const desc = e.parameter.description;
  const username = e.parameter.username;
  const password = e.parameter.password;
  const type = e.parameter.type;
  const centerId = e.parameter.center_id;
  const status = e.parameter.status;

  if (name != null)      sheet.getRange(foundRowIndex, COL_SPEC_NAME).setValue(name);
  if (desc != null)      sheet.getRange(foundRowIndex, COL_SPEC_DESC).setValue(desc);
  if (username != null)  sheet.getRange(foundRowIndex, COL_SPEC_USERNAME).setValue(username);
  if (password != null)  sheet.getRange(foundRowIndex, COL_SPEC_PASSWORD).setValue(password);
  if (type != null)      sheet.getRange(foundRowIndex, COL_SPEC_TYPE).setValue(type);
  if (centerId != null)  sheet.getRange(foundRowIndex, COL_SPEC_CENTER_ID).setValue(centerId);
  if (status != null)    sheet.getRange(foundRowIndex, COL_SPEC_STATUS).setValue(status);

  appendAuditLog(actor, role, 'update', 'Specialist', specId, 'Updated specialist');

  return jsonResponse({ success: true });
}

function deleteSpecialist(e) {
  const actorCtx = getActorContext(e);
  const specId = (e.parameter.specialist_id || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || 'admin');

  if (!specId) return jsonResponse({ success: false, error: 'specialist_id required' });
  if (actorCtx.role === 'specialist') {
    return jsonResponse({ success: false, error: 'Specialist access denied' });
  }

  const sheet = getSheet(SHEET_SPECIALISTS);
  const data = getDataRangeValues(sheet);

  let foundRowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][COL_SPEC_ID - 1] == specId) {
      foundRowIndex = i + 2;
      break;
    }
  }
  if (foundRowIndex === -1) {
    return jsonResponse({ success: false, error: 'Specialist not found' });
  }
  if (actorCtx.role === 'center') {
    const rowCenterId = data[foundRowIndex - 2][COL_SPEC_CENTER_ID - 1];
    if (String(rowCenterId || '') !== String(actorCtx.center_id || '')) {
      return jsonResponse({ success: false, error: 'Center access denied' });
    }
  }

  sheet.getRange(foundRowIndex, COL_SPEC_STATUS).setValue('deleted');
  appendAuditLog(actor, role, 'delete', 'Specialist', specId, 'Soft delete specialist');

  return jsonResponse({ success: true });
}

function getCenterSpecialists(e) {
  const actor = getActorContext(e);
  const centerId = (e.parameter.center_id || '').trim();
  if (!centerId) return jsonResponse({ success: false, error: 'center_id required' });
  const denied = ensureCenterAccess(actor, centerId);
  if (denied) return denied;
  const params = { parameter: { center_id: centerId } };
  return listSpecialists(params);
}

// ====== CHILDREN CRUD ======

function listChildren(e) {
  const actor = getActorContext(e);
  const nameFilter = (e.parameter.name || '').trim().toLowerCase();
  let centerIdFilter = (e.parameter.center_id || '').trim();
  let specIdFilter = (e.parameter.specialist_id || '').trim();
  const statusFilter = (e.parameter.status || '').trim(); // active/deleted/empty
  if (actor.role === 'center') {
    centerIdFilter = actor.center_id;
  }
  if (actor.role === 'specialist') {
    specIdFilter = actor.specialist_id;
    centerIdFilter = actor.center_id || centerIdFilter;
  }

  const children = getDataRangeValues(getSheet(SHEET_CHILDREN))
    .filter(r => !statusFilter ? (r[COL_CHILD_STATUS - 1] !== 'deleted') : (r[COL_CHILD_STATUS - 1] === statusFilter))
    .filter(r => !centerIdFilter || r[COL_CHILD_CENTER_ID - 1] == centerIdFilter)
    .filter(r => !specIdFilter || r[COL_CHILD_SPEC_ID - 1] == specIdFilter)
    .filter(r => !nameFilter || String(r[COL_CHILD_NAME - 1]).toLowerCase().indexOf(nameFilter) !== -1);

  // compute number of sessions & last assessment date
  const sessions = getDataRangeValues(getSheet(SHEET_SESSIONS));
  const responses = getDataRangeValues(getSheet(SHEET_RESPONSES))
    .filter(r => String(r[COL_RESP_STATUS - 1] || '').toLowerCase() !== 'deleted');

  const childrenJson = children.map(r => {
    const childId = r[COL_CHILD_ID - 1];
    const childSessions = sessions.filter(s => s[COL_SESS_CHILD_ID - 1] == childId);
    const childResponses = responses.filter(res => res[COL_RESP_CHILD_ID - 1] == childId);

    let latestAssessment = '';
    if (childResponses.length > 0) {
      const dates = childResponses.map(res => new Date(res[COL_RESP_DATE - 1]));
      dates.sort((a, b) => b - a);
      latestAssessment = dates[0];
    }

    return {
      child_id: childId,
      name: r[COL_CHILD_NAME - 1],
      age: r[COL_CHILD_AGE - 1],
      parent_mobile: r[COL_CHILD_MOBILE - 1],
      specialist_id: r[COL_CHILD_SPEC_ID - 1],
      center_id: r[COL_CHILD_CENTER_ID - 1],
      notes: r[COL_CHILD_NOTES - 1],
      status: r[COL_CHILD_STATUS - 1],
      num_sessions: childSessions.length,
      latest_assessment_date: latestAssessment
    };
  });

  return jsonResponse({ success: true, children: childrenJson });
}

function createChild(e) {
  const actorCtx = getActorContext(e);
  const name = (e.parameter.name || '').trim();
  const age = (e.parameter.age || '').trim();
  const parentMobile = (e.parameter.parent_mobile || '').trim();
  let specId = (e.parameter.specialist_id || '').trim();
  let centerId = (e.parameter.center_id || '').trim();
  const notes = (e.parameter.notes || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || '');

  if (!name) {
    return jsonResponse({ success: false, error: 'name required' });
  }
  if (actorCtx.role === 'specialist') {
    specId = actorCtx.specialist_id;
    centerId = actorCtx.center_id || centerId;
  }
  if (actorCtx.role === 'center') {
    centerId = actorCtx.center_id;
  }
  if (!specId && actorCtx.role === 'specialist') {
    return jsonResponse({ success: false, error: 'specialist_id required' });
  }

  const sheet = getSheet(SHEET_CHILDREN);
  const newId = generateId('child');

  sheet.appendRow([
    newId,
    name,
    age,
    parentMobile,
    specId,
    centerId,
    notes,
    'active'
  ]);

  appendAuditLog(actor, role, 'create', 'Child', newId, 'Created child: ' + name);

  return jsonResponse({ success: true, child_id: newId });
}

function updateChild(e) {
  const actorCtx = getActorContext(e);
  const childId = (e.parameter.child_id || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || '');

  if (!childId) return jsonResponse({ success: false, error: 'child_id required' });

  const sheet = getSheet(SHEET_CHILDREN);
  const data = getDataRangeValues(sheet);

  let rowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][COL_CHILD_ID - 1] == childId) {
      rowIndex = i + 2;
      break;
    }
  }
  if (rowIndex === -1) {
    return jsonResponse({ success: false, error: 'Child not found' });
  }
  if (actorCtx.role === 'center') {
    const rowCenterId = data[rowIndex - 2][COL_CHILD_CENTER_ID - 1];
    if (String(rowCenterId || '') !== String(actorCtx.center_id || '')) {
      return jsonResponse({ success: false, error: 'Center access denied' });
    }
  }
  if (actorCtx.role === 'specialist') {
    const rowSpecId = data[rowIndex - 2][COL_CHILD_SPEC_ID - 1];
    if (String(rowSpecId || '') !== String(actorCtx.specialist_id || '')) {
      return jsonResponse({ success: false, error: 'Specialist access denied' });
    }
  }

  const name = e.parameter.name;
  const age = e.parameter.age;
  const parentMobile = e.parameter.parent_mobile;
  const specId = e.parameter.specialist_id;
  const centerId = e.parameter.center_id;
  const notes = e.parameter.notes;
  const status = e.parameter.status;

  if (name != null)          sheet.getRange(rowIndex, COL_CHILD_NAME).setValue(name);
  if (age != null)           sheet.getRange(rowIndex, COL_CHILD_AGE).setValue(age);
  if (parentMobile != null)  sheet.getRange(rowIndex, COL_CHILD_MOBILE).setValue(parentMobile);
  if (specId != null)        sheet.getRange(rowIndex, COL_CHILD_SPEC_ID).setValue(specId);
  if (centerId != null)      sheet.getRange(rowIndex, COL_CHILD_CENTER_ID).setValue(centerId);
  if (notes != null)         sheet.getRange(rowIndex, COL_CHILD_NOTES).setValue(notes);
  if (status != null)        sheet.getRange(rowIndex, COL_CHILD_STATUS).setValue(status);

  appendAuditLog(actor, role, 'update', 'Child', childId, 'Updated child');

  return jsonResponse({ success: true });
}

function deleteChild(e) {
  const actorCtx = getActorContext(e);
  const childId = (e.parameter.child_id || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || '');

  if (!childId) return jsonResponse({ success: false, error: 'child_id required' });

  const sheet = getSheet(SHEET_CHILDREN);
  const data = getDataRangeValues(sheet);

  let rowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][COL_CHILD_ID - 1] == childId) {
      rowIndex = i + 2;
      break;
    }
  }
  if (rowIndex === -1) {
    return jsonResponse({ success: false, error: 'Child not found' });
  }
  if (actorCtx.role === 'center') {
    const rowCenterId = data[rowIndex - 2][COL_CHILD_CENTER_ID - 1];
    if (String(rowCenterId || '') !== String(actorCtx.center_id || '')) {
      return jsonResponse({ success: false, error: 'Center access denied' });
    }
  }
  if (actorCtx.role === 'specialist') {
    const rowSpecId = data[rowIndex - 2][COL_CHILD_SPEC_ID - 1];
    if (String(rowSpecId || '') !== String(actorCtx.specialist_id || '')) {
      return jsonResponse({ success: false, error: 'Specialist access denied' });
    }
  }

  sheet.getRange(rowIndex, COL_CHILD_STATUS).setValue('deleted');
  appendAuditLog(actor, role, 'delete', 'Child', childId, 'Soft delete child');

  return jsonResponse({ success: true });
}

// ====== CHILD PROFILE (Combines child + sessions + assessments) ======

function getChildProfile(e) {
  const actor = getActorContext(e);
  const childId = (e.parameter.child_id || '').trim();
  if (!childId) return jsonResponse({ success: false, error: 'child_id required' });

  const childrenSheet = getSheet(SHEET_CHILDREN);
  const childrenData = getDataRangeValues(childrenSheet);

  let childRow = null;
  for (let i = 0; i < childrenData.length; i++) {
    if (childrenData[i][COL_CHILD_ID - 1] == childId) {
      childRow = childrenData[i];
      break;
    }
  }
  if (!childRow) {
    return jsonResponse({ success: false, error: 'Child not found' });
  }
  if (actor.role === 'center') {
    const rowCenterId = childRow[COL_CHILD_CENTER_ID - 1];
    if (String(rowCenterId || '') !== String(actor.center_id || '')) {
      return jsonResponse({ success: false, error: 'Center access denied' });
    }
  }
  if (actor.role === 'specialist') {
    const rowSpecId = childRow[COL_CHILD_SPEC_ID - 1];
    if (String(rowSpecId || '') !== String(actor.specialist_id || '')) {
      return jsonResponse({ success: false, error: 'Specialist access denied' });
    }
  }

  const sessionsData = getDataRangeValues(getSheet(SHEET_SESSIONS))
    .filter(r => r[COL_SESS_CHILD_ID - 1] == childId)
    .map(r => ({
      session_id: r[COL_SESS_ID - 1],
      child_id: r[COL_SESS_CHILD_ID - 1],
      specialist_id: r[COL_SESS_SPEC_ID - 1],
      center_id: r[COL_SESS_CENTER_ID - 1],
      date: r[COL_SESS_DATE - 1],
      module_id: r[COL_SESS_MODULE_ID - 1],
      duration_minutes: r[COL_SESS_DURATION - 1],
      notes: r[COL_SESS_NOTES - 1]
    }));

  const responsesData = getDataRangeValues(getSheet(SHEET_RESPONSES))
    .filter(r => r[COL_RESP_CHILD_ID - 1] == childId)
    .filter(r => String(r[COL_RESP_STATUS - 1] || '').toLowerCase() !== 'deleted')
    .map(r => ({
      response_id: r[COL_RESP_ID - 1],
      child_id: r[COL_RESP_CHILD_ID - 1],
      specialist_id: r[COL_RESP_SPEC_ID - 1],
      center_id: r[COL_RESP_CENTER_ID - 1],
      date: r[COL_RESP_DATE - 1],
      question_id: r[COL_RESP_Q_ID - 1],
      score: r[COL_RESP_SCORE - 1],
      notes: r[COL_RESP_NOTES - 1],
      status: r[COL_RESP_STATUS - 1]
    }));

  const childJson = {
    child_id: childRow[COL_CHILD_ID - 1],
    name: childRow[COL_CHILD_NAME - 1],
    age: childRow[COL_CHILD_AGE - 1],
    parent_mobile: childRow[COL_CHILD_MOBILE - 1],
    specialist_id: childRow[COL_CHILD_SPEC_ID - 1],
    center_id: childRow[COL_CHILD_CENTER_ID - 1],
    notes: childRow[COL_CHILD_NOTES - 1],
    status: childRow[COL_CHILD_STATUS - 1]
  };

  return jsonResponse({
    success: true,
    child: childJson,
    sessions: sessionsData,
    assessments: responsesData
  });
}

// ====== MODULES CRUD + ASSIGNMENTS ======

function listModules(e) {
  const actor = getActorContext(e);
  if (actor.role === 'specialist') {
    return jsonResponse({ success: false, error: 'Specialist access denied' });
  }
  const statusFilter = String(e.parameter.status || '').trim().toLowerCase();
  const data = getDataRangeValues(getSheet(SHEET_MODULES));
  const assignments = getDataRangeValues(getSheet(SHEET_MODULE_ASSIGNMENTS));

  const modules = data
    .filter(r => {
      const status = String(r[COL_MOD_STATUS - 1] || '').toLowerCase();
      if (statusFilter) return status === statusFilter;
      return status !== 'deleted';
    })
    .map(r => {
      const id = r[COL_MOD_ID - 1];
      const numCenters = assignments.filter(a => a[COL_ASSIGN_MOD_ID - 1] == id && a[COL_ASSIGN_STATUS - 1] !== 'deleted').length;
      return {
        module_id: id,
        name: r[COL_MOD_NAME - 1],
        photo_url: r[COL_MOD_PHOTO - 1],
        description: r[COL_MOD_DESC - 1],
        minutes_to_play: r[COL_MOD_MINUTES - 1],
        status: r[COL_MOD_STATUS - 1],
        num_centers_assigned: numCenters
      };
    });

  return jsonResponse({ success: true, modules: modules });
}

function createModule(e) {
  const actorCtx = getActorContext(e);
  const denied = ensureAdmin(actorCtx);
  if (denied) return denied;
  const name = (e.parameter.name || '').trim();
  const photo = (e.parameter.photo_url || '').trim();
  const desc = (e.parameter.description || '').trim();
  const minutes = (e.parameter.minutes_to_play || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || 'admin');

  if (!name) return jsonResponse({ success: false, error: 'name required' });

  const sheet = getSheet(SHEET_MODULES);
  const newId = generateId('module');

  sheet.appendRow([
    newId,
    name,
    photo,
    desc,
    minutes,
    'active'
  ]);

  appendAuditLog(actor, role, 'create', 'Module', newId, 'Created module: ' + name);

  return jsonResponse({ success: true, module_id: newId });
}

function updateModule(e) {
  const actorCtx = getActorContext(e);
  const denied = ensureAdmin(actorCtx);
  if (denied) return denied;
  const moduleId = (e.parameter.module_id || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || 'admin');

  if (!moduleId) return jsonResponse({ success: false, error: 'module_id required' });

  const sheet = getSheet(SHEET_MODULES);
  const data = getDataRangeValues(sheet);

  let rowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][COL_MOD_ID - 1] == moduleId) {
      rowIndex = i + 2;
      break;
    }
  }
  if (rowIndex === -1) {
    return jsonResponse({ success: false, error: 'Module not found' });
  }

  const name = e.parameter.name;
  const photo = e.parameter.photo_url;
  const desc = e.parameter.description;
  const minutes = e.parameter.minutes_to_play;
  const status = e.parameter.status;

  if (name != null)    sheet.getRange(rowIndex, COL_MOD_NAME).setValue(name);
  if (photo != null)   sheet.getRange(rowIndex, COL_MOD_PHOTO).setValue(photo);
  if (desc != null)    sheet.getRange(rowIndex, COL_MOD_DESC).setValue(desc);
  if (minutes != null) sheet.getRange(rowIndex, COL_MOD_MINUTES).setValue(minutes);
  if (status != null)  sheet.getRange(rowIndex, COL_MOD_STATUS).setValue(status);

  appendAuditLog(actor, role, 'update', 'Module', moduleId, 'Updated module');

  return jsonResponse({ success: true });
}

function deleteModule(e) {
  const actorCtx = getActorContext(e);
  const denied = ensureAdmin(actorCtx);
  if (denied) return denied;
  const moduleId = (e.parameter.module_id || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || 'admin');

  if (!moduleId) return jsonResponse({ success: false, error: 'module_id required' });

  const sheet = getSheet(SHEET_MODULES);
  const data = getDataRangeValues(sheet);

  let rowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][COL_MOD_ID - 1] == moduleId) {
      rowIndex = i + 2;
      break;
    }
  }
  if (rowIndex === -1) {
    return jsonResponse({ success: false, error: 'Module not found' });
  }

  sheet.getRange(rowIndex, COL_MOD_STATUS).setValue('deleted');
  appendAuditLog(actor, role, 'delete', 'Module', moduleId, 'Soft delete module');

  return jsonResponse({ success: true });
}

function assignModuleToCenter(e) {
  const actorCtx = getActorContext(e);
  const moduleId = (e.parameter.module_id || '').trim();
  const centerId = (e.parameter.center_id || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || 'admin');

  if (!moduleId || !centerId) {
    return jsonResponse({ success: false, error: 'module_id and center_id required' });
  }
  if (actorCtx.role !== 'admin') {
    const denied = ensureCenterAccess(actorCtx, centerId);
    if (denied) return denied;
  }

  const sheet = getSheet(SHEET_MODULE_ASSIGNMENTS);
  const data = getDataRangeValues(sheet);
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][COL_ASSIGN_MOD_ID - 1]) === moduleId &&
        String(data[i][COL_ASSIGN_CENTER_ID - 1]) === centerId) {
      if (data[i][COL_ASSIGN_STATUS - 1] === 'deleted') {
        sheet.getRange(i + 2, COL_ASSIGN_STATUS).setValue('active');
        appendAuditLog(actor, role, 'update', 'Module_Assignment', data[i][COL_ASSIGN_ID - 1], 'Reactivated assignment');
      }
      return jsonResponse({ success: true, assignment_id: data[i][COL_ASSIGN_ID - 1] });
    }
  }
  const newId = generateId('assignment');

  sheet.appendRow([
    newId,
    moduleId,
    centerId,
    'active'
  ]);

  appendAuditLog(actor, role, 'create', 'Module_Assignment', newId,
    'Assigned module ' + moduleId + ' to center ' + centerId);

  return jsonResponse({ success: true, assignment_id: newId });
}

function assignModulesToCenter(e) {
  const actorCtx = getActorContext(e);
  const centerId = (e.parameter.center_id || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || 'admin');
  let modulesJson = (e.parameter.module_ids_json || '').trim();
  const moduleIdsParam = e.parameter.module_ids;

  if (!centerId) return jsonResponse({ success: false, error: 'center_id required' });
  if (actorCtx.role !== 'admin') {
    const denied = ensureCenterAccess(actorCtx, centerId);
    if (denied) return denied;
  }

  let moduleIds = [];
  if (modulesJson) {
    try {
      moduleIds = JSON.parse(modulesJson);
    } catch (ex) {
      return jsonResponse({ success: false, error: 'Invalid module_ids_json: ' + ex.message });
    }
  } else if (moduleIdsParam) {
    moduleIds = Array.isArray(moduleIdsParam) ? moduleIdsParam : [moduleIdsParam];
  }

  if (!moduleIds.length) {
    return jsonResponse({ success: false, error: 'module_ids required' });
  }

  const sheet = getSheet(SHEET_MODULE_ASSIGNMENTS);
  const data = getDataRangeValues(sheet);
  const results = [];

  moduleIds.forEach(rawId => {
    const moduleId = String(rawId);
    let existingRow = null;
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][COL_ASSIGN_MOD_ID - 1]) === moduleId &&
          String(data[i][COL_ASSIGN_CENTER_ID - 1]) === centerId) {
        existingRow = { rowIndex: i + 2, row: data[i] };
        break;
      }
    }
    if (existingRow) {
      if (existingRow.row[COL_ASSIGN_STATUS - 1] === 'deleted') {
        sheet.getRange(existingRow.rowIndex, COL_ASSIGN_STATUS).setValue('active');
        appendAuditLog(actor, role, 'update', 'Module_Assignment', existingRow.row[COL_ASSIGN_ID - 1], 'Reactivated assignment');
      }
      results.push(existingRow.row[COL_ASSIGN_ID - 1]);
      return;
    }

    const newId = generateId('assignment');
    sheet.appendRow([newId, moduleId, centerId, 'active']);
    appendAuditLog(actor, role, 'create', 'Module_Assignment', newId, 'Assigned module ' + moduleId + ' to center ' + centerId);
    results.push(newId);
  });

  return jsonResponse({ success: true, assignment_ids: results });
}

function removeModuleFromCenter(e) {
  const actorCtx = getActorContext(e);
  const assignmentId = (e.parameter.assignment_id || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || 'admin');

  if (!assignmentId) {
    return jsonResponse({ success: false, error: 'assignment_id required' });
  }

  const sheet = getSheet(SHEET_MODULE_ASSIGNMENTS);
  const data = getDataRangeValues(sheet);

  let rowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][COL_ASSIGN_ID - 1] == assignmentId) {
      rowIndex = i + 2;
      break;
    }
  }
  if (rowIndex === -1) {
    return jsonResponse({ success: false, error: 'Assignment not found' });
  }
  if (actorCtx.role !== 'admin') {
    const rowCenterId = data[rowIndex - 2][COL_ASSIGN_CENTER_ID - 1];
    const denied = ensureCenterAccess(actorCtx, rowCenterId);
    if (denied) return denied;
  }

  sheet.getRange(rowIndex, COL_ASSIGN_STATUS).setValue('deleted');
  appendAuditLog(actor, role, 'delete', 'Module_Assignment', assignmentId, 'Soft delete module assignment');

  return jsonResponse({ success: true });
}

function listCenterModules(e) {
  const actor = getActorContext(e);
  const centerId = (e.parameter.center_id || '').trim();
  if (!centerId) return jsonResponse({ success: false, error: 'center_id required' });
  const denied = ensureCenterAccess(actor, centerId);
  if (denied) return denied;

  const modulesSheet = getSheet(SHEET_MODULES);
  const modulesData = getDataRangeValues(modulesSheet);

  const assignments = getDataRangeValues(getSheet(SHEET_MODULE_ASSIGNMENTS))
    .filter(r => r[COL_ASSIGN_CENTER_ID - 1] == centerId && r[COL_ASSIGN_STATUS - 1] !== 'deleted');

  const moduleMap = {};
  modulesData.forEach(r => {
    if (r[COL_MOD_STATUS - 1] === 'deleted') return;
    moduleMap[r[COL_MOD_ID - 1]] = r;
  });

  const modules = assignments
    .map(a => {
      const modId = a[COL_ASSIGN_MOD_ID - 1];
      const mr = moduleMap[modId];
      if (!mr) return null;
      return {
        module_id: modId,
        name: mr[COL_MOD_NAME - 1],
        photo_url: mr[COL_MOD_PHOTO - 1],
        description: mr[COL_MOD_DESC - 1],
        minutes_to_play: mr[COL_MOD_MINUTES - 1],
        status: mr[COL_MOD_STATUS - 1],
        assignment_id: a[COL_ASSIGN_ID - 1]
      };
    })
    .filter(x => x);

  return jsonResponse({ success: true, center_id: centerId, modules: modules });
}

// ====== ASSESSMENTS (Questions + Responses) ======

function listQuestions(e) {
  const actor = getActorContext(e);
  if (actor.role === 'center') {
    return jsonResponse({ success: false, error: 'Center access denied' });
  }
  const statusFilter = String(e.parameter.status || '').trim().toLowerCase();
  const data = getDataRangeValues(getSheet(SHEET_QUESTIONS))
    .filter(r => {
      const status = String(r[COL_Q_STATUS - 1] || '').toLowerCase();
      if (statusFilter) return status === statusFilter;
      return status !== 'deleted';
    })
    .map(r => ({
      question_id: r[COL_Q_ID - 1],
      question_text: r[COL_Q_TEXT - 1],
      category: r[COL_Q_CATEGORY - 1],
      difficulty: r[COL_Q_DIFFICULTY - 1],
      status: r[COL_Q_STATUS - 1]
    }));
  return jsonResponse({ success: true, questions: data });
}

function createQuestion(e) {
  const actorCtx = getActorContext(e);
  const denied = ensureAdmin(actorCtx);
  if (denied) return denied;
  const text = (e.parameter.question_text || '').trim();
  const category = (e.parameter.category || '').trim();
  const difficulty = (e.parameter.difficulty || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || 'admin');

  if (!text) return jsonResponse({ success: false, error: 'question_text required' });

  const sheet = getSheet(SHEET_QUESTIONS);
  const newId = generateId('question');

  sheet.appendRow([
    newId,
    text,
    category,
    difficulty,
    'active'
  ]);

  appendAuditLog(actor, role, 'create', 'Question', newId, 'Created question');

  return jsonResponse({ success: true, question_id: newId });
}

function updateQuestion(e) {
  const actorCtx = getActorContext(e);
  const denied = ensureAdmin(actorCtx);
  if (denied) return denied;
  const qId = (e.parameter.question_id || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || 'admin');

  if (!qId) return jsonResponse({ success: false, error: 'question_id required' });

  const sheet = getSheet(SHEET_QUESTIONS);
  const data = getDataRangeValues(sheet);

  let rowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][COL_Q_ID - 1] == qId) {
      rowIndex = i + 2;
      break;
    }
  }
  if (rowIndex === -1) {
    return jsonResponse({ success: false, error: 'Question not found' });
  }

  const text = e.parameter.question_text;
  const category = e.parameter.category;
  const difficulty = e.parameter.difficulty;
  const status = e.parameter.status;

  if (text != null)       sheet.getRange(rowIndex, COL_Q_TEXT).setValue(text);
  if (category != null)   sheet.getRange(rowIndex, COL_Q_CATEGORY).setValue(category);
  if (difficulty != null) sheet.getRange(rowIndex, COL_Q_DIFFICULTY).setValue(difficulty);
  if (status != null)     sheet.getRange(rowIndex, COL_Q_STATUS).setValue(status);

  appendAuditLog(actor, role, 'update', 'Question', qId, 'Updated question');

  return jsonResponse({ success: true });
}

function deleteQuestion(e) {
  const actorCtx = getActorContext(e);
  const denied = ensureAdmin(actorCtx);
  if (denied) return denied;
  const qId = (e.parameter.question_id || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || 'admin');

  if (!qId) return jsonResponse({ success: false, error: 'question_id required' });

  const sheet = getSheet(SHEET_QUESTIONS);
  const data = getDataRangeValues(sheet);

  let rowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][COL_Q_ID - 1] == qId) {
      rowIndex = i + 2;
      break;
    }
  }
  if (rowIndex === -1) {
    return jsonResponse({ success: false, error: 'Question not found' });
  }

  sheet.getRange(rowIndex, COL_Q_STATUS).setValue('deleted');
  appendAuditLog(actor, role, 'delete', 'Question', qId, 'Soft delete question');

  return jsonResponse({ success: true });
}

// createAssessment expects:
// - child_id
// - specialist_id
// - center_id
// - date
// - notes (optional, for whole assessment)
// - answers_json: JSON string array of {question_id, score, notes?}
function createAssessment(e) {
  const actorCtx = getActorContext(e);
  const childId = (e.parameter.child_id || '').trim();
  let specId = (e.parameter.specialist_id || '').trim();
  let centerId = (e.parameter.center_id || '').trim();
  const date = (e.parameter.date || '').trim();
  const answersJson = (e.parameter.answers_json || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || 'specialist');

  if (actorCtx.role === 'specialist') {
    specId = actorCtx.specialist_id;
    centerId = actorCtx.center_id || centerId;
  }
  if (!childId || !specId || !date || !answersJson) {
    return jsonResponse({ success: false, error: 'child_id, specialist_id, date, answers_json required' });
  }

  let answers;
  try {
    answers = JSON.parse(answersJson);
  } catch (ex) {
    return jsonResponse({ success: false, error: 'Invalid answers_json: ' + ex.message });
  }

  const sheet = getSheet(SHEET_RESPONSES);
  const createdIds = [];

  answers.forEach(a => {
    const respId = generateId('assessment_response');
    sheet.appendRow([
      respId,
      childId,
      specId,
      centerId,
      date,
      a.question_id,
      a.score,
      a.notes || '',
      'active'
    ]);
    createdIds.push(respId);
  });

  appendAuditLog(actor, role, 'create', 'Assessment', childId, 'Created assessment with ' + createdIds.length + ' responses');

  return jsonResponse({ success: true, response_ids: createdIds });
}

// updateAssessment: here we assume front-end will re-send full set of responses to replace existing ones for that child & date
function updateAssessment(e) {
  const actorCtx = getActorContext(e);
  const childId = (e.parameter.child_id || '').trim();
  const date = (e.parameter.date || '').trim();
  const answersJson = (e.parameter.answers_json || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || 'specialist');

  if (!childId || !date || !answersJson) {
    return jsonResponse({ success: false, error: 'child_id, date, answers_json required' });
  }

  let answers;
  try {
    answers = JSON.parse(answersJson);
  } catch (ex) {
    return jsonResponse({ success: false, error: 'Invalid answers_json: ' + ex.message });
  }

  const sheet = getSheet(SHEET_RESPONSES);
  const data = getDataRangeValues(sheet);

  // soft delete existing responses for this child & date
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i][COL_RESP_CHILD_ID - 1] == childId &&
        String(data[i][COL_RESP_DATE - 1]) == date) {
      sheet.getRange(i + 2, COL_RESP_STATUS).setValue('deleted');
    }
  }

  const createdIds = [];
  answers.forEach(a => {
    const respId = generateId('assessment_response');
    sheet.appendRow([
      respId,
      childId,
      a.specialist_id || actorCtx.specialist_id || '',
      a.center_id || actorCtx.center_id || '',
      date,
      a.question_id,
      a.score,
      a.notes || '',
      'active'
    ]);
    createdIds.push(respId);
  });

  appendAuditLog(actor, role, 'update', 'Assessment', childId, 'Updated assessment for date ' + date);

  return jsonResponse({ success: true, response_ids: createdIds });
}

// listAssessmentResponses can filter by child, specialist, center, date range (simple)
function listAssessmentResponses(e) {
  const actor = getActorContext(e);
  let childId = (e.parameter.child_id || '').trim();
  let specId = (e.parameter.specialist_id || '').trim();
  let centerId = (e.parameter.center_id || '').trim();
  const fromDate = (e.parameter.from_date || '').trim();
  const toDate = (e.parameter.to_date || '').trim();
  const statusFilter = String(e.parameter.status || '').trim().toLowerCase();
  if (actor.role === 'center') {
    centerId = actor.center_id;
  }
  if (actor.role === 'specialist') {
    specId = actor.specialist_id;
    centerId = actor.center_id || centerId;
  }

  const data = getDataRangeValues(getSheet(SHEET_RESPONSES));

  const responses = data.filter(r => {
    if (childId && r[COL_RESP_CHILD_ID - 1] != childId) return false;
    if (specId && r[COL_RESP_SPEC_ID - 1] != specId) return false;
    if (centerId && r[COL_RESP_CENTER_ID - 1] != centerId) return false;
    const status = String(r[COL_RESP_STATUS - 1] || '').toLowerCase();
    if (statusFilter) {
      if (status !== statusFilter) return false;
    } else if (status === 'deleted') {
      return false;
    }

    if (fromDate) {
      if (new Date(r[COL_RESP_DATE - 1]) < new Date(fromDate)) return false;
    }
    if (toDate) {
      if (new Date(r[COL_RESP_DATE - 1]) > new Date(toDate)) return false;
    }

    return true;
  }).map(r => ({
    response_id: r[COL_RESP_ID - 1],
    child_id: r[COL_RESP_CHILD_ID - 1],
    specialist_id: r[COL_RESP_SPEC_ID - 1],
    center_id: r[COL_RESP_CENTER_ID - 1],
    date: r[COL_RESP_DATE - 1],
    question_id: r[COL_RESP_Q_ID - 1],
    score: r[COL_RESP_SCORE - 1],
    notes: r[COL_RESP_NOTES - 1],
    status: r[COL_RESP_STATUS - 1]
  }));

  return jsonResponse({ success: true, responses: responses });
}

// ====== SESSIONS ======

function listSessionsByChild(e) {
  const actor = getActorContext(e);
  const childId = (e.parameter.child_id || '').trim();
  if (!childId) return jsonResponse({ success: false, error: 'child_id required' });
  if (actor.role !== 'admin') {
    const childRow = getChildRowById(childId);
    if (!childRow) return jsonResponse({ success: false, error: 'Child not found' });
    if (actor.role === 'center' && String(childRow[COL_CHILD_CENTER_ID - 1] || '') !== String(actor.center_id || '')) {
      return jsonResponse({ success: false, error: 'Center access denied' });
    }
    if (actor.role === 'specialist' && String(childRow[COL_CHILD_SPEC_ID - 1] || '') !== String(actor.specialist_id || '')) {
      return jsonResponse({ success: false, error: 'Specialist access denied' });
    }
  }

  const data = getDataRangeValues(getSheet(SHEET_SESSIONS))
    .filter(r => r[COL_SESS_CHILD_ID - 1] == childId)
    .map(r => ({
      session_id: r[COL_SESS_ID - 1],
      child_id: r[COL_SESS_CHILD_ID - 1],
      specialist_id: r[COL_SESS_SPEC_ID - 1],
      center_id: r[COL_SESS_CENTER_ID - 1],
      date: r[COL_SESS_DATE - 1],
      module_id: r[COL_SESS_MODULE_ID - 1],
      duration_minutes: r[COL_SESS_DURATION - 1],
      notes: r[COL_SESS_NOTES - 1]
    }));

  return jsonResponse({ success: true, sessions: data });
}

// createSession expects:
// - child_id
// - specialist_id
// - center_id
// - date
// - module_ids_json: JSON array of module IDs (multiple modules -> multiple rows)
// - duration_minutes
// - notes
function createSession(e) {
  const actorCtx = getActorContext(e);
  const childId = (e.parameter.child_id || '').trim();
  let specId = (e.parameter.specialist_id || '').trim();
  let centerId = (e.parameter.center_id || '').trim();
  const date = (e.parameter.date || '').trim();
  const modulesJson = (e.parameter.module_ids_json || '').trim();
  const duration = (e.parameter.duration_minutes || '').trim();
  const notes = (e.parameter.notes || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || 'specialist');

  if (actorCtx.role === 'specialist') {
    specId = actorCtx.specialist_id;
    centerId = actorCtx.center_id || centerId;
  }
  if (!childId || !specId || !date || !modulesJson) {
    return jsonResponse({ success: false, error: 'child_id, specialist_id, date, module_ids_json required' });
  }

  let modules;
  try {
    modules = JSON.parse(modulesJson);
  } catch (ex) {
    return jsonResponse({ success: false, error: 'Invalid module_ids_json: ' + ex.message });
  }

  const sheet = getSheet(SHEET_SESSIONS);
  const createdIds = [];

  modules.forEach(mid => {
    const sessId = generateId('session');
    sheet.appendRow([
      sessId,
      childId,
      specId,
      centerId,
      date,
      mid,
      duration,
      notes
    ]);
    createdIds.push(sessId);
  });

  appendAuditLog(actor, role, 'create', 'Session', childId, 'Created ' + createdIds.length + ' session rows');

  return jsonResponse({ success: true, session_ids: createdIds });
}

// updateSession updates a single row (one module)
// expects session_id
function updateSession(e) {
  const actorCtx = getActorContext(e);
  const sessId = (e.parameter.session_id || '').trim();
  const actor = (e.parameter.actor_username || actorCtx.username || 'system');
  const role = (e.parameter.actor_role || actorCtx.role || 'specialist');

  if (!sessId) return jsonResponse({ success: false, error: 'session_id required' });

  const sheet = getSheet(SHEET_SESSIONS);
  const data = getDataRangeValues(sheet);

  let rowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][COL_SESS_ID - 1] == sessId) {
      rowIndex = i + 2;
      break;
    }
  }
  if (rowIndex === -1) {
    return jsonResponse({ success: false, error: 'Session not found' });
  }
  if (actorCtx.role !== 'admin') {
    const row = data[rowIndex - 2];
    if (actorCtx.role === 'center' && String(row[COL_SESS_CENTER_ID - 1] || '') !== String(actorCtx.center_id || '')) {
      return jsonResponse({ success: false, error: 'Center access denied' });
    }
    if (actorCtx.role === 'specialist' && String(row[COL_SESS_SPEC_ID - 1] || '') !== String(actorCtx.specialist_id || '')) {
      return jsonResponse({ success: false, error: 'Specialist access denied' });
    }
  }

  const date = e.parameter.date;
  const moduleId = e.parameter.module_id;
  const duration = e.parameter.duration_minutes;
  const notes = e.parameter.notes;

  if (date != null)      sheet.getRange(rowIndex, COL_SESS_DATE).setValue(date);
  if (moduleId != null)  sheet.getRange(rowIndex, COL_SESS_MODULE_ID).setValue(moduleId);
  if (duration != null)  sheet.getRange(rowIndex, COL_SESS_DURATION).setValue(duration);
  if (notes != null)     sheet.getRange(rowIndex, COL_SESS_NOTES).setValue(notes);

  appendAuditLog(actor, role, 'update', 'Session', sessId, 'Updated session');

  return jsonResponse({ success: true });
}

// ====== AUDIT LOG ======

function getAuditLog(e) {
  const actor = getActorContext(e);
  const denied = ensureAdmin(actor);
  if (denied) return denied;
  const limit = Number(e.parameter.limit || 100);
  const data = getDataRangeValues(getSheet(SHEET_AUDIT));
  const logs = data.slice(-limit).map(r => ({
    log_id: r[COL_LOG_ID - 1],
    timestamp: r[COL_LOG_TIMESTAMP - 1],
    username: r[COL_LOG_USERNAME - 1],
    role: r[COL_LOG_ROLE - 1],
    action: r[COL_LOG_ACTION - 1],
    entity_type: r[COL_LOG_ENTITY_TYPE - 1],
    entity_id: r[COL_LOG_ENTITY_ID - 1],
    notes: r[COL_LOG_NOTES - 1]
  }));

  return jsonResponse({ success: true, logs: logs });
}

function getDashboardReports(e) {
  const actor = getActorContext(e);
  const denied = ensureAdmin(actor);
  if (denied) return denied;

  const centers = getDataRangeValues(getSheet(SHEET_CENTERS))
    .filter(r => r[COL_CENTER_STATUS - 1] !== 'deleted');
  const specs = getDataRangeValues(getSheet(SHEET_SPECIALISTS))
    .filter(r => r[COL_SPEC_STATUS - 1] !== 'deleted');
  const children = getDataRangeValues(getSheet(SHEET_CHILDREN))
    .filter(r => r[COL_CHILD_STATUS - 1] !== 'deleted');
  const modules = getDataRangeValues(getSheet(SHEET_MODULES))
    .filter(r => r[COL_MOD_STATUS - 1] !== 'deleted');
  const sessions = getDataRangeValues(getSheet(SHEET_SESSIONS));
  const responses = getDataRangeValues(getSheet(SHEET_RESPONSES))
    .filter(r => String(r[COL_RESP_STATUS - 1] || '').toLowerCase() !== 'deleted');
  const audit = getDataRangeValues(getSheet(SHEET_AUDIT));

  const moduleMap = {};
  modules.forEach(r => {
    moduleMap[r[COL_MOD_ID - 1]] = r[COL_MOD_NAME - 1];
  });

  const moduleUsage = {};
  sessions.forEach(r => {
    const modId = r[COL_SESS_MODULE_ID - 1];
    if (!modId) return;
    moduleUsage[modId] = (moduleUsage[modId] || 0) + 1;
  });

  const topModules = Object.keys(moduleUsage)
    .map(id => ({ module_id: id, name: moduleMap[id] || id, sessions: moduleUsage[id] }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 6);

  const dayLabels = [];
  const sessionByDay = [];
  const assessmentByDay = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = Utilities.formatDate(d, Session.getScriptTimeZone(), 'EEE');
    const key = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    dayLabels.push(label);
    sessionByDay.push({ key: key, value: 0 });
    assessmentByDay.push({ key: key, value: 0 });
  }

  sessions.forEach(r => {
    const rawDate = r[COL_SESS_DATE - 1];
    if (!rawDate) return;
    const key = Utilities.formatDate(new Date(rawDate), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const idx = sessionByDay.findIndex(item => item.key === key);
    if (idx === -1) return;
    const duration = Number(r[COL_SESS_DURATION - 1]) || 1;
    sessionByDay[idx].value += duration;
  });

  responses.forEach(r => {
    const rawDate = r[COL_RESP_DATE - 1];
    if (!rawDate) return;
    const key = Utilities.formatDate(new Date(rawDate), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const idx = assessmentByDay.findIndex(item => item.key === key);
    if (idx === -1) return;
    assessmentByDay[idx].value += 1;
  });

  const scored = responses.map(r => Number(r[COL_RESP_SCORE - 1]) || 0);
  const avgScore = scored.length
    ? Math.round(scored.reduce((acc, val) => acc + val, 0) / scored.length)
    : 0;

  const centerScores = {};
  responses.forEach(r => {
    const centerId = r[COL_RESP_CENTER_ID - 1];
    if (!centerId) return;
    if (!centerScores[centerId]) {
      centerScores[centerId] = { total: 0, count: 0 };
    }
    centerScores[centerId].total += Number(r[COL_RESP_SCORE - 1]) || 0;
    centerScores[centerId].count += 1;
  });

  const centerMap = {};
  centers.forEach(r => {
    centerMap[r[COL_CENTER_ID - 1]] = r[COL_CENTER_NAME - 1];
  });

  const childrenByCenterMap = {};
  children.forEach(r => {
    const centerId = r[COL_CHILD_CENTER_ID - 1];
    if (!centerId) return;
    childrenByCenterMap[centerId] = (childrenByCenterMap[centerId] || 0) + 1;
  });

  const specialistsByCenterMap = {};
  specs.forEach(r => {
    const centerId = r[COL_SPEC_CENTER_ID - 1];
    if (!centerId) return;
    specialistsByCenterMap[centerId] = (specialistsByCenterMap[centerId] || 0) + 1;
  });

  const childrenByCenter = centers.map(r => {
    const centerId = r[COL_CENTER_ID - 1];
    return {
      center_id: centerId,
      name: centerMap[centerId] || centerId,
      count: childrenByCenterMap[centerId] || 0
    };
  }).sort((a, b) => b.count - a.count);

  const specialistsByCenter = centers.map(r => {
    const centerId = r[COL_CENTER_ID - 1];
    return {
      center_id: centerId,
      name: centerMap[centerId] || centerId,
      count: specialistsByCenterMap[centerId] || 0
    };
  }).sort((a, b) => b.count - a.count);

  const auditLabels = [];
  const auditByDay = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = Utilities.formatDate(d, Session.getScriptTimeZone(), 'EEE');
    const key = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    auditLabels.push(label);
    auditByDay.push({ key: key, value: 0 });
  }

  audit.forEach(r => {
    const rawDate = r[COL_LOG_TIMESTAMP - 1];
    if (!rawDate) return;
    const key = Utilities.formatDate(new Date(rawDate), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const idx = auditByDay.findIndex(item => item.key === key);
    if (idx === -1) return;
    auditByDay[idx].value += 1;
  });

  const centerProgress = Object.keys(centerScores).map(id => ({
    center_id: id,
    name: centerMap[id] || id,
    score: centerScores[id].count
      ? Math.round(centerScores[id].total / centerScores[id].count)
      : 0
  })).sort((a, b) => b.score - a.score).slice(0, 6);

  const activity = audit.slice(-8).map(r => ({
    log_id: r[COL_LOG_ID - 1],
    timestamp: r[COL_LOG_TIMESTAMP - 1],
    username: r[COL_LOG_USERNAME - 1],
    role: r[COL_LOG_ROLE - 1],
    action: r[COL_LOG_ACTION - 1],
    entity_type: r[COL_LOG_ENTITY_TYPE - 1],
    entity_id: r[COL_LOG_ENTITY_ID - 1],
    notes: r[COL_LOG_NOTES - 1]
  }));

  return jsonResponse({
    success: true,
    totals: {
      centers: centers.length,
      specialists: specs.length,
      children: children.length,
      modules: modules.length
    },
    top_modules: topModules,
    sessions_by_day: {
      labels: dayLabels,
      therapy: sessionByDay.map(item => item.value),
      assessments: assessmentByDay.map(item => item.value)
    },
    children_by_center: childrenByCenter,
    specialists_by_center: specialistsByCenter,
    avg_assessment_score: avgScore,
    center_progress: centerProgress,
    recent_activity: activity,
    audit_timeline: {
      labels: auditLabels,
      counts: auditByDay.map(item => item.value)
    }
  });
}
