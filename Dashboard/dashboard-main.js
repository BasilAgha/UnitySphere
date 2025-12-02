
// ================= DASHBOARD =================
if (isDashboardPage()) {
  // guard
  const username = sessionStore?.getItem?.('us_username');
  if (!username) location.href = 'login.html';

  let storageWarningShown = false;

  const name = sessionStore?.getItem?.('us_name');
  const email = sessionStore?.getItem?.('us_email');
  const role = sessionStore?.getItem?.('us_role') || 'main-admin';
  const centerIdForRole = sessionStore?.getItem?.('us_center');
  const specialistIdForRole = sessionStore?.getItem?.('us_specialist');

  qi('sidebar-name').textContent = name || username;
  qi('sidebar-email').textContent = email || '—';
  qi('user-name').textContent = name || username;

  let userRoleLabel = 'Main admin';
  if (role === 'center-admin') userRoleLabel = 'Center admin';
  else if (role === 'specialist') userRoleLabel = 'Specialist';
  const roleEl = qi('user-role');
  if (roleEl) roleEl.textContent = userRoleLabel;

  const isCenterAdmin = role === 'center-admin';
  const isSpecialist = role === 'specialist';

  const centersForRole = () => {
    if (isCenterAdmin && centerIdForRole) return db.centers.filter(c => c.id === centerIdForRole);
    return db.centers;
  };

  const specialistsForRole = () => {
    if (isSpecialist && specialistIdForRole) return db.specialists.filter(s => s.id === specialistIdForRole);
    if (isCenterAdmin && centerIdForRole) return db.specialists.filter(s => s.centerId === centerIdForRole);
    return db.specialists;
  };

  const childrenForRole = () => {
    const all = db.children || [];
    if (isSpecialist && specialistIdForRole) {
      return all.filter(ch => ch.specialistId === specialistIdForRole);
    }
    if (isCenterAdmin && centerIdForRole) {
      return all.filter(ch => ch.centerId === centerIdForRole);
    }
    return all;
  };

  const modulesForRole = () => db.modules;

  const assessmentsForRole = () => {
    const all = db.assessments || [];
    if (isSpecialist && specialistIdForRole) {
      return all.filter(a => a.specialistId === specialistIdForRole);
    }
    if (isCenterAdmin && centerIdForRole) {
      const allowed = new Set(specialistsForRole().map(s => s.id));
      return all.filter(a => allowed.has(a.specialistId));
    }
    return all;
  };

  const accessibleSections = isSpecialist
    ? ['overview', 'children', 'assessments']
    : isCenterAdmin
      ? ['overview', 'children', 'specialists', 'assessments']
      : ['overview', 'centers', 'specialists', 'modules', 'children', 'assessments'];

  if (isCenterAdmin) {
    const overviewNavLabel = qs('.sidebar-nav .nav-link[data-section="overview"] span');
    if (overviewNavLabel) overviewNavLabel.textContent = 'Center dashboard';
  }
  if (isSpecialist) {
    const overviewNavLabel = qs('.sidebar-nav .nav-link[data-section="overview"] span');
    if (overviewNavLabel) overviewNavLabel.textContent = 'My dashboard';
  }

  const userKey = (username || '').toLowerCase();
  const currentUser = (db.users || []).find(u => (u?.username || '').toLowerCase() === userKey) || null;
  const storedAvatar = sessionStorage.getItem('us_avatar');
  const activeAvatar = storedAvatar || currentUser?.avatar || DEFAULT_ADMIN_AVATAR;
  const applyAvatar = (src) => {
    const finalSrc = src || DEFAULT_ADMIN_AVATAR;
    ['header-avatar', 'sidebar-avatar'].forEach(id => {
      const elNode = qi(id);
      if (!elNode) return;
      elNode.style.backgroundImage = `url(${finalSrc})`;
      elNode.style.backgroundSize = 'cover';
      elNode.style.backgroundPosition = 'center';
    });
  };
  applyAvatar(activeAvatar);
  if (activeAvatar) {
    sessionStorage.setItem('us_avatar', activeAvatar);
  }

  const avatarInput = qi('admin-avatar-file');
  const avatarButton = qi('btn-change-avatar');
  if (avatarButton && avatarInput) {
    avatarButton.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', async () => {
      const file = avatarInput.files && avatarInput.files[0];
      if (!file) return;
      try {
        const dataUrl = await readFileAsDataUrl(file);
        if (!dataUrl) return;
        applyAvatar(dataUrl);
        sessionStorage.setItem('us_avatar', dataUrl);
        if (currentUser) {
          currentUser.avatar = dataUrl;
          saveData(db);
        } else {
          console.warn('Unable to locate current user record to save avatar.');
        }
      } catch (err) {
        console.error('Unable to read avatar file', err);
        const msg =
          err?.message === 'bad-type' ? 'Only PNG or JPG images are allowed.' :
            err?.message === 'too-large' ? `Image must be under ${IMAGE_SIZE_LIMIT_LABEL}.` :
              'Unable to read the selected image. Please try another file.';
        alert(msg);
      } finally {
        avatarInput.value = '';
      }
    });
  }

  const hour = new Date().getHours();
  qi('greeting').textContent = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  qi('logout').addEventListener('click', () => {
    ['us_username', 'us_name', 'us_email', 'us_role', 'us_center', 'us_specialist', 'us_avatar'].forEach(k => sessionStorage.removeItem(k));
    location.href = 'login.html';
  });

  // assessments description tweaks for roles
  const assessmentsDescription = qi('assessments-description');
  if (assessmentsDescription) {
    if (isCenterAdmin) {
      assessmentsDescription.textContent = 'Review assessments logged by specialists at your center.';
    } else if (isSpecialist) {
      assessmentsDescription.textContent = 'Log and review VR assessments for the children you follow.';
    }
  }
  const assessmentsListHint = qs('#section-assessments .card-subsection .hint');
  if (assessmentsListHint) {
    if (isCenterAdmin) {
      assessmentsListHint.textContent = 'Stay on top of the latest progress recorded by your specialists.';
    } else if (isSpecialist) {
      assessmentsListHint.textContent = 'Each card summarizes an assessment you have logged.';
    }
  }

  // nav
  const setSectionTitle = (btn) => {
    const label = btn.querySelector('span')?.textContent.trim() || btn.textContent.trim();
    qi('section-title').textContent = label;
  };

  // hide nav items not in accessibleSections
  qsa('.sidebar-nav .nav-link').forEach(btn => {
    const key = btn.dataset.section;
    const allowed = accessibleSections.includes(key);
    btn.classList.toggle('hidden', !allowed);
  });
  qsa('main .section').forEach(sec => {
    const key = sec.id.replace('section-', '');
    const allowed = accessibleSections.includes(key);
    sec.classList.toggle('hidden', !allowed);
  });

  qsa('.sidebar-nav .nav-link').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.sidebar-nav .nav-link').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.dataset.section;
      qsa('main .section').forEach(sec => sec.classList.remove('active'));
      const targetSection = qi(`section-${key}`);
      if (targetSection) targetSection.classList.add('active');
      setSectionTitle(btn);
      if (key === 'specialists' || key === 'assessments' || key === 'children') refreshSelectors();
      refreshStats();
    });
  });

  let initialNav = qs('.sidebar-nav .nav-link.active');
  if (!initialNav || initialNav.classList.contains('hidden')) {
    const defaultKey = accessibleSections[0];
    if (defaultKey) {
      qsa('.sidebar-nav .nav-link').forEach(b => b.classList.remove('active'));
      initialNav = qs(`.sidebar-nav .nav-link[data-section="${defaultKey}"]`);
      if (initialNav) initialNav.classList.add('active');
      qsa('main .section').forEach(sec => {
        sec.classList.toggle('active', sec.id === `section-${defaultKey}`);
      });
    }
  }
  if (initialNav) setSectionTitle(initialNav);

  // ---------- Centers ----------
  const addPanel = qi('add-center-panel');
  const toggleBtn = qi('btn-toggle-add-center');
  const cancelBtn = qi('btn-cancel-center');
  const centerForm = qi('form-center');
    // Initialize Google-style search for center location (Jordan only)
  initNominatimLocationAutocomplete();


  if (addPanel && toggleBtn) {
    if (isCenterAdmin || isSpecialist) {
      addPanel.classList.add('hidden');
      toggleBtn.classList.add('hidden');
      cancelBtn?.classList.add('hidden');
    } else {
      const defaultOpenLabel = toggleBtn.dataset.labelOpen || toggleBtn.textContent.trim();
      const defaultCloseLabel = toggleBtn.dataset.labelClose || 'Close form';
      const labelEl = toggleBtn.querySelector('.label');
      const updateToggleLabel = (text) => {
        if (labelEl) {
          labelEl.textContent = text;
        } else {
          toggleBtn.textContent = text;
        }
      };
      const setToggleState = (isOpen) => {
        addPanel.classList.toggle('active', isOpen);
        toggleBtn.setAttribute('aria-expanded', String(isOpen));
        toggleBtn.classList.toggle('is-open', isOpen);
        updateToggleLabel(isOpen ? defaultCloseLabel : defaultOpenLabel);
      };
      setToggleState(false);
      toggleBtn.addEventListener('click', () => {
        const isOpen = !addPanel.classList.contains('active');
        setToggleState(isOpen);
        if (isOpen) {
          addPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      cancelBtn?.addEventListener('click', () => {
        setToggleState(false);
      });

      centerForm?.addEventListener('submit', async e => {
        e.preventDefault();
        const name = qi('center-name').value.trim();
        const location = qi('center-location').value.trim();
        const imageInput = qi('center-image');
        const imageFileInput = qi('center-image-file');
        let image = imageInput ? imageInput.value.trim() : '';
        const imageFile = imageFileInput && imageFileInput.files ? imageFileInput.files[0] : null;
        if (imageFile) {
          try {
            image = await readFileAsDataUrl(imageFile);
          } catch (err) {
            console.error('Unable to read center image file', err);
            alert('Unable to read the selected center image. Please try another file.');
            return;
          }
        }
        const desc = qi('center-desc').value.trim();
        const tags = (qi('center-tags').value || '').split(',').map(s => s.trim()).filter(Boolean);
        const loginUsername = qi('center-username').value.trim();
        const loginPassword = qi('center-password').value.trim();
        const lat = parseFloat(qi('center-lat').value);
        const lng = parseFloat(qi('center-lng').value);
        if (!name || !loginUsername || !loginPassword) return;
if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
  alert('Please choose a location from the search box (start typing and select one of the suggestions).');
  return;
}

        // prevent duplicate usernames
        const usernameTaken = (db.users || []).some(
          u => u.username && u.username.toLowerCase() === loginUsername.toLowerCase()
        );
        if (usernameTaken) {
          alert('This center username is already in use. Choose another username.');
          return;
        }
        const centerId = uid();
        const derivedPosX = Math.round(((lng + 180) / 360) * 100);
        const derivedPosY = Math.round(((90 - lat) / 180) * 100);
        db.centers.push({
          id: centerId, name, location, image, desc, tags,
          login: { username: loginUsername, password: loginPassword },
          lat,
          lng,
          posX: Number.isFinite(derivedPosX) ? derivedPosX : undefined,
          posY: Number.isFinite(derivedPosY) ? derivedPosY : undefined
        });
        upsertUser({
          username: loginUsername,
          password: loginPassword,
          role: 'center-admin',
          centerId,
          name: name ? `${name} Admin` : loginUsername
        });
        persistAndRender();
        e.target.reset();
        if (imageFileInput) imageFileInput.value = '';
        setToggleState(false);
      });
    }
  }

  const exportBtn = qi('btn-export-centers');
  if (exportBtn) {
    exportBtn.classList.toggle('hidden', isCenterAdmin || isSpecialist);
    exportBtn.addEventListener('click', () => {
      const out = centersForRole().map(({ id, ...rest }) => rest);
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'centers.json'; a.click();
      URL.revokeObjectURL(url);
    });
  }

  function renderCenters() {
    const centers = centersForRole();
    const totalCenters = centers.length;
    const loginReady = centers.filter(c => {
      const login = c.login || {};
      return Boolean((login.username || c.centerUsername) && (login.password || c.centerPassword));
    }).length;
    const capabilityCounts = new Map();
    const locationSet = new Set();

    centers.forEach(c => {
      (c.tags || []).forEach(tag => {
        const clean = tag && tag.trim();
        if (!clean) return;
        const key = clean.toLowerCase();
        const existing = capabilityCounts.get(key);
        if (existing) existing.count += 1;
        else capabilityCounts.set(key, { label: clean, count: 1 });
      });
      const loc = c.location && c.location.trim();
      if (loc) locationSet.add(loc);
    });

    const totalEl = qi('centers-total'); if (totalEl) totalEl.textContent = totalCenters;
    const readyEl = qi('center-login-ready'); if (readyEl) readyEl.textContent = totalCenters ? `${loginReady}/${totalCenters}` : loginReady;
    const capabilityCountEl = qi('center-capability-count'); if (capabilityCountEl) capabilityCountEl.textContent = capabilityCounts.size;
    const locationCountEl = qi('center-location-count'); if (locationCountEl) locationCountEl.textContent = locationSet.size;

    const capPills = qi('center-capability-pills');
    if (capPills) {
      capPills.innerHTML = '';
      const caps = [...capabilityCounts.values()];
      if (caps.length === 0) {
        capPills.append(el('span', { class: 'pill small' }, 'No capabilities logged yet'));
      } else {
        caps
          .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
          .slice(0, 6)
          .forEach(({ label, count }) => {
            capPills.append(el('span', { class: 'pill small' }, `${label} (${count})`));
          });
      }
    }

    updateCentersMap(centers);

    // cards
    const grid = qi('centers-grid'); if (!grid) return;
    grid.innerHTML = '';
    centers.forEach(c => {
      const card = el('article', { class: 'center-card' });
      const img = el('img', {
        src: c.image || 'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?q=80&w=1600&auto=format&fit=crop',
        alt: c.name
      });
      const body = el('div', { class: 'card-body' },
        el('div', { class: 'title' }, c.name),
        el('div', { class: 'place muted' }, `📍 ${c.location || 'Not specified'}`),
        el('div', { class: 'desc muted' }, c.desc || 'Awaiting description'),
        el('div', { class: 'tag-row' },
          ...(c.tags && c.tags.length ? c.tags : ['General']).map(t => el('span', { class: 'tag' }, t))
        )
      );
      const login = c.login || { username: c.centerUsername, password: c.centerPassword } || {};
      const credentials = el('div', { class: 'center-credentials' },
        el('span', { class: 'badge badge-soft' }, login && login.username ? `Login: ${login.username}` : 'Login pending')
      );
      if (login && login.password) {
        credentials.append(el('span', { class: 'pill' }, login.password));
      }

      // roster for this center
      const centerSpecialists = db.specialists.filter(s => s.centerId === c.id);
      const rosterList = centerSpecialists.length
        ? el('ul', { class: 'center-roster-list' },
          ...centerSpecialists.map(s => {
            const loginInfo = normalizeSpecialistLogin(s);
            return el('li', {},
              el('strong', {}, s.name),
              el('span', { class: 'role muted' }, s.skill || '—'),
              loginInfo && loginInfo.username
                ? el('div', { class: 'login-pill' },
                  el('span', { class: 'badge badge-soft' }, `Login: ${loginInfo.username}`),
                  loginInfo.password ? el('span', { class: 'pill small' }, loginInfo.password) : null
                )
                : null
            );
          })
        )
        : el('div', { class: 'muted center-roster-empty' }, 'No specialists assigned yet.');

      const rosterToggle = el('button', { class: 'ghost', 'aria-expanded': 'true' }, 'Hide specialists');
      rosterToggle.addEventListener('click', () => {
        const hidden = rosterList.classList.toggle('hidden');
        rosterToggle.setAttribute('aria-expanded', String(!hidden));
        rosterToggle.textContent = hidden ? 'Show specialists' : 'Hide specialists';
      });

      const rosterHeader = el('div', { class: 'center-roster-header' },
        el('span', {}, 'Specialists'),
        el('span', { class: 'hint' },
          centerSpecialists.length
            ? `${centerSpecialists.length} ${centerSpecialists.length === 1 ? 'specialist' : 'specialists'}`
            : 'No specialists'
        ),
        rosterToggle
      );

      const roster = el('div', { class: 'center-roster' }, rosterHeader, rosterList);

      const footerActions = [credentials];
      if (!isCenterAdmin && !isSpecialist) {
        footerActions.push((() => {
          const b = el('button', { class: 'primary ghost' }, "Delete");
          b.addEventListener('click', () => {
            const loginDetails = normalizeCenterLogin(c);
            if (loginDetails && loginDetails.username) removeUserByUsername(loginDetails.username);
            // detach specialists from this center, keep them as freelance
            db.specialists = db.specialists.map(s => s.centerId === c.id ? { ...s, centerId: null } : s);
            // detach children from this center
            db.children = (db.children || []).map(ch => ch.centerId === c.id ? { ...ch, centerId: null } : ch);
            db.centers = db.centers.filter(x => x.id !== c.id);
            persistAndRender();
          });
          return b;
        })());
      }
      const footer = el('footer', { class: 'center-footer' }, ...footerActions);
      card.append(img, body, roster, footer);
      grid.append(card);
    });

    if (!centers.length) {
      grid.append(el('div', { class: 'empty-state' }, 'No centers yet. Use “Add New Center” to start your network.'));
    }
  }

  // ---------- Specialists ----------
  const specialistForm = qi('form-specialist');
  if (specialistForm) {
    const hint = qi('specialist-form-hint');
    if (hint && isCenterAdmin) {
      hint.textContent = 'Add new specialists for your center and share their login credentials.';
    } else if (hint && isSpecialist) {
      hint.textContent = 'Specialists are managed by your admin. You can view only your own profile.';
    }

    if (isSpecialist) {
      // lock the form for specialist role (view-only)
      specialistForm.querySelectorAll('input, select, button').forEach(field => {
        field.disabled = true;
      });
    } else {
      specialistForm.addEventListener('submit', async e => {
        e.preventDefault();
        const name = qi('spec-name').value.trim();
        const skill = qi('spec-skill').value.trim();
        let centerId = qi('spec-center').value || null;
        const avatarInput = qi('spec-avatar');
        const avatarFileInput = qi('spec-avatar-file');
        let avatar = avatarInput ? avatarInput.value.trim() : '';
        const avatarFile = avatarFileInput && avatarFileInput.files ? avatarFileInput.files[0] : null;
        if (avatarFile) {
          try {
            avatar = await readFileAsDataUrl(avatarFile);
          } catch (err) {
            console.error('Unable to read specialist avatar file', err);
            alert('Unable to read the selected avatar. Please try another file.');
            return;
          }
        }
        const loginUsername = qi('spec-username').value.trim();
        const loginPassword = qi('spec-password').value.trim();
        if (isCenterAdmin) {
          if (!centerIdForRole) { alert('Your center assignment is missing. Contact the main admin.'); return; }
          centerId = centerIdForRole;
        }
        if (!name || !loginUsername || !loginPassword) {
          alert('Please provide a name and login credentials for the specialist.');
          return;
        }
        const existingUser = (db.users || []).some(u => u.username && u.username.toLowerCase() === loginUsername.toLowerCase());
        if (existingUser) {
          alert('This username is already in use. Choose another username.');
          return;
        }
        const specialistId = uid();
        db.specialists.push({ id: specialistId, name, skill, centerId, avatar, login: { username: loginUsername, password: loginPassword } });
        upsertUser({ username: loginUsername, password: loginPassword, role: 'specialist', centerId, specialistId, name });
        persistAndRender();
        e.target.reset();
        if (avatarFileInput) avatarFileInput.value = '';
        if (isCenterAdmin) {
          const centerSelect = qi('spec-center');
          if (centerSelect) centerSelect.value = centerIdForRole;
        }
      });
    }
  }

  function renderSpecialists() {
    const grid = qi('specialists-grid'); if (!grid) return;
    grid.innerHTML = '';
    const specialists = specialistsForRole();
    let assigned = 0;
    const focusCounts = new Map();

    specialists.forEach(s => {
      const centerName = db.centers.find(c => c.id === s.centerId)?.name || (s.centerId ? 'Center' : 'Freelance');
      if (s.centerId) assigned += 1;
      const focusKey = (s.skill && s.skill.trim()) ? s.skill.trim() : 'Generalist';
      focusCounts.set(focusKey, (focusCounts.get(focusKey) || 0) + 1);
      const card = el('div', { class: 'specialist-card' });
      const avatarEl = (() => {
        const a = el('div', { class: 'avatar' });
        if (s.avatar) {
          a.style.backgroundImage = `url(${s.avatar})`;
          a.style.backgroundSize = 'cover';
          a.style.backgroundPosition = 'center';
        }
        a.classList.add('avatar-static');
        return a;
      })();
      const loginInfo = normalizeSpecialistLogin(s);
      const deleteBtn = el('button', { class: 'primary ghost' }, "Delete");
      deleteBtn.addEventListener('click', () => {
        if (loginInfo && loginInfo.username) removeUserByUsername(loginInfo.username);
        db.specialists = db.specialists.filter(x => x.id !== s.id);
        db.assessments = db.assessments.filter(a => a.specialistId !== s.id);
        db.children = (db.children || []).map(ch => ch.specialistId === s.id ? { ...ch, specialistId: null } : ch);
        persistAndRender();
      });
      card.append(
        avatarEl,
        el('strong', {}, s.name),
        el('p', {}, s.skill || '—'),
        el('span', { class: 'badge badge-soft' }, centerName)
      );
      if (loginInfo && loginInfo.username) {
        card.append(
          el('div', { class: 'specialist-credentials' },
            el('span', { class: 'badge badge-soft' }, `Login: ${loginInfo.username}`),
            loginInfo.password ? el('span', { class: 'pill' }, loginInfo.password) : null
          )
        );
      }
      if (!isSpecialist) {
        card.append(deleteBtn);
      }
      grid.append(card);
    });

    if (!specialists.length) {
      grid.append(el('div', { class: 'empty-state' }, 'No specialists registered yet. Add your first expert above.'));
    }

    const total = specialists.length;
    const totalEl = qi('specialists-total'); if (totalEl) totalEl.textContent = total;
    const assignedEl = qi('specialists-assigned'); if (assignedEl) assignedEl.textContent = assigned;
    const unassignedEl = qi('specialists-unassigned'); if (unassignedEl) unassignedEl.textContent = Math.max(total - assigned, 0);
    const coverageEl = qi('specialists-coverage'); if (coverageEl) {
      const coverage = total ? Math.round((assigned / total) * 100) : 0;
      coverageEl.textContent = total ? `Center coverage — ${coverage}% (${assigned}/${total})` : 'Center coverage — 0%';
    }

    const focusWrap = qi('specialist-focus-pills');
    if (focusWrap) {
      focusWrap.innerHTML = '';
      if (!focusCounts.size) {
        focusWrap.append(el('span', { class: 'pill small' }, 'No focus areas yet'));
      } else {
        [...focusCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .forEach(([label, count]) => {
            focusWrap.append(el('span', { class: 'pill small' }, `${label} (${count})`));
          });
      }
    }
  }

  /* ---------- Specialists dropdown & toggle card ---------- */
  function initSpecialistsPicker() {
    const sel = qi('specialist-select');
    const details = qi('specialist-details');
    if (!sel || !details) return;

    const centerName = id => (db.centers || []).find(c => c.id === id)?.name || '—';
    const label = s => {
      const n = s.name || s.login?.username || 'Unnamed';
      const t = s.skill || s.role || '';
      return t ? `${n} (${t})` : n;
    };

    function populate(selectedId) {
      const keep = selectedId ?? sel.value;
      sel.innerHTML = '<option value="">Select specialist…</option>';
      (specialistsForRole() || []).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = label(s);
        if (keep && keep === s.id) opt.selected = true;
        sel.appendChild(opt);
      });
    }

    function render(id) {
      if (!id) {
        details.classList.remove('active');
        details.style.display = 'none';
        details.innerHTML = '';
        return;
      }
      const s = (db.specialists || []).find(x => x.id === id);
      if (!s) return;

      const login = normalizeSpecialistLogin(s);
      const loginUser = login?.username || '—';
      const loginPass = login?.password || '—';

      details.style.display = 'block';
      details.classList.add('active');
      details.innerHTML = `
        <div class="card-header" style="padding:12px 16px;">
          <div>
            <h3 style="margin:0">${s.name || loginUser || 'Unnamed'}</h3>
            <p class="hint" style="margin-top:4px">${s.skill || '—'} · Center: ${centerName(s.centerId)}</p>
          </div>
          <div class="card-actions">
            <button id="btn-toggle-spec-creds" class="ghost" aria-expanded="false">Show credentials</button>
          </div>
        </div>
        <div id="spec-creds" class="collapsible" style="padding:12px 16px;">
          <div class="pill">Login: ${loginUser}</div>
          <div class="pill" style="margin-top:6px;">${loginPass}</div>
        </div>
        <div style="padding:0 16px 12px;">
          <button class="ghost" id="btn-back-spec">Back</button>
        </div>
      `;

      const creds = qi('spec-creds');
      const toggleBtn = qi('btn-toggle-spec-creds');
      toggleBtn?.addEventListener('click', () => {
        const open = creds.classList.toggle('active');
        toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggleBtn.textContent = open ? 'Hide credentials' : 'Show credentials';
      });

      qi('btn-back-spec')?.addEventListener('click', () => {
        sel.value = '';
        render(null);
      });
    }

    sel.addEventListener('change', () => render(sel.value || null));
    populate();
    render(null);

    // refresh hook after DB changes
    window.__refreshSpecPicker = () => {
      const cur = sel.value;
      populate(cur);
      render(cur || null);
    };
  }

  // ---------- Modules ----------
  const moduleForm = qi('form-module');
  if (moduleForm && !isSpecialist) {
    moduleForm.addEventListener('submit', e => {
      e.preventDefault();
      const title = qi('mod-title').value.trim();
      const category = qi('mod-category').value.trim();
      const dur = parseInt(qi('mod-duration').value || '0', 10) || null;
      if (!title) return;
      db.modules.push({ id: uid(), title, category, durationMin: dur });
      persistAndRender();
      e.target.reset();
    });
  } else if (moduleForm && isSpecialist) {
    moduleForm.querySelectorAll('input, button').forEach(f => f.disabled = true);
  }

  function renderModules() {
    const modules = modulesForRole();
    const grid = qi('modules-grid'); if (!grid) return;
    grid.innerHTML = '';
    const categoryCounts = new Map();
    const durations = [];

    modules.forEach(m => {
      const card = el('div', { class: 'module-card' },
        el('header', {},
          el('strong', {}, m.title),
          el('span', { class: 'tag' }, m.category || '—')
        ),
        el('div', { class: 'module-meta' },
          el('span', {}, '⏱ ', (m.durationMin ? `${m.durationMin} min` : '—'))
        ),
        !isSpecialist ? (() => {
          const b = el('button', { class: 'primary ghost' }, "Delete");
          b.addEventListener('click', () => {
            db.modules = db.modules.filter(x => x.id !== m.id);
            db.assessments = db.assessments.filter(a => a.moduleId !== m.id);
            persistAndRender();
          });
          return b;
        })() : null
      );
      grid.append(card);

      const cleanCategory = (m.category && m.category.trim()) ? m.category.trim() : 'Uncategorized';
      const catKey = cleanCategory.toLowerCase();
      const existing = categoryCounts.get(catKey);
      if (existing) existing.count += 1;
      else categoryCounts.set(catKey, { label: cleanCategory, count: 1 });
      if (typeof m.durationMin === 'number' && !isNaN(m.durationMin) && m.durationMin > 0) {
        durations.push(m.durationMin);
      }
    });

    if (!modules.length) {
      grid.append(el('div', { class: 'empty-state' }, 'No modules yet. Add immersive content to build your library.'));
    }

    const total = modules.length;
    const totalEl = qi('modules-total'); if (totalEl) totalEl.textContent = total;
    const avgEl = qi('modules-avg-duration'); if (avgEl) {
      avgEl.textContent = durations.length ? `${Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)} min` : '—';
    }
    const catCountEl = qi('modules-category-count'); if (catCountEl) catCountEl.textContent = categoryCounts.size;

    const catWrap = qi('module-category-pills');
    if (catWrap) {
      catWrap.innerHTML = '';
      if (!categoryCounts.size) {
        catWrap.append(el('span', { class: 'pill small' }, 'No categories yet'));
      } else {
        [...categoryCounts.values()]
          .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
          .slice(0, 6)
          .forEach(({ label, count }) => {
            catWrap.append(el('span', { class: 'pill small' }, `${label} (${count})`));
          });
      }
    }
  }

  // ---------- Children ----------
  const childForm = qi('form-child');
  if (childForm) {
    if (isSpecialist || isCenterAdmin || !isCenterAdmin && !isSpecialist) {
      childForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = qi('child-name');
        const ageInput = qi('child-age');
        const specialistSelect = qi('child-specialist');
        const notesInput = qi('child-notes');

        const nameVal = (nameInput?.value || '').trim();
        const ageValue = (ageInput?.value || '').trim();
        const age = ageValue ? Number(ageValue) : null;
        let specialistId = specialistSelect?.value || null;

        if (!nameVal) {
          alert('Please enter a child name.');
          return;
        }

        if (isSpecialist && specialistIdForRole) {
          specialistId = specialistIdForRole;
        }

        const specialist = specialistId ? (db.specialists || []).find(s => s.id === specialistId) : null;
        const centerId = specialist?.centerId || (isCenterAdmin && centerIdForRole ? centerIdForRole : null);

        db.children = db.children || [];
        db.children.push({
          id: uid(),
          name: nameVal,
          age,
          notes: (notesInput?.value || '').trim(),
          specialistId,
          centerId
        });

        persistAndRender();
        childForm.reset();

        if (isSpecialist && specialistIdForRole && specialistSelect) {
          specialistSelect.value = specialistIdForRole;
        }
      });
    }
  }

  function renderChildren() {
    const grid = qi('children-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const children = childrenForRole();
    const assessments = assessmentsForRole();
    const countByChild = new Map();

    (assessments || []).forEach(a => {
      if (a.childId) {
        countByChild.set(a.childId, (countByChild.get(a.childId) || 0) + 1);
      }
    });

    children.forEach(child => {
      const assessCount = countByChild.get(child.id) || 0;
      const specialist = (db.specialists || []).find(s => s.id === child.specialistId) || null;
      const center = (db.centers || []).find(c => c.id === child.centerId) || null;

      const metaRow = el('div', { class: 'module-meta' },
        el('span', {}, `🎯 ${child.age ? `Age ${child.age}` : 'Age not set'}`),
        el('span', {}, `🧑‍⚕️ ${specialist ? specialist.name : 'Unassigned'}`),
        el('span', {}, `📊 ${assessCount} assessment${assessCount === 1 ? '' : 's'}`)
      );

      const blocks = [
        el('header', {},
          el('strong', {}, child.name),
          center ? el('span', { class: 'tag' }, center.name) : null
        ),
        metaRow
      ];

      if (child.notes) {
        blocks.push(el('p', { class: 'hint' }, child.notes));
      }

      const actions = el('div', { class: 'card-actions' });
      if (!isSpecialist || true) {
        const deleteBtn = el('button', { class: 'primary ghost small' }, 'Delete');
        deleteBtn.addEventListener('click', () => {
          if (!confirm('Remove this child? Existing assessments will stay, but will no longer be linked.')) return;
          db.children = (db.children || []).filter(ch => ch.id !== child.id);
          db.assessments = (db.assessments || []).map(a => a.childId === child.id ? { ...a, childId: null } : a);
          persistAndRender();
        });
        actions.append(deleteBtn);
      }
      blocks.push(actions);

      const card = el('div', { class: 'module-card' }, ...blocks);
      grid.append(card);
    });

    if (!children.length) {
      const message = isSpecialist
        ? 'No children yet. Add a child above to start tracking progress.'
        : 'No children found. Add a child to link assessments to individual learners.';
      grid.append(el('div', { class: 'empty-state' }, message));
    }

    const totalEl = qi('children-total');
    if (totalEl) totalEl.textContent = String(children.length);

    const withAssessmentsEl = qi('children-with-assessments');
    if (withAssessmentsEl) {
      const withAssessments = children.filter(ch => countByChild.get(ch.id)).length;
      withAssessmentsEl.textContent = String(withAssessments);
    }

    const avgEl = qi('children-avg-assessments');
    if (avgEl) {
      const totalAssessments = [...countByChild.values()].reduce((a, b) => a + b, 0);
      avgEl.textContent = children.length ? (totalAssessments / children.length).toFixed(1) : '—';
    }
  }

  // ---------- Assessments ----------
  const assessmentForm = qi('form-assessment');
  const assessmentFormPanel = assessmentForm?.closest('.form-panel');
  if (assessmentFormPanel) {
    // main admin & specialist can log; center admin = view-only
    assessmentFormPanel.classList.toggle('hidden', false);
  }

  function handleAssessmentSubmit(e) {
    e.preventDefault();
    const childId = qi('ass-child')?.value || '';
    const moduleId = qi('ass-module')?.value || '';
    let specialistId = qi('ass-specialist')?.value || '';
    const score = Number(qi('ass-score')?.value || '0');
    const date = qi('ass-date')?.value || new Date().toISOString().slice(0, 10);

    if (isSpecialist && specialistIdForRole) {
      specialistId = specialistIdForRole;
    }

    if (!childId || !moduleId || !specialistId || Number.isNaN(score)) {
      alert('Please choose a child, module, specialist, and enter a valid score.');
      return;
    }

    if (isCenterAdmin) {
      const allowed = new Set(specialistsForRole().map(s => s.id));
      if (!allowed.has(specialistId)) {
        alert('You can only log assessments for specialists at your center.');
        return;
      }
    }

    const child = (db.children || []).find(ch => ch.id === childId) || null;
    const traineeName = child?.name || 'Unnamed child';

    db.assessments.push({
      id: uid(),
      trainee: traineeName,
      childId,
      moduleId,
      specialistId,
      score,
      date
    });

    persistAndRender();
    e.target.reset();
  }

  if (assessmentForm) {
    if (isCenterAdmin) {
      // view-only for center admin
      assessmentForm.addEventListener('submit', e => e.preventDefault());
      assessmentForm.querySelectorAll('input, select, button').forEach(field => {
        field.disabled = true;
      });
      const submitBtn = assessmentForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = 'Viewing only';
    } else {
      assessmentForm.addEventListener('submit', handleAssessmentSubmit);
    }
  }

  function renderAssessments() {
    const list = qi('assessments-list');
    if (!list) return;
    list.innerHTML = '';
    const assessments = assessmentsForRole();
    const scoreValues = [];
    const moduleHitMap = new Map();
    let latestDate = '';
    const formatDate = (value) => {
      if (!value) return '—';
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return value;
      return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    assessments.forEach(a => {
      const m = db.modules.find(x => x.id === a.moduleId);
      const s = db.specialists.find(x => x.id === a.specialistId);
      if (!isNaN(a.score)) scoreValues.push(a.score);
      if (a.date) {
        if (!latestDate || a.date > latestDate) latestDate = a.date;
      }
      if (a.moduleId) {
        moduleHitMap.set(a.moduleId, (moduleHitMap.get(a.moduleId) || 0) + 1);
      }
      const rowChildren = [
        el('div', {}, '👤'),
        el('div', {},
          el('strong', {}, a.trainee),
          el('div', { class: 'hint' }, (m ? m.title : '—') + ' • ' + (s ? s.name : '—')),
          el('div', {},
            el('span', { class: 'pill' }, 'Score: ' + (isNaN(a.score) ? '—' : `${a.score}%`)), ' ',
            el('span', { class: 'pill' }, formatDate(a.date))
          )
        )
      ];
      if (!isCenterAdmin) {
        rowChildren.push((() => {
          const b = el('button', { class: 'primary ghost' }, "Delete");
          b.addEventListener('click', () => {
            db.assessments = db.assessments.filter(x => x.id !== a.id);
            persistAndRender();
          });
          return b;
        })());
      }
      list.append(el('div', { class: 'recommendation' }, ...rowChildren));
    });

    if (!assessments.length) {
      const message = isCenterAdmin
        ? 'No assessments recorded for your center yet.'
        : isSpecialist
          ? 'No assessments logged yet. Start by adding a child and logging their first session.'
          : 'No assessments logged yet. Capture the first outcome above.';
      list.append(el('div', { class: 'empty-state' }, message));
    }

    const total = assessments.length;
    const totalEl = qi('assessments-total'); if (totalEl) totalEl.textContent = total;
    const avgEl = qi('assessments-average'); if (avgEl) {
      avgEl.textContent = scoreValues.length ? `${Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)}%` : '—';
    }
    const lastEl = qi('assessments-last-date'); if (lastEl) lastEl.textContent = formatDate(latestDate);
    const topModuleEl = qi('assessments-top-module');
    if (topModuleEl) {
      if (!moduleHitMap.size) {
        topModuleEl.textContent = '—';
      } else {
        const [moduleId] = [...moduleHitMap.entries()].sort((a, b) => b[1] - a[1])[0];
        const moduleName = db.modules.find(m => m.id === moduleId)?.title || '—';
        topModuleEl.textContent = moduleName;
      }
    }
  }

  function renderCenterOverview() {
    const networkOverview = qi('network-overview');
    const centerOverview = qi('center-overview');
    if (!networkOverview || !centerOverview) return;
    if (!isCenterAdmin) {
      centerOverview.classList.add('hidden');
      networkOverview.classList.remove('hidden');
      return;
    }

    networkOverview.classList.add('hidden');
    centerOverview.classList.remove('hidden');

    const center = centersForRole()[0] || null;
    const nameEl = qi('center-overview-name');
    const locationEl = qi('center-overview-location');
    const descEl = qi('center-overview-desc');
    const tagsWrap = qi('center-overview-tags');
    const specialistsCountEl = qi('center-overview-specialists');
    const assessmentsCountEl = qi('center-overview-assessments');
    const avgEl = qi('center-overview-average');
    const recentList = qi('center-overview-recent');

    if (tagsWrap) tagsWrap.innerHTML = '';
    const fallbackMessage = !center ? 'No center assigned yet. Reach out to the main admin to connect your account.' : '';

    if (!center) {
      if (nameEl) nameEl.textContent = 'Center not assigned';
      if (locationEl) locationEl.textContent = 'Assignment pending';
      if (descEl) descEl.textContent = fallbackMessage;
      if (tagsWrap) tagsWrap.append(el('span', { class: 'pill small' }, 'Awaiting assignment'));
      if (specialistsCountEl) specialistsCountEl.textContent = '0';
      if (assessmentsCountEl) assessmentsCountEl.textContent = '0';
      if (avgEl) avgEl.textContent = '—';
      if (recentList) {
        recentList.innerHTML = '';
        recentList.append(el('div', { class: 'empty-state' }, fallbackMessage || 'No activity yet.'));
      }
      return;
    }

    if (nameEl) nameEl.textContent = center.name || 'Unnamed center';
    if (locationEl) locationEl.textContent = center.location ? `📍 ${center.location}` : 'Location not provided';
    if (descEl) descEl.textContent = center.desc || 'Add a description so your specialists stay aligned.';

    const tags = Array.isArray(center.tags)
      ? center.tags
      : (typeof center.tags === 'string'
        ? center.tags.split(',').map(t => t.trim()).filter(Boolean)
        : []);
    if (tagsWrap) {
      if (tags.length) {
        tags.forEach(tag => tagsWrap.append(el('span', { class: 'pill small' }, tag)));
      } else {
        tagsWrap.append(el('span', { class: 'pill small' }, 'Capabilities pending'));
      }
    }

    const specialists = specialistsForRole();
    if (specialistsCountEl) specialistsCountEl.textContent = specialists.length;

    const centerAssessments = assessmentsForRole().slice().sort((a, b) => {
      const aDate = a.date || '';
      const bDate = b.date || '';
      if (aDate && bDate) return bDate.localeCompare(aDate);
      if (aDate) return -1;
      if (bDate) return 1;
      return 0;
    });
    if (assessmentsCountEl) assessmentsCountEl.textContent = centerAssessments.length;

    const numericScores = centerAssessments
      .map(item => toNumber(item.score))
      .filter(value => value !== null);
    if (avgEl) avgEl.textContent = numericScores.length ? `${Math.round(numericScores.reduce((a, b) => a + b, 0) / numericScores.length)}%` : '—';

    const formatDate = (value) => {
      if (!value) return '—';
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return value;
      return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (recentList) {
      recentList.innerHTML = '';
      if (!centerAssessments.length) {
        recentList.append(el('div', { class: 'empty-state' }, 'No assessments recorded yet. Logs will appear here once your team submits them.'));
      } else {
        centerAssessments.slice(0, 4).forEach(entry => {
          const module = db.modules.find(x => x.id === entry.moduleId);
          const specialist = db.specialists.find(x => x.id === entry.specialistId);
          const scoreValue = toNumber(entry.score);
          recentList.append(
            el('div', { class: 'recommendation' },
              el('div', {}, '🗓'),
              el('div', {},
                el('strong', {}, entry.trainee),
                el('div', { class: 'hint' }, `${module ? module.title : '—'} • ${specialist ? specialist.name : '—'}`),
                el('div', {},
                  el('span', { class: 'pill' }, `Score: ${scoreValue === null ? '—' : `${scoreValue}%`}`),
                  ' ',
                  el('span', { class: 'pill' }, formatDate(entry.date))
                )
              )
            )
          );
        });
      }
    }
  }

  // selectors + stats
  function refreshSelectors() {
    const centerSelect = qi('spec-center');
    if (centerSelect) {
      const centers = centersForRole();
      centerSelect.innerHTML = `<option value="">— No center —</option>` +
        centers.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
      if (isCenterAdmin && centerIdForRole) {
        centerSelect.value = centerIdForRole || '';
        centerSelect.disabled = true;
        centerSelect.classList.add('readonly');
        centerSelect.closest('.input-group')?.classList.add('readonly');
      } else {
        centerSelect.disabled = false;
        centerSelect.classList.remove('readonly');
        centerSelect.closest('.input-group')?.classList.remove('readonly');
      }
    }

    const moduleSelect = qi('ass-module');
    if (moduleSelect) {
      const modules = modulesForRole();
      moduleSelect.innerHTML = modules.length
        ? modules.map(m => `<option value="${m.id}">${esc(m.title)}</option>`).join('')
        : '<option value="">No modules available</option>';
      moduleSelect.disabled = !modules.length;
    }

    const specialistSelect = qi('ass-specialist');
    if (specialistSelect) {
      const specialists = specialistsForRole();
      specialistSelect.innerHTML = specialists.length
        ? specialists.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')
        : '<option value="">No specialists</option>';
      specialistSelect.disabled = !specialists.length;
      if (isSpecialist && specialists.length === 1) {
        specialistSelect.value = specialists[0].id;
        specialistSelect.disabled = true;
        specialistSelect.closest('.input-group')?.classList.add('readonly');
      } else {
        specialistSelect.closest('.input-group')?.classList.remove('readonly');
      }
    }

    const childSpecSelect = qi('child-specialist');
    if (childSpecSelect) {
      const specialists = specialistsForRole();
      if (isSpecialist && specialists.length === 1) {
        childSpecSelect.innerHTML = `<option value="${specialists[0].id}">${esc(specialists[0].name)}</option>`;
        childSpecSelect.value = specialists[0].id;
        childSpecSelect.disabled = true;
        childSpecSelect.closest('.input-group')?.classList.add('readonly');
      } else {
        childSpecSelect.innerHTML = specialists.length
          ? specialists.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')
          : '<option value="">No specialists</option>';
        childSpecSelect.disabled = !specialists.length;
        if (!specialists.length) {
          childSpecSelect.closest('.input-group')?.classList.add('readonly');
        } else {
          childSpecSelect.closest('.input-group')?.classList.remove('readonly');
        }
      }
    }

    const childSelect = qi('ass-child');
    if (childSelect) {
      const children = childrenForRole();
      childSelect.innerHTML = children.length
        ? children.map(ch => `<option value="${ch.id}">${esc(ch.name)}</option>`).join('')
        : '<option value="">No children</option>';
      childSelect.disabled = !children.length;
    }
  }

  function refreshStats() {
    const centers = centersForRole();
    const specialists = specialistsForRole();
    const modules = modulesForRole();
    const assessments = assessmentsForRole();
    qi('stat-centers') && (qi('stat-centers').textContent = centers.length);
    qi('stat-specialists') && (qi('stat-specialists').textContent = specialists.length);
    qi('stat-modules') && (qi('stat-modules').textContent = modules.length);
    qi('stat-assessments') && (qi('stat-assessments').textContent = assessments.length);
  }

  function renderAll() {
    renderCenters();
    renderSpecialists();
    renderModules();
    renderAssessments();
    renderChildren();
    renderCenterOverview();
    refreshSelectors();
    refreshStats();
  }

function persistAndRender() {
  syncUsersWithEntities();

  const persisted = saveData(db);
  if (!persisted && !storageWarningShown) {
    storageWarningShown = true;
    alert(
      `Changes couldn't be saved locally because your browser storage is full. ` +
      `Remove a large image or choose a smaller PNG or JPG (under ${IMAGE_SIZE_LIMIT_LABEL}).`
    );
  }

  // Also push a copy of the DB to Google Sheets (fire-and-forget)
  remoteSave(db);

  renderAll();
  window.__refreshSpecPicker?.();
}


  // init picker + initial render (local data first)
  initSpecialistsPicker();
  renderAll();

  // Then try to load the latest snapshot from Google Sheets and override
  if (typeof fetch === 'function') {
    remoteLoad().then(remote => {
      if (!remote || remote.version !== STORAGE_VERSION) return;

      // Merge remote into current db
      db.users = remote.users || db.users;
      db.centers = remote.centers || db.centers;
      db.specialists = remote.specialists || db.specialists;
      db.children = remote.children || db.children;
      db.modules = remote.modules || db.modules;
      db.assessments = remote.assessments || db.assessments;

      // Re-sync users and re-render with the remote data
      persistAndRender();
    });
  }
}


