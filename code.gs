const SHEET_ACCOUNTS = "Accounts";
const SHEET_CENTERS = "Centers";
const SHEET_SPECIALISTS = "Specialists";
const SHEET_CHILDREN = "Children";
const SHEET_VR = "VR";
const SHEET_CENTERVR = "CenterVR";

const ALLOWED_ROUTES = {
  login: true,
  centers: true,
  specialists: true,
  children: true,
  vr: true,
  centervr: true
};

function normalizeAction(value) {
  return String(value || "").trim().toLowerCase();
}

function doPost(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const route = String(params.route || "").trim().toLowerCase();
    if (!route) {
      return jsonError("Missing route");
    }
    if (!ALLOWED_ROUTES[route]) {
      return jsonError("Unknown route");
    }

    if (route === "login") {
      return jsonSuccess(handleLogin(params.username, params.password));
    }

    const auth = getAuthContext(params);
    const action = normalizeAction(params.action);
    if (route === "centers") {
      if (action === "create") {
        var createdCenter = createCenter(params);
        if (createdCenter && createdCenter.error) return jsonError(createdCenter.error);
        return jsonSuccess({ success: true, data: createdCenter });
      }
      if (action === "update") {
        var updatedCenter = updateCenter(params);
        if (updatedCenter && updatedCenter.error) return jsonError(updatedCenter.error);
        return jsonSuccess({ success: true, data: updatedCenter });
      }
      if (action === "delete") {
        var deletedCenter = deleteCenter(params);
        if (deletedCenter && deletedCenter.error) return jsonError(deletedCenter.error);
        return jsonSuccess({ success: true, data: deletedCenter });
      }
      return jsonSuccess(getCenters(auth));
    }
    if (route === "specialists") {
      if (action === "create") {
        var createdSpecialist = createSpecialist(params);
        if (createdSpecialist && createdSpecialist.error) return jsonError(createdSpecialist.error);
        return jsonSuccess({ success: true, data: createdSpecialist });
      }
      if (action === "update") {
        var updatedSpecialist = updateSpecialist(params);
        if (updatedSpecialist && updatedSpecialist.error) return jsonError(updatedSpecialist.error);
        return jsonSuccess({ success: true, data: updatedSpecialist });
      }
      if (action === "delete") {
        var deletedSpecialist = deleteSpecialist(params);
        if (deletedSpecialist && deletedSpecialist.error) return jsonError(deletedSpecialist.error);
        return jsonSuccess({ success: true, data: deletedSpecialist });
      }
      return jsonSuccess(getSpecialists(auth));
    }
    if (route === "children") {
      if (action === "create") {
        var createdChild = createChild(params);
        if (createdChild && createdChild.error) return jsonError(createdChild.error);
        return jsonSuccess({ success: true, data: createdChild });
      }
      if (action === "update") {
        var updatedChild = updateChild(params);
        if (updatedChild && updatedChild.error) return jsonError(updatedChild.error);
        return jsonSuccess({ success: true, data: updatedChild });
      }
      if (action === "delete") {
        var deletedChild = deleteChild(params);
        if (deletedChild && deletedChild.error) return jsonError(deletedChild.error);
        return jsonSuccess({ success: true, data: deletedChild });
      }
      return jsonSuccess(getChildren(auth));
    }
    if (route === "vr") {
      if (action === "create") {
        var created = createVr(params);
        if (created && created.error) return jsonError(created.error);
        return jsonSuccess({ success: true, data: created });
      }
      if (action === "update") {
        var updatedVr = updateVr(params);
        if (updatedVr && updatedVr.error) return jsonError(updatedVr.error);
        return jsonSuccess({ success: true, data: updatedVr });
      }
      if (action === "delete") return jsonSuccess({ success: true, data: deleteVr(params) });
      return jsonSuccess({ success: true, data: listVr(params) });
    }
    if (route === "centervr") {
      if (action === "upsert") {
        var updated = upsertCenterVr(params);
        if (updated && updated.error) return jsonError(updated.error);
        return jsonSuccess({ success: true, data: updated });
      }
      if (action === "delete") return jsonSuccess({ success: true, data: deleteCenterVr(params) });
      return jsonSuccess({ success: true, data: listCenterVr(params) });
    }

    return jsonError("Unknown route");
  } catch (err) {
    return jsonError("Server error");
  }
}

function doOptions() {
  return withCors(ContentService.createTextOutput(""));
}

function handleLogin(username, password) {
  if (!username || !password) {
    return { error: "Missing credentials" };
  }

  const rows = getRows(SHEET_ACCOUNTS);
  const user = rows.find((row) => {
    return (
      String(getFieldValue(row, ["username"]) || "").trim() === String(username).trim() &&
      String(getFieldValue(row, ["password"]) || "").trim() === String(password).trim() &&
      normalizeActiveFlag(getFieldValue(row, ["active"])) === true
    );
  });

  if (!user) {
    return { error: "Invalid login" };
  }

  return {
    role: normalizeRole(getFieldValue(user, ["role"])),
    centerId: String(getFieldValue(user, ["centerId", "centerID"]) || "").trim(),
    specialistId: String(getFieldValue(user, ["specialistId", "specialistID"]) || "").trim()
  };
}

function getAuthContext(body) {
  return {
    role: normalizeRole(body.role),
    centerId: String(body.centerId || "").trim(),
    specialistId: String(body.specialistId || "").trim()
  };
}

function getCenters(auth) {
  const centers = getRows(SHEET_CENTERS);
  if (auth.role === "admin") return centers;
  if (auth.role === "center_admin") {
    return centers.filter((center) =>
      normalizeKey(getFieldValue(center, ["id"])) === normalizeKey(auth.centerId)
    );
  }
  if (auth.role === "specialist") {
    const specialist = getSpecialistById(auth.specialistId);
    const centerId = specialist
      ? String(getFieldValue(specialist, ["centerId", "centerID"]) || "").trim()
      : "";
    if (centerId) {
      return centers.filter((center) =>
        normalizeKey(getFieldValue(center, ["id"])) === normalizeKey(centerId)
      );
    }
    const centerName = String(getFieldValue(specialist, ["center"]) || "").trim();
    if (!centerName) return [];
    return centers.filter((center) =>
      normalizeKey(getFieldValue(center, ["name"])) === normalizeKey(centerName)
    );
  }
  return [];
}

function getSpecialists(auth) {
  const specialists = getRows(SHEET_SPECIALISTS);
  if (auth.role === "admin") return specialists;
  if (auth.role === "center_admin") {
    return specialists.filter((specialist) =>
      normalizeKey(getFieldValue(specialist, ["centerId", "centerID"])) ===
      normalizeKey(auth.centerId)
    );
  }
  if (auth.role === "specialist") {
    return specialists.filter((specialist) =>
      normalizeKey(getFieldValue(specialist, ["id"])) === normalizeKey(auth.specialistId)
    );
  }
  return [];
}

function getChildren(auth) {
  const rows = getRows(SHEET_CHILDREN).map((row) => {
    const childId = getFieldValue(row, ["childId", "ChildID", "childID", "id", "ID"]);
    const output = Object.assign({}, row);
    output.childId = normalizeChildId(childId);
    return output;
  });

  if (auth.role === "admin") return rows;
  if (auth.role === "center_admin") {
    return rows.filter((child) =>
      normalizeKey(getFieldValue(child, ["centerId", "centerID"])) === normalizeKey(auth.centerId)
    );
  }
  if (auth.role === "specialist") {
    return rows.filter((child) =>
      normalizeKey(getFieldValue(child, ["specialistId", "specialistID"])) ===
      normalizeKey(auth.specialistId)
    );
  }
  return [];
}

function buildCenterRecord(params) {
  var id = String(params.id || params.centerId || "").trim();
  if (!id) id = Utilities.getUuid();
  return {
    id: id,
    name: String(params.name || params.centerName || "").trim(),
    location: String(params.location || "").trim(),
    specialists: String(params.specialists || "").trim(),
    subscription: String(params.subscription || params.plan || "").trim(),
    contactEmail: String(params.contactEmail || params.email || "").trim(),
    contactPhone: String(params.contactPhone || params.phone || "").trim(),
    children: String(params.children || "").trim(),
    startDate: String(params.startDate || params.start_date || "").trim(),
    endDate: String(params.endDate || params.end_date || "").trim(),
    accountId: String(params.accountId || params.accountID || "").trim(),
    accountUsername: String(params.username || params.accountUsername || "").trim(),
    accountPassword: String(params.password || params.accountPassword || "").trim(),
    active: normalizeActiveFlag(params.active)
  };
}

function createCenter(params) {
  var record = buildCenterRecord(params);
  if (!record.name) return { error: "Missing center name" };
  writeRow(
    SHEET_CENTERS,
    ["id", "name", "location", "specialists", "subscription", "contactEmail", "contactPhone", "children", "startDate", "endDate", "accountId", "accountUsername", "accountPassword", "active"],
    record
  );
  return record;
}

function updateCenter(params) {
  var record = buildCenterRecord(params);
  if (!record.id) return { error: "Missing center id" };
  return upsertRow(
    SHEET_CENTERS,
    ["id", "name", "location", "specialists", "subscription", "contactEmail", "contactPhone", "children", "startDate", "endDate", "accountId", "accountUsername", "accountPassword", "active"],
    { id: record.id },
    record
  );
}

function deleteCenter(params) {
  var id = String(params.id || params.centerId || "").trim();
  if (!id) return { error: "Missing center id" };
  return deleteRow(SHEET_CENTERS, { id: id });
}

function buildSpecialistRecord(params) {
  var id = String(params.id || params.specialistId || "").trim();
  if (!id) id = Utilities.getUuid();
  return {
    id: id,
    name: String(params.name || params.fullName || "").trim(),
    center: String(params.center || "").trim(),
    centerId: String(params.centerId || params.centerID || "").trim(),
    description: String(params.description || "").trim(),
    children: String(params.children || "").trim(),
    accountId: String(params.accountId || params.accountID || "").trim(),
    accountUsername: String(params.username || params.accountUsername || "").trim(),
    accountPassword: String(params.password || params.accountPassword || "").trim(),
    active: normalizeActiveFlag(params.active)
  };
}

function createSpecialist(params) {
  var record = buildSpecialistRecord(params);
  if (!record.name) return { error: "Missing specialist name" };
  writeRow(
    SHEET_SPECIALISTS,
    ["id", "name", "center", "centerId", "description", "children", "accountId", "accountUsername", "accountPassword", "active"],
    record
  );
  return record;
}

function updateSpecialist(params) {
  var record = buildSpecialistRecord(params);
  if (!record.id) return { error: "Missing specialist id" };
  return upsertRow(
    SHEET_SPECIALISTS,
    ["id", "name", "center", "centerId", "description", "children", "accountId", "accountUsername", "accountPassword", "active"],
    { id: record.id },
    record
  );
}

function deleteSpecialist(params) {
  var id = String(params.id || params.specialistId || "").trim();
  if (!id) return { error: "Missing specialist id" };
  return deleteRow(SHEET_SPECIALISTS, { id: id });
}

function buildChildRecord(params) {
  var childId = String(params.childId || params.id || params.childID || "").trim();
  if (!childId) childId = String(new Date().getTime());
  return {
    childId: childId,
    name: String(params.name || params.fullName || params.childName || "").trim(),
    age: String(params.age || "").trim(),
    specialistId: String(params.specialistId || params.specialistID || "").trim(),
    specialist: String(params.specialist || params.specialistName || "").trim(),
    centerId: String(params.centerId || params.centerID || "").trim(),
    center: String(params.center || "").trim(),
    status: String(params.status || "").trim(),
    accuracy: String(params.accuracy || "").trim(),
    trend: String(params.trend || "").trim(),
    attempts: String(params.attempts || params.avgAttempts || "").trim(),
    operation: String(params.operation || params.primaryOperation || "").trim(),
    progress: String(params.progress || params.notes || "").trim(),
    responses: params.responses || params.formAnswers || params.answers || ""
  };
}

function createChild(params) {
  var record = buildChildRecord(params);
  if (!record.name) return { error: "Missing child name" };
  writeRow(
    SHEET_CHILDREN,
    ["childId", "name", "age", "specialistId", "specialist", "centerId", "center", "status", "accuracy", "trend", "attempts", "operation", "progress", "responses"],
    record
  );
  return record;
}

function updateChild(params) {
  var record = buildChildRecord(params);
  if (!record.childId) return { error: "Missing child id" };
  return upsertRow(
    SHEET_CHILDREN,
    ["childId", "name", "age", "specialistId", "specialist", "centerId", "center", "status", "accuracy", "trend", "attempts", "operation", "progress", "responses"],
    { childId: record.childId },
    record
  );
}

function deleteChild(params) {
  var childId = String(params.childId || params.id || params.childID || "").trim();
  if (!childId) return { error: "Missing child id" };
  return deleteRow(SHEET_CHILDREN, { childId: childId });
}

function listVr(params) {
  var centerId = String(params.centerId || "").trim();
  var vrRows = getRowsSafe(SHEET_VR);
  if (!centerId) return vrRows;
  var linkRows = listCenterVr({ centerId: centerId, activeOnly: true });
  if (!linkRows.length) return [];
  var byId = {};
  vrRows.forEach(function (row) {
    var id = String(getFieldValue(row, ["id"]) || "").trim();
    if (id) byId[normalizeKey(id)] = row;
  });
  var merged = [];
  linkRows.forEach(function (link) {
    var vrId = String(getFieldValue(link, ["vrId"]) || "").trim();
    if (!vrId) return;
    var match = byId[normalizeKey(vrId)];
    if (match) {
      var item = Object.assign({}, match);
      item.active = true;
      merged.push(item);
    }
  });
  return merged;
}

function createVr(params) {
  var name = String(params.name || "").trim();
  var duration = String(params.duration || "").trim();
  var difficulty = String(params.difficulty || "").trim();
  if (!name || !duration || !difficulty) {
    return { error: "Missing required fields" };
  }
  var id = String(params.id || "").trim();
  if (!id) id = Utilities.getUuid();
  var record = {
    id: id,
    name: name,
    description: String(params.description || "").trim(),
    duration: duration,
    difficulty: difficulty,
    video: String(params.video || "").trim(),
    image: String(params.image || "").trim()
  };
  writeRow(SHEET_VR, ["id", "name", "description", "duration", "difficulty", "video", "image"], record);
  return record;
}

function updateVr(params) {
  var id = String(params.id || "").trim();
  if (!id) return { error: "Missing VR id" };
  var record = {
    id: id,
    name: String(params.name || "").trim(),
    description: String(params.description || "").trim(),
    duration: String(params.duration || "").trim(),
    difficulty: String(params.difficulty || "").trim(),
    video: String(params.video || "").trim(),
    image: String(params.image || "").trim()
  };
  return upsertRow(
    SHEET_VR,
    ["id", "name", "description", "duration", "difficulty", "video", "image"],
    { id: id },
    record
  );
}

function deleteVr(params) {
  var id = String(params.id || params.vrId || "").trim();
  if (!id) return { error: "Missing VR id" };
  return deleteRow(SHEET_VR, { id: id });
}

function listCenterVr(params) {
  var centerId = String(params.centerId || "").trim();
  if (!centerId) return [];
  var activeOnly = String(params.activeOnly || "").toLowerCase() === "true";
  var rows = getRowsSafe(SHEET_CENTERVR);
  var filtered = rows.filter(function (row) {
    var rowCenter = String(getFieldValue(row, ["centerId", "centerID"]) || "").trim();
    if (!rowCenter) return false;
    if (normalizeKey(rowCenter) !== normalizeKey(centerId)) return false;
    if (!activeOnly) return true;
    return normalizeActiveFlag(getFieldValue(row, ["active"])) === true;
  });
  return filtered;
}

function upsertCenterVr(params) {
  var centerId = String(params.centerId || "").trim();
  var vrId = String(params.vrId || "").trim();
  var active = normalizeActiveFlag(params.active);
  if (!centerId || !vrId) {
    return { error: "Missing centerId or vrId" };
  }
  if (active === null) active = true;
  return upsertRow(
    SHEET_CENTERVR,
    ["centerId", "vrId", "active"],
    { centerId: centerId, vrId: vrId },
    { centerId: centerId, vrId: vrId, active: active }
  );
}

function deleteCenterVr(params) {
  var centerId = String(params.centerId || "").trim();
  var vrId = String(params.vrId || "").trim();
  if (!centerId || !vrId) return { error: "Missing centerId or vrId" };
  return deleteRow(SHEET_CENTERVR, { centerId: centerId, vrId: vrId });
}

function getSpecialistById(specialistId) {
  if (!specialistId) return null;
  const specialists = getRows(SHEET_SPECIALISTS);
  return specialists.find((row) =>
    normalizeKey(getFieldValue(row, ["id"])) === normalizeKey(specialistId)
  ) || null;
}

function getRowById(sheetName, idValue) {
  if (!idValue) return null;
  const rows = getRows(sheetName);
  return rows.find((row) =>
    normalizeKey(getFieldValue(row, ["id"])) === normalizeKey(idValue)
  ) || null;
}

function getRows(sheetName) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) throw new Error("Missing sheet: " + sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values.shift();
  const normalizedHeaders = headers.map((header) => normalizeHeader(header));
  return values.map((row) => {
    const obj = {};
    normalizedHeaders.forEach((header, idx) => {
      if (!header) return;
      obj[header] = row[idx];
    });
    return mapRowForSheet(sheetName, obj);
  });
}

function getRowsSafe(sheetName) {
  try {
    return getRows(sheetName);
  } catch (err) {
    return [];
  }
}

function ensureSheet(sheetName, headers) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) {
    sheet = SpreadsheetApp.getActive().insertSheet(sheetName);
  }
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  if (lastRow === 0) {
    sheet.appendRow(headers);
    return { sheet: sheet, headers: headers };
  }
  var headerRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  var normalized = headerRow.map(function (header) { return normalizeHeader(header); });
  headers.forEach(function (header) {
    var key = normalizeHeader(header);
    if (normalized.indexOf(key) === -1) {
      headerRow.push(header);
      normalized.push(key);
    }
  });
  sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
  return { sheet: sheet, headers: headerRow };
}

function writeRow(sheetName, headers, record) {
  var info = ensureSheet(sheetName, headers);
  var sheet = info.sheet;
  var headerRow = info.headers;
  var normalized = headerRow.map(function (header) { return normalizeHeader(header); });
  var row = new Array(headerRow.length);
  normalized.forEach(function (key, idx) {
    row[idx] = Object.prototype.hasOwnProperty.call(record, key) ? record[key] : "";
  });
  sheet.appendRow(row);
}

function upsertRow(sheetName, headers, matchFields, record) {
  var info = ensureSheet(sheetName, headers);
  var sheet = info.sheet;
  var headerRow = info.headers;
  var normalized = headerRow.map(function (header) { return normalizeHeader(header); });
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    writeRow(sheetName, headers, record);
    return record;
  }
  var matchRow = -1;
  for (var i = 1; i < data.length; i += 1) {
    var row = data[i];
    var isMatch = true;
    for (var field in matchFields) {
      var key = normalizeHeader(field);
      var idx = normalized.indexOf(key);
      if (idx === -1) { isMatch = false; break; }
      var cell = String(row[idx] || "").trim();
      if (normalizeKey(cell) !== normalizeKey(matchFields[field])) { isMatch = false; break; }
    }
    if (isMatch) {
      matchRow = i + 1;
      break;
    }
  }
  var outputRow = new Array(headerRow.length);
  normalized.forEach(function (key, idx) {
    outputRow[idx] = Object.prototype.hasOwnProperty.call(record, key) ? record[key] : (matchRow > -1 ? data[matchRow - 1][idx] : "");
  });
  if (matchRow > -1) {
    sheet.getRange(matchRow, 1, 1, outputRow.length).setValues([outputRow]);
  } else {
    sheet.appendRow(outputRow);
  }
  return record;
}

function deleteRow(sheetName, matchFields) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) return { error: "Missing sheet: " + sheetName };
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { deleted: false };
  var headers = data[0].map(function (header) { return normalizeHeader(header); });
  for (var i = 1; i < data.length; i += 1) {
    var row = data[i];
    var isMatch = true;
    for (var field in matchFields) {
      var key = normalizeHeader(field);
      var idx = headers.indexOf(key);
      if (idx === -1) { isMatch = false; break; }
      var cell = String(row[idx] || "").trim();
      if (normalizeKey(cell) !== normalizeKey(matchFields[field])) { isMatch = false; break; }
    }
    if (isMatch) {
      sheet.deleteRow(i + 1);
      return { deleted: true };
    }
  }
  return { deleted: false };
}

function mapRowForSheet(sheetName, row) {
  const output = Object.assign({}, row);
  if (!output.subscription) {
    if (output.plan) output.subscription = output.plan;
    if (output.subscriptionPlan) output.subscription = output.subscriptionPlan;
  }
  if (!output.contactEmail && output.email) output.contactEmail = output.email;
  if (!output.contactPhone && output.phone) output.contactPhone = output.phone;

  if (sheetName === SHEET_CHILDREN) {
    if (!output.childId && output.id) output.childId = output.id;
  }

  return output;
}

function normalizeHeader(value) {
  if (value === undefined || value === null) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  const spaced = raw
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim();
  if (!spaced) return "";
  const parts = spaced.split(/\s+/);
  let key = parts[0].toLowerCase();
  for (let i = 1; i < parts.length; i += 1) {
    const part = parts[i];
    key += part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }
  const compact = key.toLowerCase();
  const aliases = {
    childid: "childId",
    centerid: "centerId",
    specialistid: "specialistId",
    accountid: "accountId",
    accountusername: "accountUsername",
    accountpassword: "accountPassword",
    plan: "subscription",
    subscriptionplan: "subscription",
    contactemail: "contactEmail",
    contactphone: "contactPhone"
  };
  return aliases[compact] || key;
}

function normalizeRole(value) {
  const role = String(value || "").trim().toLowerCase();
  if (!role) return "";
  if (role === "admin" || role === "center_admin" || role === "specialist") return role;
  return role;
}

function normalizeActiveFlag(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const lowered = raw.toLowerCase();
  if (lowered === "true" || lowered === "1") return true;
  if (lowered === "false" || lowered === "0") return false;
  return null;
}

function getFieldValue(obj, candidates) {
  if (!obj || !candidates) return "";
  for (var i = 0; i < candidates.length; i += 1) {
    var key = candidates[i];
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return obj[key];
    }
    var normalized = normalizeKey(key);
    for (var prop in obj) {
      if (normalizeKey(prop) === normalized) return obj[prop];
    }
  }
  return "";
}

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/[\s_-]+/g, "");
}

function normalizeChildId(value) {
  return String(value || "").trim();
}

function withCors(output) {
  if (output && typeof output.setHeader === "function") {
    output.setHeader("Access-Control-Allow-Origin", "*");
    output.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    output.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  return output;
}

function jsonSuccess(data) {
  return withCors(
    ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON)
  );
}

function jsonError(message) {
  return withCors(
    ContentService.createTextOutput(JSON.stringify({ success: false, error: message }))
      .setMimeType(ContentService.MimeType.JSON)
  );
}
