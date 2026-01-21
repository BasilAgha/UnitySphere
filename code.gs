const SHEET_ACCOUNTS = "Accounts";
const SHEET_CENTERS = "Centers";
const SHEET_SPECIALISTS = "Specialists";
const SHEET_CHILDREN = "Children";
const SHEET_VR = "VR";
const SHEET_CENTER_VR = "CenterVr";
const UNITY_SESSIONS_URL = "";

/* =========================
   ENTRY POINTS
========================= */

function doPost(e) {
  try {
    const body = parseBody(e);
    const route = body.route;

    if (route === "login") {
      return jsonSuccess(handleLogin(body.username, body.password));
    }
    if (route === "addCenter") {
      return jsonSuccess(addCenter(body));
    }
    if (route === "updateCenter") {
      return jsonSuccess(updateCenter(body));
    }
    if (route === "getCenter") {
      return jsonSuccess(getCenterForEdit(body.centerId));
    }
    if (route === "deleteCenter") {
      return jsonSuccess(deleteCenter(body.centerId));
    }
    if (route === "addSpecialist") {
      return jsonSuccess(addSpecialist(body));
    }
    if (route === "updateSpecialist") {
      return jsonSuccess(updateSpecialist(body));
    }
    if (route === "deleteSpecialist") {
      return jsonSuccess(deleteSpecialist(body.specialistId));
    }
    if (route === "getAccount") {
      return jsonSuccess(getAccount(body));
    }
    if (route === "addChild") {
      return jsonSuccess(addChild(body));
    }
    if (route === "deleteChild") {
      return jsonSuccess(deleteChild(body.childId));
    }
    if (route === "addVr") {
      return jsonSuccess(addVr(body));
    }
    if (route === "updateVr") {
      return jsonSuccess(updateVr(body));
    }
    if (route === "deleteVr") {
      return jsonSuccess(deleteVr(body.vrId));
    }
    if (route === "childSessions") {
      return jsonSuccess(getChildSessions(body.childId));
    }

    return jsonError("Invalid route");
  } catch (err) {
    return jsonError("Server error");
  }
}

function doGet(e) {
  try {
    const route = e.parameter.route;

    if (route === "centers") return jsonSuccess(getRows(SHEET_CENTERS));
    if (route === "getCenter") {
      return jsonSuccess(getCenterForEdit(e.parameter.centerId));
    }
    if (route === "specialists") return jsonSuccess(getRows(SHEET_SPECIALISTS));
    if (route === "accounts") return jsonSuccess(getRows(SHEET_ACCOUNTS));
    if (route === "children") return jsonSuccess(getChildrenRows());
    if (route === "vr") return jsonSuccess(getRows(SHEET_VR));
    if (route === "centerVr") return jsonSuccess(getRows(SHEET_CENTER_VR));
    if (route === "getAccount") {
      return jsonSuccess(getAccount(e.parameter));
    }

    return jsonError("Invalid route");
  } catch (err) {
    return jsonError("Server error");
  }
}

/* =========================
   LOGIN (SAFE)
========================= */

function handleLogin(username, password) {
  if (!username || !password) {
    return { error: "Missing credentials" };
  }

  const rows = getRows(SHEET_ACCOUNTS);

  const user = rows.find(r =>
    String(r.username).trim() === String(username).trim() &&
    String(r.password).trim() === String(password).trim() &&
    String(r.active).trim().toLowerCase() === "true"
  );

  if (!user) {
    return { error: "Invalid login" };
  }

  return {
    id: String(user.id || ""),
    role: String(user.role || "").trim().toLowerCase(),
    linkedId: String(
      String(user.role || "").trim().toLowerCase() === "admin"
        ? (user.centerId || user.linkedId || "")
        : (user.specialistId || user.linkedId || "")
    )
  };
}

function addCenter(body) {
  const name = String(body.name || "").trim();
  const location = String(body.location || "").trim();
  const subscription = String(body.subscription || "").trim();
  const contactEmail = String(body.contactEmail || "").trim();
  const contactPhone = String(body.contactPhone || "").trim();
  const username = String(body.username || "").trim();
  const password = String(body.password || "").trim();
  const specialists = String(body.specialists || "").trim();
  const children = String(body.children || "").trim();
  let startDate = String(body.startDate || "").trim();
  let endDate = String(body.endDate || "").trim();

  if (!name || !location || !subscription || !username || !password) {
    return { error: "Missing required fields" };
  }

  const now = new Date();
  if (!startDate) {
    startDate = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  if (!endDate) {
    const next = new Date(now);
    next.setFullYear(next.getFullYear() + 1);
    endDate = Utilities.formatDate(next, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }

  const centerId = getNextId(SHEET_CENTERS);
  const accountId = getNextId(SHEET_ACCOUNTS);
  const centerRow = {
    id: centerId,
    accountId,
    name,
    location,
    subscription,
    startDate,
    endDate,
    contactEmail,
    contactPhone,
    specialists,
    children
  };

  appendRow(SHEET_CENTERS, centerRow);

  const accountRow = {
    id: accountId,
    username,
    password,
    role: "admin",
    centerId: centerId,
    linkedId: centerId,
    active: true
  };
  appendRow(SHEET_ACCOUNTS, accountRow);

  return { ok: true, id: centerId };
}

function updateCenter(body) {
  const centerId = String(body.centerId || body.id || "").trim();
  const name = String(body.name || "").trim();
  const location = String(body.location || "").trim();
  const subscription = String(body.subscription || "").trim();
  const contactEmail = String(body.contactEmail || "").trim();
  const contactPhone = String(body.contactPhone || "").trim();
  const specialists = String(body.specialists || "").trim();
  const children = String(body.children || "").trim();
  const startDate = String(body.startDate || "").trim();
  const endDate = String(body.endDate || "").trim();

  if (!centerId) {
    return { error: "Missing centerId" };
  }
  if (!name || !location || !subscription) {
    return { error: "Missing required fields" };
  }

  const centers = getRows(SHEET_CENTERS);
  const center = centers.find(row =>
    String(getFieldValue(row, ["id"]) || "").trim() === centerId
  );
  if (!center) {
    return { error: "Center not found" };
  }

  const oldName = String(getFieldValue(center, ["name"]) || "").trim();
  const updates = {
    name,
    location,
    subscription,
    contactEmail,
    contactPhone,
    specialists,
    children
  };
  if (startDate) updates.startDate = startDate;
  if (endDate) updates.endDate = endDate;

  const updated = updateRowsByField(SHEET_CENTERS, ["id"], centerId, updates);
  if (!updated) {
    return { error: "Center not found" };
  }

  if (oldName && name && oldName !== name) {
    updateRowsByField(SHEET_CENTER_VR, ["center"], oldName, { center: name });
    updateRowsByField(SHEET_SPECIALISTS, ["centerId", "centerID"], centerId, { center: name });
    updateRowsByField(SHEET_SPECIALISTS, ["center"], oldName, { center: name });
  }

  const accountUpdates = {};
  if (body.username) {
    accountUpdates.username = String(body.username || "").trim();
  }
  if (body.password) {
    accountUpdates.password = String(body.password || "").trim();
  }
  if (Object.keys(accountUpdates).length) {
    updateRowsByField(SHEET_ACCOUNTS, ["centerId", "centerID"], centerId, accountUpdates, row => {
      const role = String(getFieldValue(row, ["role"]) || "").trim().toLowerCase();
      const active = String(getFieldValue(row, ["active"]) || "").trim().toLowerCase();
      return role === "admin" && active === "true";
    });
  }

  return { ok: true };
}

function getCenterForEdit(centerId) {
  const resolvedId = String(centerId || "").trim();
  if (!resolvedId) {
    return { error: "Missing centerId" };
  }

  const centers = getRows(SHEET_CENTERS);
  const center = centers.find(row =>
    String(getFieldValue(row, ["id"]) || "").trim() === resolvedId
  );
  if (!center) {
    return { error: "Center not found" };
  }

  const accounts = getRows(SHEET_ACCOUNTS);
  const account = accounts.find(row => {
    const rowCenterId = String(getFieldValue(row, ["centerId", "centerID"]) || "").trim();
    if (rowCenterId !== resolvedId) return false;
    const role = String(getFieldValue(row, ["role"]) || "").trim().toLowerCase();
    const active = String(getFieldValue(row, ["active"]) || "").trim().toLowerCase();
    return role === "admin" && active === "true";
  });

  return {
    center: center,
    account: account
      ? {
          username: String(getFieldValue(account, ["username"]) || ""),
          password: String(getFieldValue(account, ["password"]) || "")
        }
      : { username: "", password: "" }
  };
}

function deleteCenter(centerId) {
  const resolvedId = String(centerId || "").trim();
  if (!resolvedId) {
    return { error: "Missing centerId" };
  }

  const centers = getRows(SHEET_CENTERS);
  const center = centers.find(row =>
    String(getFieldValue(row, ["id"]) || "").trim() === resolvedId
  );
  if (!center) {
    return { error: "Center not found" };
  }

  const centerName = String(getFieldValue(center, ["name"]) || "").trim();

  deleteRowsByField(SHEET_CHILDREN, ["centerId", "centerID"], resolvedId);

  const specialists = getRows(SHEET_SPECIALISTS);
  const specialistIds = specialists
    .filter(row => {
      const rowCenterId = String(getFieldValue(row, ["centerId", "centerID"]) || "").trim();
      const rowCenterName = String(getFieldValue(row, ["center"]) || "").trim();
      return (rowCenterId && rowCenterId === resolvedId) || (centerName && rowCenterName === centerName);
    })
    .map(row => String(getFieldValue(row, ["id"]) || "").trim())
    .filter(Boolean);

  specialistIds.forEach(id => {
    deleteRowsByField(SHEET_SPECIALISTS, ["id"], id);
    deleteRowsByField(SHEET_ACCOUNTS, ["specialistId", "specialistID"], id, row => {
      const role = String(getFieldValue(row, ["role"]) || "").trim().toLowerCase();
      return role === "specialist";
    });
  });

  deleteRowsByField(SHEET_ACCOUNTS, ["linkedId"], resolvedId, row => {
    const role = String(getFieldValue(row, ["role"]) || "").trim().toLowerCase();
    return role === "center_admin";
  });
  deleteRowsByField(SHEET_ACCOUNTS, ["centerId", "centerID"], resolvedId, row => {
    const role = String(getFieldValue(row, ["role"]) || "").trim().toLowerCase();
    return role === "admin";
  });

  if (centerName) {
    deleteRowsByField(SHEET_CENTER_VR, ["center"], centerName);
  }

  const deleted = deleteRowsByField(SHEET_CENTERS, ["id"], resolvedId);
  return deleted ? { ok: true } : { error: "Center not found" };
}

function addSpecialist(body) {
  const name = String(body.name || "").trim();
  const center = String(body.center || "").trim();
  const centerId = String(body.centerId || "").trim();
  const description = String(body.description || "").trim();
  const children = String(body.children || "").trim();
  const username = String(body.username || "").trim();
  const password = String(body.password || "").trim();

  if (!name || !description || !username || !password) {
    return { error: "Missing required fields" };
  }

  const specialistId = getNextId(SHEET_SPECIALISTS);
  const accountId = getNextId(SHEET_ACCOUNTS);
  const specialistRow = {
    id: specialistId,
    accountId,
    name,
    center,
    centerId,
    description,
    children,
  };

  appendRow(SHEET_SPECIALISTS, specialistRow);

  const accountRow = {
    id: accountId,
    username,
    password,
    role: "specialist",
    specialistId: specialistId,
    active: true
  };
  appendRow(SHEET_ACCOUNTS, accountRow);

  return { ok: true, id: specialistId };
}

function updateSpecialist(body) {
  const specialistId = String(body.specialistId || body.id || "").trim();
  const name = String(body.name || "").trim();
  const center = String(body.center || "").trim();
  const centerId = String(body.centerId || "").trim();
  const description = String(body.description || "").trim();
  const children = String(body.children || "").trim();

  if (!specialistId) {
    return { error: "Missing specialistId" };
  }
  if (!name || !description) {
    return { error: "Missing required fields" };
  }

  const specialists = getRows(SHEET_SPECIALISTS);
  const specialist = specialists.find(row =>
    String(getFieldValue(row, ["id"]) || "").trim() === specialistId
  );
  if (!specialist) {
    return { error: "Specialist not found" };
  }

  const updates = {
    name,
    center,
    centerId,
    description,
    children
  };
  const updated = updateRowsByField(SHEET_SPECIALISTS, ["id"], specialistId, updates);
  if (!updated) {
    return { error: "Specialist not found" };
  }

  const accountUpdates = {};
  if (body.username) {
    accountUpdates.username = String(body.username || "").trim();
  }
  if (body.password) {
    accountUpdates.password = String(body.password || "").trim();
  }
  if (Object.keys(accountUpdates).length) {
    updateRowsByField(SHEET_ACCOUNTS, ["specialistId", "specialistID"], specialistId, accountUpdates, row => {
      const role = String(getFieldValue(row, ["role"]) || "").trim().toLowerCase();
      return role === "specialist";
    });
  }

  return { ok: true };
}

function addChild(body) {
  const childId = String(body.childId || "").trim();
  const name = String(body.name || "").trim();
  const age = String(body.age || "").trim();
  const centerId = String(body.centerId || "").trim();
  const specialistId = String(body.specialistId || "").trim();

  if (!childId || !name || !centerId || !specialistId) {
    return { error: "Missing required fields" };
  }

  const childRow = {
    childId: childId,
    name,
    age,
    centerId,
    specialistId,
    createdAt: new Date().toISOString()
  };

  appendRow(SHEET_CHILDREN, childRow);

  return { ok: true, childId: childId };
}

function deleteSpecialist(specialistId) {
  const resolvedId = String(specialistId || "").trim();
  if (!resolvedId) {
    return { error: "Missing specialistId" };
  }

  const children = getChildrenRows();
  const hasChildren = children.some(row => {
    const rowSpecialistId = String(getFieldValue(row, ["specialistId", "specialistID"]) || "").trim();
    return rowSpecialistId && rowSpecialistId === resolvedId;
  });
  if (hasChildren) {
    return { error: "Cannot delete specialist with linked children" };
  }

  const deleted = deleteRowsByField(SHEET_SPECIALISTS, ["id"], resolvedId);
  deleteRowsByField(SHEET_ACCOUNTS, ["specialistId", "specialistID"], resolvedId, row => {
    const role = String(getFieldValue(row, ["role"]) || "").trim().toLowerCase();
    return role === "specialist";
  });

  return deleted ? { ok: true } : { error: "Specialist not found" };
}

function getAccount(body) {
  const accountId = String((body && (body.accountId || body.id)) || "").trim();
  const linkedId = String((body && body.linkedId) || "").trim();
  const specialistId = String((body && body.specialistId) || "").trim();
  const centerId = String((body && body.centerId) || "").trim();
  if (!accountId && !linkedId && !specialistId && !centerId) {
    return { error: "Missing accountId or linkedId" };
  }

  const accounts = getRows(SHEET_ACCOUNTS);
  const match = accounts.find(row => {
    if (accountId) {
      const rowId = String(getFieldValue(row, ["id"]) || "").trim();
      return rowId === accountId;
    }
    if (specialistId || linkedId) {
      const rowSpecialistId = String(getFieldValue(row, ["specialistId", "specialistID"]) || "").trim();
      if (rowSpecialistId && rowSpecialistId === (specialistId || linkedId)) return true;
    }
    if (centerId || linkedId) {
      const rowCenterId = String(getFieldValue(row, ["centerId", "centerID"]) || "").trim();
      if (rowCenterId && rowCenterId === (centerId || linkedId)) return true;
    }
    return false;
  });

  if (!match) {
    return { error: "Account not found" };
  }

  return {
    id: String(getFieldValue(match, ["id"]) || ""),
    username: String(getFieldValue(match, ["username"]) || ""),
    password: String(getFieldValue(match, ["password"]) || "")
  };
}

function deleteChild(childId) {
  const resolvedId = String(childId || "").trim();
  if (!resolvedId) {
    return { error: "Missing childId" };
  }

  const deleted = deleteRowsByField(SHEET_CHILDREN, ["childId", "ChildID", "childID"], resolvedId);
  return deleted ? { ok: true } : { error: "Child not found" };
}

function addVr(body) {
  const name = String(body.name || "").trim();
  const description = String(body.description || "").trim();
  const duration = String(body.duration || "").trim();
  const difficulty = String(body.difficulty || "").trim();
  const video = String(body.video || "").trim();
  const image = String(body.image || "").trim();
  const centersRaw = String(body.centers || "").trim();

  if (!name || !description || !duration || !difficulty) {
    return { error: "Missing required fields" };
  }

  const vrId = getNextId(SHEET_VR);
  const vrRow = {
    id: vrId,
    name,
    description,
    duration,
    difficulty,
    video,
    image
  };

  appendRow(SHEET_VR, vrRow);

  if (centersRaw) {
    centersRaw
      .split(",")
      .map(center => String(center || "").trim())
      .filter(Boolean)
      .forEach(centerName => {
        appendRow(SHEET_CENTER_VR, {
          center: centerName,
          vrId,
          vrName: name
        });
      });
  }

  return { ok: true, id: vrId };
}

function updateVr(body) {
  const vrId = String(body.vrId || body.id || "").trim();
  const name = String(body.name || "").trim();
  const description = String(body.description || "").trim();
  const duration = String(body.duration || "").trim();
  const difficulty = String(body.difficulty || "").trim();
  const video = String(body.video || "").trim();
  const centersRaw = String(body.centers || "").trim();

  if (!vrId) {
    return { error: "Missing vrId" };
  }
  if (!name || !description || !duration || !difficulty) {
    return { error: "Missing required fields" };
  }

  const updates = {
    name,
    description,
    duration,
    difficulty,
    video
  };
  if (Object.prototype.hasOwnProperty.call(body, "image")) {
    updates.image = String(body.image || "").trim();
  }

  const updated = updateRowsByField(SHEET_VR, ["id"], vrId, updates);
  if (!updated) {
    return { error: "Experience not found" };
  }

  deleteRowsByField(SHEET_CENTER_VR, ["vrId", "id"], vrId);
  if (centersRaw) {
    centersRaw
      .split(",")
      .map(center => String(center || "").trim())
      .filter(Boolean)
      .forEach(centerName => {
        appendRow(SHEET_CENTER_VR, {
          center: centerName,
          vrId,
          vrName: name
        });
      });
  }

  return { ok: true };
}

function deleteVr(vrId) {
  const resolvedId = String(vrId || "").trim();
  if (!resolvedId) {
    return { error: "Missing vrId" };
  }

  const deleted = deleteRowsByField(SHEET_VR, ["id"], resolvedId);
  deleteRowsByField(SHEET_CENTER_VR, ["vrId", "id"], resolvedId);
  return deleted ? { ok: true } : { error: "Experience not found" };
}

/* =========================
   HELPERS
========================= */

function getRows(sheetName) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values.shift();

  return values.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[String(h).trim()] = row[i];
    });
    return obj;
  });
}

function getChildrenRows() {
  const rows = getRows(SHEET_CHILDREN);
  return rows.map(row => {
    const childId = getFieldValue(row, ["childId", "ChildID", "childID"]);
    const output = Object.assign({}, row);
    delete output.id;
    delete output.ID;
    output.childId = normalizeChildId(childId);
    return output;
  });
}

function appendRow(sheetName, rowData) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) return;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (!headers || !headers.length) return;

  const normalize = value => String(value || "").toLowerCase().replace(/[\s_-]+/g, "");
  const normalizedRow = Object.keys(rowData).reduce((acc, key) => {
    acc[normalize(key)] = rowData[key];
    return acc;
  }, {});

  const aliases = {
    centername: "name",
    specialistname: "name",
    fullname: "name",
    subscriptionplan: "subscription",
    adminusername: "username",
    adminpassword: "password",
    contactemail: "contactEmail",
    contactphone: "contactPhone",
    linkedid: "linkedId",
    userid: "id",
    experienceid: "id",
    vrid: "id",
    experiencename: "name",
    vrname: "name",
    centerid: "centerId"
  };

  if (sheetName === SHEET_CENTER_VR) {
    aliases.centername = "center";
    aliases.vrid = "vrId";
    aliases.vrname = "vrName";
  }

  const row = headers.map(header => {
    const rawKey = String(header || "").trim();
    const normalizedKey = normalize(rawKey);
    const aliasKey = aliases[normalizedKey] ? normalize(aliases[normalizedKey]) : null;
    if (Object.prototype.hasOwnProperty.call(normalizedRow, normalizedKey)) {
      return normalizedRow[normalizedKey];
    }
    if (aliasKey && Object.prototype.hasOwnProperty.call(normalizedRow, aliasKey)) {
      return normalizedRow[aliasKey];
    }
    return "";
  });

  sheet.appendRow(row);
}

function deleteRowsByField(sheetName, fieldNames, matchValue, predicate) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) return false;

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return false;

  const headers = values[0];
  const headerMap = headers.reduce((acc, header, index) => {
    acc[normalizeKey(header)] = index;
    return acc;
  }, {});

  const fieldIndexes = fieldNames
    .map(name => headerMap[normalizeKey(name)])
    .filter(index => index !== undefined);
  if (!fieldIndexes.length) return false;

  const rowsToDelete = [];
  for (var i = 1; i < values.length; i += 1) {
    const row = values[i];
    const matches = fieldIndexes.some(index => String(row[index] || "").trim() === String(matchValue));
    if (!matches) continue;
    if (predicate) {
      const rowObj = headers.reduce((acc, header, idx) => {
        acc[String(header || "").trim()] = row[idx];
        return acc;
      }, {});
      if (!predicate(rowObj)) continue;
    }
    rowsToDelete.push(i + 1);
  }

  rowsToDelete.reverse().forEach(rowIndex => sheet.deleteRow(rowIndex));
  return rowsToDelete.length > 0;
}

function updateRowsByField(sheetName, fieldNames, matchValue, updates, predicate) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) return false;

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return false;

  const headers = values[0];
  const headerMap = headers.reduce((acc, header, index) => {
    acc[normalizeKey(header)] = index;
    return acc;
  }, {});

  const fieldIndexes = fieldNames
    .map(name => headerMap[normalizeKey(name)])
    .filter(index => index !== undefined);
  if (!fieldIndexes.length) return false;

  const normalizedUpdates = Object.keys(updates || {}).reduce((acc, key) => {
    acc[normalizeKey(key)] = updates[key];
    return acc;
  }, {});

  let updated = false;
  for (var i = 1; i < values.length; i += 1) {
    const row = values[i];
    const matches = fieldIndexes.some(index => String(row[index] || "").trim() === String(matchValue));
    if (!matches) continue;
    if (predicate) {
      const rowObj = headers.reduce((acc, header, idx) => {
        acc[String(header || "").trim()] = row[idx];
        return acc;
      }, {});
      if (!predicate(rowObj)) continue;
    }

    const nextRow = row.slice();
    headers.forEach((header, idx) => {
      const normalizedHeader = normalizeKey(header);
      if (Object.prototype.hasOwnProperty.call(normalizedUpdates, normalizedHeader)) {
        nextRow[idx] = normalizedUpdates[normalizedHeader];
      }
    });
    sheet.getRange(i + 1, 1, 1, nextRow.length).setValues([nextRow]);
    updated = true;
  }

  return updated;
}

function getNextId(sheetName) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) return 1;

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return 1;

  const headers = data.shift();
  const idIndex = headers.findIndex(h => String(h || "").trim().toLowerCase() === "id");
  if (idIndex === -1) return sheet.getLastRow();

  const maxId = data.reduce((maxValue, row) => {
    const value = Number(row[idIndex]);
    return Number.isFinite(value) ? Math.max(maxValue, value) : maxValue;
  }, 0);

  return maxId + 1;
}

function jsonSuccess(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseBody(e) {
  if (!e) return {};

  const params = (e.parameter && Object.keys(e.parameter).length)
    ? e.parameter
    : null;
  if (params) return params;

  if (!e.postData || !e.postData.contents) return {};

  if (e.postData.type === "application/json") {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      return {};
    }
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    return {};
  }
}

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/[\s_-]+/g, "");
}

function getFieldValue(obj, candidates) {
  if (!obj) return "";
  const map = Object.keys(obj).reduce((acc, key) => {
    acc[normalizeKey(key)] = obj[key];
    return acc;
  }, {});
  for (var i = 0; i < candidates.length; i += 1) {
    var key = normalizeKey(candidates[i]);
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      const value = map[key];
      if (value === 0 || value === false) return value;
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return value;
      }
    }
  }
  return "";
}

function normalizeChildId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const num = Number(raw);
  return Number.isFinite(num) ? num : raw;
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function parseSessionDate(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") return new Date(value);
  const raw = String(value).trim();
  if (!raw) return null;
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) return new Date(numeric);
  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function getChildSessions(childId) {
  const resolvedChildId = normalizeChildId(childId);
  if (!resolvedChildId && resolvedChildId !== 0) {
    return { error: "Missing childId" };
  }

  const zeroMetrics = {
    totalSessions: 0,
    averageDuration: 0,
    accuracyPercentage: 0,
    averageAttempts: 0,
    completionRate: 0,
    trend: []
  };

  if (!UNITY_SESSIONS_URL) {
    return { childId: resolvedChildId, metrics: zeroMetrics, sessions: [] };
  }

  let rawSessions = [];
  try {
    const response = UrlFetchApp.fetch(UNITY_SESSIONS_URL, { muteHttpExceptions: true });
    const content = response.getContentText();
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      rawSessions = parsed;
    } else if (parsed && Array.isArray(parsed.sessions)) {
      rawSessions = parsed.sessions;
    } else if (parsed && Array.isArray(parsed.data)) {
      rawSessions = parsed.data;
    }
  } catch (err) {
    return { childId: resolvedChildId, metrics: zeroMetrics, sessions: [] };
  }

  const filteredSessions = rawSessions.filter(session => {
    const sessionChildId = normalizeChildId(getFieldValue(session, ["childId", "ChildID", "childID"]));
    return String(sessionChildId) === String(resolvedChildId);
  });

  if (!filteredSessions.length) {
    return { childId: resolvedChildId, metrics: zeroMetrics, sessions: [] };
  }

  let durationTotal = 0;
  let accuracyTotal = 0;
  let accuracyCount = 0;
  let attemptsTotal = 0;
  let attemptsCount = 0;
  let completionValues = [];
  let completedCount = 0;

  const trend = filteredSessions.map(session => {
    const durationValue = toNumber(getFieldValue(session, [
      "duration",
      "durationSeconds",
      "durationSec",
      "sessionDuration",
      "sessionLength"
    ]));
    durationTotal += durationValue;

    const accuracyValueRaw = getFieldValue(session, [
      "accuracy",
      "accuracyPercent",
      "accuracyPercentage"
    ]);
    if (accuracyValueRaw !== "") {
      let accuracyValue = toNumber(accuracyValueRaw);
      if (accuracyValue > 0 && accuracyValue <= 1) accuracyValue *= 100;
      accuracyTotal += accuracyValue;
      accuracyCount += 1;
    }

    const attemptsValueRaw = getFieldValue(session, [
      "attempts",
      "attemptCount",
      "avgAttempts"
    ]);
    if (attemptsValueRaw !== "") {
      const attemptsValue = toNumber(attemptsValueRaw);
      attemptsTotal += attemptsValue;
      attemptsCount += 1;
    }

    const completionRaw = getFieldValue(session, [
      "completion",
      "completionRate",
      "completed",
      "isComplete"
    ]);
    if (completionRaw !== "") {
      if (completionRaw === true || String(completionRaw).toLowerCase() === "true") {
        completedCount += 1;
      } else {
        let completionValue = toNumber(completionRaw);
        if (completionValue > 0 && completionValue <= 1) completionValue *= 100;
        if (completionValue) completionValues.push(completionValue);
      }
    }

    const dateValue = getFieldValue(session, [
      "date",
      "sessionDate",
      "timestamp",
      "createdAt"
    ]);
    const dateParsed = parseSessionDate(dateValue);
    return {
      date: dateParsed ? dateParsed.toISOString() : "",
      duration: durationValue,
      accuracy: accuracyValueRaw !== "" ? toNumber(accuracyValueRaw) : 0,
      attempts: attemptsValueRaw !== "" ? toNumber(attemptsValueRaw) : 0,
      completion: completionRaw !== "" ? completionRaw : ""
    };
  });

  trend.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const totalSessions = filteredSessions.length;
  const averageDuration = totalSessions ? durationTotal / totalSessions : 0;
  const accuracyPercentage = accuracyCount ? accuracyTotal / accuracyCount : 0;
  const averageAttempts = attemptsCount ? attemptsTotal / attemptsCount : 0;
  const completionRate = completionValues.length
    ? completionValues.reduce((sum, value) => sum + value, 0) / completionValues.length
    : totalSessions
      ? (completedCount / totalSessions) * 100
      : 0;

  return {
    childId: resolvedChildId,
    metrics: {
      totalSessions: totalSessions,
      averageDuration: averageDuration,
      accuracyPercentage: accuracyPercentage,
      averageAttempts: averageAttempts,
      completionRate: completionRate,
      trend: trend
    },
    sessions: filteredSessions
  };
}
