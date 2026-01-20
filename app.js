const API_URL =
  "https://script.google.com/macros/s/AKfycbxEa5cGM1VmJ9FSrm0MG0frn1Nr2POy2RNmL_pba-tKAWaHy-tq-_tafvliq-qYW7WQfw/exec";
const AUTH_STORAGE_KEY = "unitysphereUser";
const LOGIN_PAGE = "login.html";
const getById = (id) => (typeof document === "undefined" ? null : document.getElementById(id));
const normalizeKey = (value) => String(value || "").toLowerCase().replace(/[\s_-]+/g, "");
const getField = (obj, candidates = []) => {
  if (!obj) return "";
  const map = Object.keys(obj).reduce((acc, key) => {
    acc[normalizeKey(key)] = obj[key];
    return acc;
  }, {});
  for (const candidate of candidates) {
    const key = normalizeKey(candidate);
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      const value = map[key];
      if (value === 0 || value === false) return String(value);
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value).trim();
      }
    }
  }
  return "";
};

const loadingState = {
  count: 0,
  overlay: null,
  label: null
};

const ensureLoadingOverlay = () => {
  if (loadingState.overlay) return loadingState.overlay;
  const overlay = document.createElement("div");
  overlay.className = "loading-overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="loading-card" role="status" aria-live="polite">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading...</div>
    </div>
  `;
  document.body.appendChild(overlay);
  loadingState.overlay = overlay;
  loadingState.label = overlay.querySelector(".loading-text");
  return overlay;
};

const startLoading = (message) => {
  if (typeof document === "undefined") return;
  ensureLoadingOverlay();
  loadingState.count += 1;
  if (loadingState.label && message) loadingState.label.textContent = message;
  if (loadingState.overlay) loadingState.overlay.classList.add("is-visible");
};

const stopLoading = () => {
  if (typeof document === "undefined") return;
  loadingState.count = Math.max(loadingState.count - 1, 0);
  if (loadingState.count === 0 && loadingState.overlay) {
    loadingState.overlay.classList.remove("is-visible");
  }
};

const getCurrentUser = () => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const setCurrentUser = (user) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

const isLoginPage = () => {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname || "";
  return path.endsWith(`/${LOGIN_PAGE}`) || path.endsWith(LOGIN_PAGE);
};

const enforceAuth = () => {
  if (isLoginPage()) return;
  if (!getCurrentUser()) {
    window.location.href = LOGIN_PAGE;
  }
};

const apiPost = (payload = {}, message = "Loading...") => {
  startLoading(message);
  return fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams(payload)
  }).finally(stopLoading);
};

const apiGet = (route) => fetch(`${API_URL}?route=${encodeURIComponent(route)}`);

const fetchRoute = async (route) => {
  startLoading("Loading...");
  try {
    const response = await apiGet(route);
    const payload = await response.json();
    if (!response.ok || payload?.error) {
      throw new Error(`Failed to load ${route}`);
    }
    return Array.isArray(payload) ? payload : [];
  } finally {
    stopLoading();
  }
};

const dataCache = {
  centers: null,
  specialists: null,
  centerVr: null
};

const getCachedRoute = async (key, route) => {
  if (Array.isArray(dataCache[key])) return dataCache[key];
  const items = await fetchRoute(route);
  dataCache[key] = items;
  return items;
};

const getUserContext = () => {
  const user = getCurrentUser() || {};
  return {
    role: String(user.role || "").trim().toLowerCase(),
    linkedId: String(user.linkedId || "").trim()
  };
};

const getCenterIdFromName = (centers, centerName) => {
  if (!Array.isArray(centers)) return "";
  const name = String(centerName || "").trim();
  if (!name) return "";
  const match = centers.find(
    (center) => normalizeKey(getField(center, ["name"])) === normalizeKey(name)
  );
  return getField(match, ["id"]);
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("File read failed"));
    reader.readAsDataURL(file);
  });

let refreshCenters = null;
let refreshSpecialists = null;
let refreshVr = null;
let refreshChildren = null;
let updateOverviewCounts = null;

const initLogin = () => {
  const form = getById("login-form");
  if (!form) return;

  if (getCurrentUser()) {
    window.location.href = "index.html";
    return;
  }

  const errorEl = getById("login-error");
  const setError = (message) => {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.style.visibility = message ? "visible" : "hidden";
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const username = String(data.get("username") || "").trim();
    const password = String(data.get("password") || "").trim();

    if (!username || !password) {
      setError("Enter your username and password.");
      return;
    }

    setError("");
    try {
      const response = await apiPost({ route: "login", username, password }, "Signing in...");
      if (!response.ok) {
        setError("Login failed. Please try again.");
        return;
      }
      const payload = await response.json();
      if (payload?.error) {
        setError("Invalid login. Please try again.");
        return;
      }

      const resolvedUser = payload?.user || payload;
      if (!resolvedUser) {
        setError("Login failed. Please try again.");
        return;
      }

      setCurrentUser(resolvedUser);
      window.location.href = "index.html";
    } catch (err) {
      console.error("Login failed.", err);
      setError("Login failed. Please try again.");
    }
  });
};

const setText = (id, value) => {
  const el = getById(id);
  if (el) el.textContent = value;
};

const setPlaceholderMetrics = () => {
  setText("metric-completion", "No data");
  setText("metric-duration", "No data");
  setText("metric-velocity", "No data");
  setText("metric-accuracy", "No data");
  setText("metric-peak", "No data");

  const donutValue = document.querySelector(".donut-value");
  if (donutValue) {
    donutValue.style.strokeDasharray = "0 999";
  }

  const donut = document.querySelector(".donut");
  if (donut) donut.classList.add("is-animated");
};

const renderEmptyListItem = (listEl, message) => {
  if (!listEl) return;
  listEl.innerHTML = "";
  const item = document.createElement("li");
  item.className = "child-item";
  item.innerHTML = `
    <div class="avatar">?</div>
    <div>
      <div class="child-name">${message}</div>
      <div class="muted">No data</div>
    </div>
  `;
  listEl.appendChild(item);
};

const renderEmptyGridCard = (gridEl, className, title, bodyLines) => {
  if (!gridEl) return;
  gridEl.innerHTML = "";
  const card = document.createElement("div");
  card.className = `card ${className}`;
  card.innerHTML = `
    <div class="glow-line"></div>
    <h3>${title}</h3>
    <div class="meta">
      ${bodyLines.map((line) => `<span>${line}</span>`).join("")}
    </div>
  `;
  gridEl.appendChild(card);
};

const renderEmptyProgress = () => {
  const list = getById("progress-list");
  if (!list) return;
  list.innerHTML = `
    <div class="progress-item is-animated">
      <div class="meta">
        <span>No data</span>
        <strong>0%</strong>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" data-value="0"></div>
      </div>
    </div>
  `;
};

const renderEmptyChildProfile = () => {
  setText("child-name", "No child selected");
  setText("child-id", "");
  setText("child-status", "");
  const status = getById("child-status");
  if (status) status.dataset.status = "";
  setText("child-meta", "No profile data available.");
  setText("child-accuracy", "0%");
  setText("child-sessions", "0");
  setText("child-duration", "0 sec");
  setText("child-trend", "No data");
  setText("child-attempts", "0.0");
  setText("child-completion", "0%");
  setText("child-operation", "Unspecified");
  setText("child-progress", "No session data available.");

  const responses = getById("child-responses");
  if (responses) {
    responses.innerHTML = `<div class="muted">No session data available.</div>`;
  }
};

const clearChartCanvas = () => {
  const canvas = getById("sessionChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const width = canvas.clientWidth || canvas.width;
  const height = canvas.height || 180;
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  canvas.classList.add("is-animated");
};

const initTabs = () => {
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".tab-content");
  if (!tabs.length) return;
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => item.classList.remove("active"));
      panels.forEach((panel) => panel.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;
      const panel = document.querySelector(`[data-tab-panel="${target}"]`);
      if (panel) panel.classList.add("active");
    });
  });
};

const initModal = ({ buttonText, modalId, formId }) => {
  const trigger = Array.from(document.querySelectorAll(".btn.primary")).find(
    (button) => button.textContent.trim() === buttonText
  );
  const modal = getById(modalId);
  const form = formId ? getById(formId) : null;
  if (!trigger || !modal) return;

  const open = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    const firstField = modal.querySelector("input, select, textarea, button");
    if (firstField) firstField.focus();
  };

  const close = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    if (form) form.reset();
  };

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    open();
  });

  modal.querySelectorAll("[data-modal-close]").forEach((el) => {
    el.addEventListener("click", close);
  });

  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  if (form && form.dataset.autoClose !== "false") {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      close();
    });
  }
};

const closeModalById = (modalId, formId) => {
  const modal = getById(modalId);
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  if (formId) {
    const form = getById(formId);
    if (form) form.reset();
  }
};

const initAddCenterForm = () => {
  const form = getById("add-center-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
      const payload = {
        route: "addCenter",
        name: String(data.get("name") || "").trim(),
        location: String(data.get("location") || "").trim(),
        specialists: String(data.get("specialists") || "").trim(),
        subscription: String(data.get("subscription") || "").trim(),
        contactEmail: String(data.get("contactEmail") || "").trim(),
        contactPhone: String(data.get("contactPhone") || "").trim(),
        children: String(data.get("children") || "").trim(),
        username: String(data.get("username") || "").trim(),
        password: String(data.get("password") || "").trim()
      };

    if (!payload.name || !payload.location || !payload.subscription || !payload.username || !payload.password) {
      alert("Please fill the required fields.");
      return;
    }

    try {
      const response = await apiPost(payload, "Saving center...");
      const result = await response.json();
      if (!response.ok || result?.error) {
        alert("Could not add center. Please try again.");
        return;
      }
      closeModalById("add-center-modal", "add-center-form");
      if (typeof refreshCenters === "function") refreshCenters();
    } catch (err) {
      console.error("Add center failed.", err);
      alert("Could not add center. Please try again.");
    }
  });
};

const initAddSpecialistForm = () => {
  const form = getById("add-specialist-form");
  if (!form) return;
  const { role, linkedId } = getUserContext();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (role !== "center_admin") {
      alert("Only center admins can add specialists.");
      return;
    }
    const data = new FormData(form);
    const payload = {
      route: "addSpecialist",
      name: String(data.get("name") || "").trim(),
      center: String(data.get("center") || "").trim(),
      centerId: linkedId,
      description: String(data.get("description") || "").trim(),
      children: String(data.get("children") || "").trim(),
      username: String(data.get("username") || "").trim(),
      password: String(data.get("password") || "").trim()
    };

    if (!payload.name || !payload.description || !payload.username || !payload.password || !payload.centerId) {
      alert("Please fill the required fields.");
      return;
    }

    try {
      const response = await apiPost(payload, "Saving specialist...");
      const result = await response.json();
      if (!response.ok || result?.error) {
        alert("Could not add specialist. Please try again.");
        return;
      }
      closeModalById("add-specialist-modal", "add-specialist-form");
      if (typeof refreshSpecialists === "function") refreshSpecialists();
      if (typeof updateOverviewCounts === "function") updateOverviewCounts();
    } catch (err) {
      console.error("Add specialist failed.", err);
      alert("Could not add specialist. Please try again.");
    }
  });
};

const initSpecialistCenterDropdown = () => {
  const select = getById("specialist-center");
  if (!select) return;
  const { role, linkedId } = getUserContext();

  const renderOptions = (centers = [], forcedCenter = "") => {
    const options = [];
    if (role === "center_admin" && forcedCenter) {
      options.push(`<option value="${forcedCenter}">${forcedCenter}</option>`);
    } else {
      options.push(`<option value="">No center assigned</option>`);
      centers.forEach((center) => {
        const name = getField(center, ["name"]);
        if (!name) return;
        options.push(`<option value="${name}">${name}</option>`);
      });
    }
    select.innerHTML = options.join("");
    if (forcedCenter) select.value = forcedCenter;
  };

  const loadCenters = async () => {
    try {
      const centers = await fetchRoute("centers");
      dataCache.centers = centers;
      let forcedCenter = "";
      if (role === "center_admin" && linkedId) {
        const match = centers.find(
          (center) => normalizeKey(getField(center, ["id"])) === normalizeKey(linkedId)
        );
        forcedCenter = getField(match, ["name"]);
      }
      renderOptions(centers, forcedCenter);
    } catch (err) {
      console.error("Load centers for specialists failed.", err);
      renderOptions([]);
    }
  };

  renderOptions([]);
  loadCenters();
};

const initChildSpecialistSelect = () => {
  const select = getById("child-specialist-select");
  if (!select) return;
  const { role, linkedId } = getUserContext();

  const renderOptions = (specialists = [], forcedId = "") => {
    const options = [];
    if (role === "specialist" && forcedId) {
      const name = getField(
        specialists.find((item) => normalizeKey(getField(item, ["id"])) === normalizeKey(forcedId)),
        ["name"]
      );
      options.push(`<option value="${forcedId}">${name || "Assigned specialist"}</option>`);
      select.innerHTML = options.join("");
      select.value = forcedId;
      select.disabled = true;
      return;
    }

    options.push(`<option value="">Select specialist</option>`);
    specialists.forEach((specialist) => {
      const id = getField(specialist, ["id"]);
      const name = getField(specialist, ["name"]);
      if (!id || !name) return;
      options.push(`<option value="${id}">${name}</option>`);
    });
    select.innerHTML = options.join("");
    select.disabled = false;
  };

  const loadSpecialists = async () => {
    try {
      let specialists = await fetchRoute("specialists");
      dataCache.specialists = specialists;
      if (role === "center_admin" && linkedId) {
        const centers = await getCachedRoute("centers", "centers");
        specialists = specialists.filter((specialist) => {
          const specialistCenterId = getField(specialist, ["centerId", "centerID"]);
          if (specialistCenterId) {
            return normalizeKey(specialistCenterId) === normalizeKey(linkedId);
          }
          const resolvedId = getCenterIdFromName(centers, getField(specialist, ["center"]));
          return resolvedId && normalizeKey(resolvedId) === normalizeKey(linkedId);
        });
      }
      renderOptions(specialists, role === "specialist" ? linkedId : "");
    } catch (err) {
      console.error("Load specialists for children failed.", err);
      renderOptions([], role === "specialist" ? linkedId : "");
    }
  };

  renderOptions([]);
  loadSpecialists();
};

const initAddChildForm = () => {
  const form = getById("add-child-form");
  if (!form) return;
  const { role, linkedId } = getUserContext();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const data = new FormData(form);
      const childId = String(data.get("childId") || "").trim();
      const name = String(data.get("name") || "").trim();
      const age = String(data.get("age") || "").trim();
      let specialistId = String(data.get("specialistId") || "").trim();
      let centerId = "";

      if (role === "specialist") {
        specialistId = linkedId;
      }

      if (role === "center_admin") {
        centerId = linkedId;
      } else {
        const specialists = await getCachedRoute("specialists", "specialists");
        const specialist = specialists.find(
          (item) => normalizeKey(getField(item, ["id"])) === normalizeKey(specialistId)
        );
        const specialistCenterId = getField(specialist, ["centerId", "centerID"]);
        if (specialistCenterId) {
          centerId = specialistCenterId;
        } else {
          const centers = await getCachedRoute("centers", "centers");
          centerId = getCenterIdFromName(centers, getField(specialist, ["center"]));
        }
      }

      if (!childId || !name || !specialistId || !centerId) {
        alert("Please fill the required fields.");
        return;
      }

      const response = await apiPost({
        route: "addChild",
        childId,
        name,
        age,
        centerId,
        specialistId
      }, "Saving child...");
      const result = await response.json();
      if (!response.ok || result?.error) {
        alert(result?.error || "Could not add child. Please try again.");
        return;
      }
      closeModalById("add-child-modal", "add-child-form");
      if (typeof refreshChildren === "function") refreshChildren();
      if (typeof refreshSpecialists === "function") refreshSpecialists();
      if (typeof updateOverviewCounts === "function") updateOverviewCounts();
    } catch (err) {
      console.error("Add child failed.", err);
      alert("Could not add child. Please try again.");
    }
  });
};

const initAddExperienceForm = () => {
  const form = getById("add-experience-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const centersSelected = Array.from(
      form.querySelectorAll('input[name="centers"]:checked')
    ).map((input) => input.value);
    const imageUrl = String(data.get("image") || "").trim();
    const fileInput = form.querySelector('input[name="imageFile"]');
    let image = imageUrl;
    if (fileInput && fileInput.files && fileInput.files[0]) {
      try {
        image = await readFileAsDataUrl(fileInput.files[0]);
      } catch (err) {
        console.error("Image upload failed.", err);
        alert("Could not read the cover image. Please try a different file.");
        return;
      }
    }
    const payload = {
      route: "addVr",
      name: String(data.get("name") || "").trim(),
      description: String(data.get("description") || "").trim(),
      duration: String(data.get("duration") || "").trim(),
      difficulty: String(data.get("difficulty") || "").trim(),
      video: String(data.get("video") || "").trim(),
      image,
      centers: centersSelected.join(", ")
    };

    if (!payload.name || !payload.description || !payload.duration || !payload.difficulty) {
      alert("Please fill the required fields.");
      return;
    }

    try {
      const response = await apiPost(payload, "Saving experience...");
      const result = await response.json();
      if (!response.ok || result?.error) {
        alert("Could not add experience. Please try again.");
        return;
      }
      closeModalById("add-experience-modal", "add-experience-form");
      if (typeof refreshVr === "function") refreshVr();
    } catch (err) {
      console.error("Add experience failed.", err);
      alert("Could not add experience. Please try again.");
    }
  });
};

const initExperienceCentersChecklist = () => {
  const list = getById("experience-centers-list");
  if (!list) return;

  const renderCenters = (centers = []) => {
    list.innerHTML = "";
    if (!Array.isArray(centers) || centers.length === 0) {
      const empty = document.createElement("div");
      empty.className = "checkbox-empty";
      empty.textContent = "No centers available.";
      list.appendChild(empty);
      return;
    }

    centers.forEach((center, index) => {
      const name = String(center.name || "").trim();
      if (!name) return;
      const label = document.createElement("label");
      label.className = "checkbox-item";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "centers";
      input.value = name;
      input.id = `experience-center-${index}`;
      const text = document.createElement("span");
      text.textContent = name;
      label.appendChild(input);
      label.appendChild(text);
      list.appendChild(label);
    });
  };

  const loadCenters = async () => {
    try {
      const response = await apiGet("centers");
      const payload = await response.json();
      if (!response.ok || payload?.error) {
        throw new Error("Failed to load centers");
      }
      renderCenters(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error("Load centers for experiences failed.", err);
      renderCenters([]);
    }
  };

  renderCenters([]);
  loadCenters();
};

const renderCenters = (centers = []) => {
  const grid = getById("centers-grid");
  if (!grid) return;
  if (!Array.isArray(centers) || centers.length === 0) {
    renderEmptyGridCard(grid, "center-card", "No centers yet", [
      "Add centers to populate this list."
    ]);
    return;
  }

  grid.innerHTML = "";
  centers.forEach((center, index) => {
    const name = String(center.name || "").trim() || "Unnamed center";
    const location = String(center.location || "").trim() || "No location";
    const plan = String(center.subscription || "").trim() || "No plan";
    const email = String(center.contactEmail || "").trim() || "No email";
    const phone = String(center.contactPhone || "").trim() || "No phone";

    const card = document.createElement("div");
    card.className = "card center-card";
    card.style.setProperty("--delay", `${index * 0.05}s`);
    card.innerHTML = `
      <div class="glow-line"></div>
      <h3>${name}</h3>
      <div class="meta">
        <span>Location: ${location}</span>
        <span>Plan: ${plan}</span>
        <span>Email: ${email}</span>
        <span>Phone: ${phone}</span>
      </div>
    `;
    grid.appendChild(card);
  });
};

const renderSpecialists = (specialists = []) => {
  const grid = getById("specialists-grid");
  if (!grid) return;
  const { role } = getUserContext();
  if (!Array.isArray(specialists) || specialists.length === 0) {
    renderEmptyGridCard(grid, "specialist-card", "No specialists yet", [
      "Add specialists to populate this list."
    ]);
    return;
  }

  grid.innerHTML = "";
  specialists.forEach((specialist, index) => {
    const name = String(specialist.name || "").trim() || "Unnamed specialist";
    const center = String(specialist.center || "").trim() || "No center";
    const description = String(specialist.description || "").trim() || "No description";
    const children = String(specialist.children || "").trim() || "0";

    const card = document.createElement("div");
    card.className = "card specialist-card";
    card.style.setProperty("--delay", `${index * 0.05}s`);
    card.innerHTML = `
      <div class="glow-line"></div>
      <h3>${name}</h3>
      <div class="meta">
        <span>Center: ${center}</span>
        <span>Children: ${children}</span>
        <span>${description}</span>
      </div>
      ${role === "center_admin" ? `<button class="btn ghost small" data-specialist-id="${getField(specialist, ["id"])}">Delete</button>` : ""}
    `;
    grid.appendChild(card);
  });

  if (role === "center_admin") {
    grid.querySelectorAll("[data-specialist-id]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        const specialistId = button.getAttribute("data-specialist-id");
        if (!specialistId) return;
        if (!confirm("Delete this specialist?")) return;
        try {
          const response = await apiPost(
            { route: "deleteSpecialist", specialistId },
            "Deleting specialist..."
          );
          const result = await response.json();
          if (!response.ok || result?.error) {
            alert(result?.error || "Could not delete specialist.");
            return;
          }
          if (typeof refreshSpecialists === "function") refreshSpecialists();
          if (typeof refreshChildren === "function") refreshChildren();
          if (typeof updateOverviewCounts === "function") updateOverviewCounts();
        } catch (err) {
          console.error("Delete specialist failed.", err);
          alert("Could not delete specialist.");
        }
      });
    });
  }
};

const renderVr = (experiences = []) => {
  const grid = getById("vr-grid");
  if (!grid) return;
  if (!Array.isArray(experiences) || experiences.length === 0) {
    renderEmptyGridCard(grid, "vr-card", "No experiences yet", [
      "Add VR experiences to populate this list."
    ]);
    return;
  }

  grid.innerHTML = "";
  experiences.forEach((experience, index) => {
    const name = String(experience.name || "").trim() || "Unnamed experience";
    const description = String(experience.description || "").trim() || "No description";
    const duration = String(experience.duration || "").trim() || "No duration";
    const difficulty = String(experience.difficulty || "").trim() || "No difficulty";
    const image = String(experience.image || "").trim();
    const video = String(experience.video || "").trim();

    const card = document.createElement("div");
    card.className = "card vr-card";
    card.style.setProperty("--delay", `${index * 0.05}s`);
    card.innerHTML = `
      <div class="vr-media">
        ${image ? `<img src="${image}" alt="${name}">` : ""}
        <div class="overlay"></div>
      </div>
      <div>
        <h3>${name}</h3>
        <p class="muted">${description}</p>
      </div>
      <div class="vr-meta">
        <span>${duration} • ${difficulty}</span>
        ${video ? `<a href="${video}" target="_blank" rel="noreferrer">Preview</a>` : "<span>Preview</span>"}
      </div>
    `;
    grid.appendChild(card);
  });
};

const renderCenterFilter = (centers = []) => {
  const select = getById("customer-filter");
  if (!select) return;
  select.innerHTML = `<option value="all">All centers</option>`;
  centers.forEach((center) => {
    const name = String(center.name || "").trim();
    if (!name) return;
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
};

const initCenters = () => {
  const grid = getById("centers-grid");
  if (!grid) return;
  const { role, linkedId } = getUserContext();

  const select = getById("customer-filter");
  let centersCache = [];

  const loadCenters = async () => {
    try {
      centersCache = await fetchRoute("centers");
      dataCache.centers = centersCache;
      let filteredCenters = centersCache;

      if (role === "center_admin" && linkedId) {
        filteredCenters = centersCache.filter(
          (center) => normalizeKey(getField(center, ["id"])) === normalizeKey(linkedId)
        );
      } else if (role === "specialist" && linkedId) {
        const specialists = await getCachedRoute("specialists", "specialists");
        const specialist = specialists.find(
          (item) => normalizeKey(getField(item, ["id"])) === normalizeKey(linkedId)
        );
        const specialistCenterId = getField(specialist, ["centerId", "centerID"]);
        if (specialistCenterId) {
          filteredCenters = centersCache.filter(
            (center) => normalizeKey(getField(center, ["id"])) === normalizeKey(specialistCenterId)
          );
        } else {
          const centerName = getField(specialist, ["center"]);
          filteredCenters = centerName
            ? centersCache.filter(
                (center) => normalizeKey(getField(center, ["name"])) === normalizeKey(centerName)
              )
            : [];
        }
      }

      centersCache = filteredCenters;
      renderCenters(centersCache);
      renderCenterFilter(centersCache);
    } catch (err) {
      console.error("Load centers failed.", err);
      renderCenters([]);
    }
  };

  refreshCenters = loadCenters;
  loadCenters();

  if (select) {
    select.addEventListener("change", () => {
      const value = select.value;
      if (value === "all") {
        renderCenters(centersCache);
        return;
      }
      const filtered = centersCache.filter(
        (center) => String(center.name || "").trim() === value
      );
      renderCenters(filtered);
    });
  }
};

const initSpecialists = () => {
  const grid = getById("specialists-grid");
  if (!grid) return;
  const { role, linkedId } = getUserContext();

  const select = getById("specialist-filter");
  let specialistsCache = [];

  const sortSpecialists = (items, order) => {
    const sorted = [...items].sort((a, b) => {
      const nameA = String(a.name || "").toLowerCase();
      const nameB = String(b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
    return order === "za" ? sorted.reverse() : sorted;
  };

  const loadSpecialists = async () => {
    try {
      specialistsCache = await fetchRoute("specialists");
      dataCache.specialists = specialistsCache;
      let filteredSpecialists = specialistsCache;

      if (role === "center_admin" && linkedId) {
        const centers = await getCachedRoute("centers", "centers");
        filteredSpecialists = specialistsCache.filter((specialist) => {
          const specialistCenterId = getField(specialist, ["centerId", "centerID"]);
          if (specialistCenterId) {
            return normalizeKey(specialistCenterId) === normalizeKey(linkedId);
          }
          const specialistCenterName = getField(specialist, ["center"]);
          const resolvedId = getCenterIdFromName(centers, specialistCenterName);
          return resolvedId && normalizeKey(resolvedId) === normalizeKey(linkedId);
        });
      } else if (role === "specialist" && linkedId) {
        filteredSpecialists = specialistsCache.filter(
          (specialist) => normalizeKey(getField(specialist, ["id"])) === normalizeKey(linkedId)
        );
      }

      const order = select ? select.value : "az";
      specialistsCache = filteredSpecialists;
      renderSpecialists(sortSpecialists(specialistsCache, order));
    } catch (err) {
      console.error("Load specialists failed.", err);
      renderSpecialists([]);
    }
  };

  refreshSpecialists = loadSpecialists;
  loadSpecialists();

  if (select) {
    select.addEventListener("change", () => {
      const order = select.value;
      renderSpecialists(sortSpecialists(specialistsCache, order));
    });
  }
};

const initVr = () => {
  const grid = getById("vr-grid");
  if (!grid) return;
  const { role, linkedId } = getUserContext();

  const loadVr = async () => {
    try {
      let experiences = await fetchRoute("vr");

      if ((role === "center_admin" || role === "specialist") && linkedId) {
        const centers = await getCachedRoute("centers", "centers");
        let centerName = "";
        if (role === "center_admin") {
          const center = centers.find(
            (item) => normalizeKey(getField(item, ["id"])) === normalizeKey(linkedId)
          );
          centerName = getField(center, ["name"]);
        } else {
          const specialists = await getCachedRoute("specialists", "specialists");
          const specialist = specialists.find(
            (item) => normalizeKey(getField(item, ["id"])) === normalizeKey(linkedId)
          );
          const specialistCenterId = getField(specialist, ["centerId", "centerID"]);
          if (specialistCenterId) {
            const center = centers.find(
              (item) =>
                normalizeKey(getField(item, ["id"])) === normalizeKey(specialistCenterId)
            );
            centerName = getField(center, ["name"]);
          } else {
            centerName = getField(specialist, ["center"]);
          }
        }

        const centerVr = await getCachedRoute("centerVr", "centerVr");
        dataCache.centerVr = centerVr;
        const matches = centerVr.filter(
          (item) => normalizeKey(getField(item, ["center"])) === normalizeKey(centerName)
        );
        const allowedIds = new Set(
          matches.map((item) => normalizeKey(getField(item, ["vrId", "id"]))).filter(Boolean)
        );
        const allowedNames = new Set(
          matches.map((item) => normalizeKey(getField(item, ["vrName", "name"]))).filter(Boolean)
        );

        experiences = experiences.filter((experience) => {
          const id = normalizeKey(getField(experience, ["id"]));
          const name = normalizeKey(getField(experience, ["name"]));
          return (id && allowedIds.has(id)) || (name && allowedNames.has(name));
        });
      }

      renderVr(experiences);
    } catch (err) {
      console.error("Load experiences failed.", err);
      renderVr([]);
    }
  };

  refreshVr = loadVr;
  loadVr();
};

const initModals = () => {
  initModal({ buttonText: "Add Center", modalId: "add-center-modal", formId: "add-center-form" });
  initModal({
    buttonText: "Add Specialist",
    modalId: "add-specialist-modal",
    formId: "add-specialist-form"
  });
  initModal({ buttonText: "Add Child", modalId: "add-child-modal", formId: "add-child-form" });
  initModal({
    buttonText: "Add Experience",
    modalId: "add-experience-modal",
    formId: "add-experience-form"
  });
};

const renderChildResponses = (rawResponses) => {
  const responses = getById("child-responses");
  if (!responses) return;
  if (!rawResponses) {
    responses.innerHTML = `<div class="muted">No responses available.</div>`;
    return;
  }

  let parsed = rawResponses;
  if (typeof rawResponses === "string") {
    try {
      parsed = JSON.parse(rawResponses);
    } catch {
      parsed = rawResponses;
    }
  }

  if (Array.isArray(parsed)) {
    responses.innerHTML = parsed
      .map((item) => `<div class="child-insights">${String(item)}</div>`)
      .join("");
    return;
  }

  if (parsed && typeof parsed === "object") {
    responses.innerHTML = Object.entries(parsed)
      .map(
        ([key, value]) =>
          `<div class="child-insights"><strong>${key}</strong>: ${String(value)}</div>`
      )
      .join("");
    return;
  }

  responses.innerHTML = `<div class="child-insights">${String(parsed)}</div>`;
};

const renderChildDetail = (child) => {
  const name = getField(child, ["name", "fullName", "childName"]) || "Unnamed child";
  const childIdRaw = child ? child.childId : "";
  const childIdText =
    childIdRaw !== undefined && childIdRaw !== null && String(childIdRaw).trim() !== ""
      ? String(childIdRaw)
      : "-";
  const age = getField(child, ["age"]);
  const specialist = getField(child, ["specialist", "specialistName"]);
  const statusValue = getField(child, ["status"]);
  const metaBits = [];
  if (age) metaBits.push(`Age ${age}`);
  if (specialist) metaBits.push(`Specialist ${specialist}`);
  const meta = metaBits.length ? metaBits.join(" | ") : "No profile data available.";

  setText("child-name", name);
  setText("child-id", ` | ChildId: ${childIdText}`);
  setText("child-meta", meta);
  const status = getById("child-status");
  if (status) {
    status.textContent = statusValue;
    status.dataset.status = statusValue ? String(statusValue).toLowerCase() : "";
  }

  setText("child-accuracy", getField(child, ["accuracy"]) || "0%");
  setText("child-sessions", getField(child, ["sessions", "sessionCount"]) || "0");
  setText("child-duration", getField(child, ["avgDuration", "duration"]) || "0 sec");
  setText("child-trend", getField(child, ["trend"]) || "No data");
  setText("child-attempts", getField(child, ["attempts", "avgAttempts"]) || "0.0");
  setText("child-completion", getField(child, ["completion", "completionRate"]) || "0%");
  setText("child-operation", getField(child, ["operation", "primaryOperation"]) || "Unspecified");
  setText("child-progress", getField(child, ["progress", "notes"]) || "No session data available.");

  renderChildResponses(getField(child, ["responses", "formAnswers", "answers"]));
};

const renderChildrenList = (children = []) => {
  const list = getById("children-list");
  if (!list) return;
  const { role } = getUserContext();
  list.innerHTML = "";

  if (!Array.isArray(children) || children.length === 0) {
    renderEmptyListItem(list, "No children yet");
    renderEmptyChildProfile();
    return;
  }

  children.forEach((child, index) => {
    const name = getField(child, ["name", "fullName", "childName"]) || "Unnamed child";
    const childIdRaw = child ? child.childId : "";
    const childIdText =
      childIdRaw !== undefined && childIdRaw !== null && String(childIdRaw).trim() !== ""
        ? String(childIdRaw)
        : "-";
    const meta = `ChildId: ${childIdText}`;
    const allowDelete = role === "center_admin" || role === "specialist";
    const li = document.createElement("li");
    li.className = "child-item";
    if (index === 0) li.classList.add("active");
    li.innerHTML = `
      <div class="avatar">${name.charAt(0) || "?"}</div>
      <div>
        <div class="child-name">${name}</div>
        <div class="muted">${meta}</div>
      </div>
      ${allowDelete ? `<button class="btn ghost small child-delete" data-child-id="${childIdText}">Delete</button>` : ""}
    `;
    li.addEventListener("click", () => {
      list.querySelectorAll(".child-item").forEach((item) => item.classList.remove("active"));
      li.classList.add("active");
      renderChildDetail(child);
    });
    list.appendChild(li);
    if (index === 0) renderChildDetail(child);
  });

  list.querySelectorAll("[data-child-id]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const childId = button.getAttribute("data-child-id");
      if (!childId || childId === "-") return;
      if (!confirm("Delete this child?")) return;
      try {
        const response = await apiPost({ route: "deleteChild", childId }, "Deleting child...");
        const result = await response.json();
        if (!response.ok || result?.error) {
          alert(result?.error || "Could not delete child.");
          return;
        }
        if (typeof refreshChildren === "function") refreshChildren();
        if (typeof updateOverviewCounts === "function") updateOverviewCounts();
      } catch (err) {
        console.error("Delete child failed.", err);
        alert("Could not delete child.");
      }
    });
  });
};

const initChildren = () => {
  const list = getById("children-list");
  if (!list) return;
  const { role, linkedId } = getUserContext();

  const loadChildren = async () => {
    try {
      const children = await fetchRoute("children");
      let filtered = children;

      if (role === "specialist" && linkedId) {
        filtered = children.filter((child) => {
          const childSpecialistId = String(getField(child, ["specialistId", "specialistID"]) || "").trim();
          return childSpecialistId && normalizeKey(childSpecialistId) === normalizeKey(linkedId);
        });
      } else if (role === "center_admin" && linkedId) {
        filtered = children.filter((child) => {
          const childCenterId = String(getField(child, ["centerId", "centerID"]) || "").trim();
          return childCenterId && normalizeKey(childCenterId) === normalizeKey(linkedId);
        });
      }

      renderChildrenList(filtered);
    } catch (err) {
      console.error("Load children failed.", err);
      renderChildrenList([]);
    }
  };

  refreshChildren = loadChildren;
  loadChildren();
};

const enforceRoleAccess = () => {
  if (typeof window === "undefined") return;
  const { role } = getUserContext();
  const path = window.location.pathname || "";
  const page = path.split("/").pop();
  const restrictedForSpecialist = new Set(["centers.html"]);

  if (role === "specialist" && restrictedForSpecialist.has(page)) {
    window.location.href = "index.html";
    return;
  }

  if (role === "specialist") {
    document.querySelectorAll('.nav-item[href="centers.html"]').forEach((el) => {
      el.style.display = "none";
    });
  }

  document.querySelectorAll("[data-role]").forEach((el) => {
    const allowed = el.getAttribute("data-role");
    if (allowed === "center-only" && role !== "center_admin") {
      el.style.display = "none";
    } else if (allowed === "specialist-only" && role !== "specialist") {
      el.style.display = "none";
    }
  });
};

const initSettings = () => {
  const adminName = getById("center-admin-name");
  const email = getById("center-email");
  const phone = getById("center-phone");
  if (!adminName || !email || !phone) return;
  const saveButton = getById("save-settings");

  const { role, linkedId } = getUserContext();
  if (!linkedId) return;

  const lockInputs = role !== "center_admin";
  [adminName, email, phone].forEach((input) => {
    input.readOnly = lockInputs;
  });

  const loadSettings = async () => {
    try {
      const centers = await fetchRoute("centers");
      let center = null;
      if (role === "center_admin") {
        center = centers.find(
          (item) => normalizeKey(getField(item, ["id"])) === normalizeKey(linkedId)
        );
      } else if (role === "specialist") {
        const specialists = await fetchRoute("specialists");
        const specialist = specialists.find(
          (item) => normalizeKey(getField(item, ["id"])) === normalizeKey(linkedId)
        );
        const specialistCenterId = getField(specialist, ["centerId", "centerID"]);
        if (specialistCenterId) {
          center = centers.find(
            (item) =>
              normalizeKey(getField(item, ["id"])) === normalizeKey(specialistCenterId)
          );
        } else {
          const centerName = getField(specialist, ["center"]);
          center = centers.find(
            (item) => normalizeKey(getField(item, ["name"])) === normalizeKey(centerName)
          );
        }
      }

      if (!center) return;
      adminName.value = getField(center, ["name"]);
      email.value = getField(center, ["contactEmail", "email"]);
      phone.value = getField(center, ["contactPhone", "phone"]);
    } catch (err) {
      console.error("Load settings failed.", err);
    }
  };

  loadSettings();

  if (saveButton && role === "center_admin") {
    saveButton.addEventListener("click", async () => {
      const payload = {
        route: "updateCenterContact",
        centerId: linkedId,
        name: String(adminName.value || "").trim(),
        contactEmail: String(email.value || "").trim(),
        contactPhone: String(phone.value || "").trim()
      };
      if (!payload.centerId) return;
      try {
        const response = await apiPost(payload, "Saving settings...");
        const result = await response.json();
        if (!response.ok || result?.error) {
          alert(result?.error || "Could not save settings.");
          return;
        }
        alert("Settings saved.");
      } catch (err) {
        console.error("Save settings failed.", err);
        alert("Could not save settings.");
      }
    });
  }
};

const initLogout = () => {
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      if (typeof window === "undefined") return;
      localStorage.removeItem(AUTH_STORAGE_KEY);
      window.location.href = LOGIN_PAGE;
    });
  });
};

const initOverviewCounts = () => {
  const metricSpecialists = getById("metric-completion");
  const metricChildren = getById("metric-duration");
  const titleA = getById("metric-title-a");
  const titleB = getById("metric-title-b");
  const footA = getById("metric-foot-a");
  const footB = getById("metric-foot-b");
  if (!metricSpecialists || !metricChildren) return;

  updateOverviewCounts = async () => {
    const { role, linkedId } = getUserContext();
    if (role !== "center_admin") {
      setText("metric-completion", "—");
      setText("metric-duration", "—");
      if (titleA) titleA.textContent = "Center Specialists";
      if (titleB) titleB.textContent = "Center Children";
      if (footA) footA.textContent = "Not available for specialists";
      if (footB) footB.textContent = "Not available for specialists";
      return;
    }

    try {
      const [specialists, children, centers] = await Promise.all([
        fetchRoute("specialists"),
        fetchRoute("children"),
        fetchRoute("centers")
      ]);

      const filteredSpecialists = specialists.filter((specialist) => {
        const specialistCenterId = getField(specialist, ["centerId", "centerID"]);
        if (specialistCenterId) {
          return normalizeKey(specialistCenterId) === normalizeKey(linkedId);
        }
        const resolvedId = getCenterIdFromName(centers, getField(specialist, ["center"]));
        return resolvedId && normalizeKey(resolvedId) === normalizeKey(linkedId);
      });

      const specialistIds = new Set(
        filteredSpecialists
          .map((specialist) => String(getField(specialist, ["id"]) || "").trim())
          .filter(Boolean)
      );
      const filteredChildren = children.filter((child) => {
        const childSpecialistId = String(getField(child, ["specialistId", "specialistID"]) || "").trim();
        return childSpecialistId && specialistIds.has(childSpecialistId);
      });

      setText("metric-completion", String(filteredSpecialists.length));
      setText("metric-duration", String(filteredChildren.length));
      if (titleA) titleA.textContent = "Center Specialists";
      if (titleB) titleB.textContent = "Center Children";
      if (footA) footA.textContent = "Linked to your center";
      if (footB) footB.textContent = "Derived from specialists";
    } catch (err) {
      console.error("Load overview counts failed.", err);
      setText("metric-completion", "No data");
      setText("metric-duration", "No data");
    }
  };

  updateOverviewCounts();
};


const initHoverEffects = () => {
  const selector = ".card, .btn, .tab, .child-item";
  const toggleHover = (event, isOn) => {
    const target = event.target.closest(selector);
    if (!target) return;
    const related = event.relatedTarget;
    if (related && target.contains(related)) return;
    target.classList.toggle("is-hovered", isOn);
  };
  document.addEventListener("pointerover", (event) => toggleHover(event, true));
  document.addEventListener("pointerout", (event) => toggleHover(event, false));
};

const animateProgressBars = () => {
  document.querySelectorAll(".progress-fill").forEach((fill) => {
    const value = fill.dataset.value;
    if (!value) return;
    fill.style.width = "0%";
    requestAnimationFrame(() => {
      fill.style.width = `${value}%`;
    });
  });
};

const initEmptyStates = () => {
  setPlaceholderMetrics();
  clearChartCanvas();
  renderEmptyProgress();
  renderEmptyChildProfile();
  renderEmptyListItem(getById("children-list"), "No children yet");
  renderEmptyGridCard(getById("centers-grid"), "center-card", "No centers yet", [
    "Add centers to populate this list."
  ]);
  renderEmptyGridCard(getById("specialists-grid"), "specialist-card", "No specialists yet", [
    "Add specialists to populate this list."
  ]);
  renderEmptyGridCard(getById("vr-grid"), "vr-card", "No experiences yet", [
    "Add VR experiences to populate this list."
  ]);
};

document.addEventListener("DOMContentLoaded", () => {
  enforceAuth();
  enforceRoleAccess();
  initLogin();
  initTabs();
  initModals();
  initAddCenterForm();
  initAddSpecialistForm();
  initSpecialistCenterDropdown();
  initChildSpecialistSelect();
  initAddChildForm();
  initAddExperienceForm();
  initExperienceCentersChecklist();
  initChildren();
  initCenters();
  initSpecialists();
  initVr();
  initSettings();
  initHoverEffects();
  initEmptyStates();
  initOverviewCounts();
  initLogout();
  animateProgressBars();
});
