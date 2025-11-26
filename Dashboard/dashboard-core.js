// ===== UnitySphere Admin (client-side) =====

const STORAGE_VERSION = 5;
const STORAGE_KEY = `unitysphere-data-v${STORAGE_VERSION}`;
const DEFAULT_ADMIN_AVATAR = 'https://i.pravatar.cc/150?u=unitysphere-admin';
const LEGACY_STORAGE_KEYS = ['unitysphere-data', 'unitysphere-data-v1', 'unitysphere-data-v2', 'unitysphere-data-v3', 'unitysphere-data-v4'];
const SESSION_VERSION_KEY = 'unitysphere-session-version';

// === Google Sheets backend config ===
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx-CMQMTXnmfDgJgSsZTgKzZt5rIIsMjkBNw916NxDoITQUR8lYjI_fz7Ma4A4nZETRog/exec';

/**
 * Save the full DB object to Google Sheets.
 * Expects Apps Script to handle:
 *   POST { action: 'save', payload: {...db} }
 */
async function remoteSave(data) {
  if (typeof fetch !== 'function' || !GOOGLE_SCRIPT_URL) return;
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save',
        payload: data
      })
    });
  } catch (err) {
    console.warn('Remote save (Google Sheets) failed', err);
  }
}

/**
 * Load the full DB object from Google Sheets.
 * Expects Apps Script to handle:
 *   GET ?action=load -> JSON
 */
async function remoteLoad() {
  if (typeof fetch !== 'function' || !GOOGLE_SCRIPT_URL) return null;
  try {
    const resp = await fetch(`${GOOGLE_SCRIPT_URL}?action=load`, {
      method: 'GET'
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    if (!json || typeof json !== 'object') return null;
    return json;
  } catch (err) {
    console.warn('Remote load (Google Sheets) failed', err);
    return null;
  }
}

const storageAvailable = typeof localStorage !== 'undefined';
const sessionAvailable = typeof sessionStorage !== 'undefined';
const localStore = storageAvailable ? localStorage : null;
const sessionStore = sessionAvailable ? sessionStorage : null;

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return '';
  const sizeInMB = bytes / (1024 * 1024);
  return Number.isInteger(sizeInMB) ? `${sizeInMB} MB` : `${sizeInMB.toFixed(1)} MB`;
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const IMAGE_SIZE_LIMIT_LABEL = formatFileSize(MAX_IMAGE_SIZE_BYTES);
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/pjpeg'];

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('no-file'));

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return reject(new Error('bad-type'));
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return reject(new Error('too-large'));
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('read-failed'));
    reader.readAsDataURL(file);
  });
}

function uid() { return Math.random().toString(36).slice(2, 10); }
function clone(x) { return JSON.parse(JSON.stringify(x)); }

function toNumber(value) {
  if (value === null || value === undefined) return null;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(num) ? num : null;
}

function legacyMapToLatLng(posX, posY) {
  const x = toNumber(posX);
  const y = toNumber(posY);
  if (x === null || y === null) return null;
  const clampedX = Math.min(100, Math.max(0, x));
  const clampedY = Math.min(100, Math.max(0, y));
  const lat = +(90 - (clampedY / 100) * 180);
  const lng = +((clampedX / 100) * 360 - 180);
  return { lat, lng, approximate: true };
}

function seedCenter({ name, location, desc, tags = [], image, lat, latitude, lng, longitude, posX, posY, login }) {
  const coords = (() => {
    const directLat = toNumber(lat ?? latitude);
    const directLng = toNumber(lng ?? longitude);
    if (directLat !== null && directLng !== null) {
      return { lat: directLat, lng: directLng, approximate: false };
    }
    const fallback = legacyMapToLatLng(posX, posY);
    if (fallback) return fallback;
    return { lat: null, lng: null, approximate: false };
  })();

  return {
    id: uid(),
    name,
    location,
    desc,
    tags,
    image,
    lat: coords.lat,
    lng: coords.lng,
    posX,
    posY,
    login: login || null
  };
}

function seedSpecialist({ name, skill, centerId = null, avatar = '', login = null }) {
  return {
    id: uid(),
    name,
    skill,
    centerId,
    avatar,
    login
  };
}

function getCenterCoordinates(center) {
  if (!center) return null;
  const directLat = toNumber(center.lat ?? center.latitude);
  const directLng = toNumber(center.lng ?? center.longitude);
  if (directLat !== null && directLng !== null) {
    return { lat: directLat, lng: directLng, approximate: false };
  }
  const fallback = legacyMapToLatLng(center.posX, center.posY);
  if (fallback) return fallback;
  return null;
}

// ---- Google Maps helpers ----
let googleMapsPromise = null;
let centersMapInstance = null;
let centersMapMarkers = [];
let centersActiveInfoWindow = null;

function ensureGoogleMaps(apiKey) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('no-window'));
  }
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  const trimmedKey = (apiKey || '').trim();
  if (!trimmedKey || trimmedKey === 'YOUR_API_KEY') {
    return Promise.reject(new Error('missing-api-key'));
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = `__unitysphereInitMap${Math.random().toString(36).slice(2)}`;
    window[callbackName] = () => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('google-maps-unavailable'));
      }
      delete window[callbackName];
    };

    // 👇 Load Maps JS with Places library, restricted to Jordan
    const params = new URLSearchParams({
      callback: callbackName,
      v: 'weekly',
      libraries: 'places',
      region: 'JO'
      // you can also add: language: 'en' or 'ar'
    });
    params.set('key', trimmedKey);

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete window[callbackName];
      googleMapsPromise = null;
      reject(new Error('google-maps-load-failed'));
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}


function updateCentersMap(centers) {
  const canvas = document.getElementById('centers-map-canvas');
  if (!canvas) return;
  const statusEl = document.getElementById('centers-map-status');
  const setStatus = (message) => {
    if (!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.style.display = message ? '' : 'none';
  };

  const apiKey = canvas.dataset.googleMapsKey || '';
  const defaultLat = toNumber(canvas.dataset.defaultLat) ?? 24.7136;
  const defaultLng = toNumber(canvas.dataset.defaultLng) ?? 46.6753;
  const defaultZoom = toNumber(canvas.dataset.defaultZoom) ?? 4;
  const singleZoom = toNumber(canvas.dataset.singleZoom);
  const mapId = canvas.dataset.mapId;

  const entries = centers
    .map(center => {
      const coords = getCenterCoordinates(center);
      if (!coords) return null;
      return { center, coords };
    })
    .filter(Boolean);
  const hasCenters = Array.isArray(centers) && centers.length > 0;

  const clearMarkers = () => {
    centersMapMarkers.forEach(marker => marker.setMap(null));
    centersMapMarkers = [];
    if (centersActiveInfoWindow) {
      centersActiveInfoWindow.close();
      centersActiveInfoWindow = null;
    }
  };

  if (!apiKey || apiKey.trim() === '' || apiKey.trim() === 'YOUR_API_KEY') {
    clearMarkers();
    centersMapInstance = null;
    canvas.innerHTML = '';
    if (entries.length) {
      setStatus('Provide a valid Google Maps API key to render the map.');
    } else if (hasCenters) {
      setStatus('Add latitude and longitude for each center, then provide your Google Maps API key.');
    } else {
      setStatus('Add a Google Maps API key and center coordinates to visualize the pins.');
    }
    return;
  }

  if (!(window.google && window.google.maps)) {
    setStatus('Loading Google Maps…');
  }

  ensureGoogleMaps(apiKey)
    .then(maps => {
      if (!centersMapInstance) {
        const initialCenter = entries.length
          ? { lat: entries[0].coords.lat, lng: entries[0].coords.lng }
          : { lat: defaultLat, lng: defaultLng };
        const options = {
          center: initialCenter,
          zoom: entries.length ? (Number.isFinite(singleZoom) ? singleZoom : 10) : defaultZoom,
        };
        if (mapId) options.mapId = mapId;
        centersMapInstance = new maps.Map(canvas, options);
      }

      clearMarkers();

      if (entries.length === 0) {
        centersMapInstance.setCenter({ lat: defaultLat, lng: defaultLng });
        centersMapInstance.setZoom(defaultZoom);
        setStatus(hasCenters ? 'Add latitude and longitude for each center to see pins.' : 'Add centers with coordinates to see pins.');
        return;
      }

      const bounds = new maps.LatLngBounds();
      entries.forEach(({ center, coords }) => {
        const marker = new maps.Marker({
          map: centersMapInstance,
          position: { lat: coords.lat, lng: coords.lng },
          title: center.name || center.location || 'Center',
        });
        centersMapMarkers.push(marker);
        bounds.extend(marker.getPosition());

        const infoContent = `
          <div class="map-info-window">
            ${center.name ? `<strong>${esc(center.name)}</strong>` : ''}
            ${center.location ? `<span class="map-info-sub">${esc(center.location)}</span>` : ''}
          </div>
        `;
        if (center.name || center.location) {
          const infoWindow = new maps.InfoWindow({ content: infoContent });
          marker.addListener('click', () => {
            if (centersActiveInfoWindow) centersActiveInfoWindow.close();
            infoWindow.open({ map: centersMapInstance, anchor: marker });
            centersActiveInfoWindow = infoWindow;
          });
        }
      });

      if (entries.length > 1) {
        centersMapInstance.fitBounds(bounds);
      } else {
        const target = entries[0].coords;
        centersMapInstance.setCenter({ lat: target.lat, lng: target.lng });
        centersMapInstance.setZoom(Number.isFinite(singleZoom) ? singleZoom : 12);
      }
      setStatus('Click a pin to view center details.');
    })
    .catch(() => {
      clearMarkers();
      centersMapInstance = null;
      canvas.innerHTML = '';
      setStatus('Unable to load Google Maps. Verify your API key and network access.');
    });
}
function initNominatimLocationAutocomplete() {
  const input = qi('center-location');
  const resultsBox = document.getElementById('location-results');
  const latField = qi('center-lat');
  const lngField = qi('center-lng');

  if (!input || !resultsBox || !latField || !lngField) return;

  let debounceTimer = null;

  const clearResults = () => {
    resultsBox.innerHTML = '';
    resultsBox.style.display = 'none';
  };

  input.addEventListener('input', () => {
    const query = input.value.trim();
    clearTimeout(debounceTimer);

    // reset lat/lng when user types a new query
    latField.value = '';
    lngField.value = '';

    if (query.length < 3) {
      clearResults();
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, {
          headers: {
            'Accept': 'application/json'
          }
        });
        const data = await res.json();

        resultsBox.innerHTML = '';
        if (!data || !data.length) {
          clearResults();
          return;
        }

        data.forEach(place => {
          const item = document.createElement('div');
          item.className = 'autocomplete-item';
          item.textContent = place.display_name;

          item.addEventListener('click', () => {
            input.value = place.display_name;
            latField.value = place.lat;
            lngField.value = place.lon;
            clearResults();
          });

          resultsBox.appendChild(item);
        });

        resultsBox.style.display = 'block';
      } catch (err) {
        console.warn('Nominatim autocomplete error', err);
        clearResults();
      }
    }, 300);
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!resultsBox.contains(e.target) && e.target !== input) {
      clearResults();
    }
  });
}

// ---- Seed data ----
const seedCenters = [];
const seedSpecialists = [];

const DEFAULT_DATA = {
  version: STORAGE_VERSION,
  users: [
    {
      username: 'admin_user',
      password: 'Admin123!',     // demo only
      name: 'Main Admin',
      role: 'main-admin',
      email: 'admin@example.com',
      avatar: DEFAULT_ADMIN_AVATAR
    }
  ],
  centers: seedCenters,
  specialists: seedSpecialists,
  children: [],
  modules: [
    {
      id: uid(),
      title: 'Sample VR Module 1',
      category: 'Demo Category',
      durationMin: 15
    }
  ],
  assessments: []
};

// ---- persistence ----
function loadData() {
  if (!storageAvailable) return clone(DEFAULT_DATA);
  try {
    const raw = localStore?.getItem?.(STORAGE_KEY);
    if (!raw) {
      saveData(DEFAULT_DATA);
      return clone(DEFAULT_DATA);
    }
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== STORAGE_VERSION) {
      saveData(DEFAULT_DATA);
      return clone(DEFAULT_DATA);
    }
    return {
      version: STORAGE_VERSION,
      users: parsed.users || clone(DEFAULT_DATA.users),
      centers: parsed.centers || [],
      specialists: parsed.specialists || [],
      children: parsed.children || [],
      modules: parsed.modules || [],
      assessments: parsed.assessments || []
    };
  } catch {
    saveData(DEFAULT_DATA);
    return clone(DEFAULT_DATA);
  }
}

function saveData(data) {
  if (!storageAvailable || !localStore) return true;
  try {
    const payload = clone(data);
    payload.version = STORAGE_VERSION;
    localStore.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('Failed to persist dashboard data to local storage', err);
    return false;
  }
}

function normalizeCenterLogin(center) {
  if (!center) return null;
  if (!center.login && (center.centerUsername || center.centerPassword)) {
    center.login = {
      username: center.centerUsername || '',
      password: center.centerPassword || ''
    };
  }
  if (!center.login) return null;
  center.login = {
    username: (center.login.username || '').trim(),
    password: center.login.password || ''
  };
  if (!center.login.username) {
    center.login = null;
  }
  return center.login;
}

function normalizeSpecialistLogin(specialist) {
  if (!specialist) return null;
  if (!specialist.login && (specialist.username || specialist.password)) {
    specialist.login = {
      username: specialist.username || '',
      password: specialist.password || ''
    };
    delete specialist.username;
    delete specialist.password;
  }
  if (!specialist.login) return null;
  specialist.login = {
    username: (specialist.login.username || '').trim(),
    password: specialist.login.password || ''
  };
  if (!specialist.login.username) {
    specialist.login = null;
  }
  return specialist.login;
}

function upsertUser(user) {
  if (!user || !user.username) return;
  db.users = Array.isArray(db.users) ? db.users : [];
  const key = user.username.toLowerCase();
  const existing = db.users.find(u => u.username && u.username.toLowerCase() === key);
  if (existing) {
    Object.assign(existing, user);
  } else {
    db.users.push(user);
  }
}

function removeUserByUsername(username) {
  if (!username) return;
  const key = username.toLowerCase();
  db.users = (db.users || []).filter(u => !u.username || u.username.toLowerCase() !== key);
}

function syncUsersWithEntities() {
  db.users = Array.isArray(db.users) ? db.users.filter(Boolean) : [];
  db.centers = Array.isArray(db.centers) ? db.centers : [];
  db.specialists = Array.isArray(db.specialists) ? db.specialists : [];

  const userLookup = new Map();
  db.users.forEach(u => {
    if (u && u.username) {
      userLookup.set(u.username.toLowerCase(), u);
    }
  });

  // Centers -> center-admin users
  db.centers.forEach(center => {
    const login = normalizeCenterLogin(center);
    if (!login || !login.username) return;
    const key = login.username.toLowerCase();
    const payload = {
      username: login.username,
      password: login.password || '',
      role: 'center-admin',
      centerId: center.id,
      name: center.name ? `${center.name} Admin` : 'Center Admin'
    };
    if (userLookup.has(key)) {
      Object.assign(userLookup.get(key), payload);
    } else {
      db.users.push(payload);
      userLookup.set(key, payload);
    }
  });

  // Specialists -> specialist users (with specialistId for direct mapping)
  const specialistUsers = new Set();
  db.specialists.forEach(spec => {
    const login = normalizeSpecialistLogin(spec);
    if (!login || !login.username) return;
    const key = login.username.toLowerCase();
    const payload = {
      username: login.username,
      password: login.password || '',
      role: 'specialist',
      centerId: spec.centerId || null,
      specialistId: spec.id,
      name: spec.name || login.username
    };
    if (userLookup.has(key)) {
      Object.assign(userLookup.get(key), payload);
    } else {
      db.users.push(payload);
      userLookup.set(key, payload);
    }
    specialistUsers.add(key);
  });

  // Clean up users that no longer map to an entity
  db.users = db.users.filter(user => {
    if (!user || !user.username) return false;
    if (user.role === 'center-admin') {
      return db.centers.some(center => center.id === user.centerId);
    }
    if (user.role === 'specialist') {
      return specialistUsers.has(user.username.toLowerCase());
    }
    return true; // main-admin or other roles
  });
}

const db = loadData();
syncUsersWithEntities();

// ---- routing ----
function isLoginPage() {
  return document.body.classList.contains('auth-page');
}

function isDashboardPage() {
  return location.pathname.endsWith('dashboard.html');
}

// ---- tiny DOM helpers ----
const qs = (s) => document.querySelector(s);
const qsa = (s) => [...document.querySelectorAll(s)];
const qi = (id) => document.getElementById(id);
function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') n.className = v;
    else if (k === 'style') Object.assign(n.style, v);
    else n.setAttribute(k, v);
  });
  kids.forEach(k => {
    if (k === null || k === undefined) return;
    n.append(k);
  });
  return n;
}
function esc(s) {
  return (s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
