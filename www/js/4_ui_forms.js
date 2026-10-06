/* --- js/4_ui_forms.js --- */
DiscomApp.UI.toggleAuthMode = function() { 
    authMode = authMode === 'login' ? 'signup' : 'login'; 
    document.getElementById('loginBtn').style.display = authMode === 'login' ? 'inline-block' : 'none'; 
    document.getElementById('signupBtn').style.display = authMode === 'signup' ? 'inline-block' : 'none'; 
    document.getElementById('authName').style.display = authMode === 'signup' ? 'block' : 'none'; 
    document.getElementById('authToggleText').innerText = authMode === 'login' ? "Need an account? Sign Up" : "Already have an account? Login"; 
};

DiscomApp.UI.applyAuthUIVisuals = function() { 
    document.getElementById('auth-screen').style.display = 'none'; 
    document.getElementById('app-container').style.display = 'flex'; 
    setTimeout(() => { if(map) map.invalidateSize(); }, 100); 
    const uName = document.getElementById('userNameDisplay');
    if(uName) uName.innerText = DiscomApp.State.user.name || 'Admin User'; 
};

DiscomApp.UI.updateFeederDropdown = function() { 
    const header = document.getElementById('activeFeederLabel'); if(!header) return; 
    const keys = Object.keys(DiscomApp.State.feeders || {}); 
    if(keys.length === 0) { header.innerText = 'No Feeder'; DiscomApp.State.currentFeederCode = null; } 
    else { 
        if(!DiscomApp.State.currentFeederCode || !DiscomApp.State.feeders[DiscomApp.State.currentFeederCode]) DiscomApp.State.currentFeederCode = keys[0]; 
        const currentFeeder = DiscomApp.State.feeders[DiscomApp.State.currentFeederCode]; 
        header.innerText = (currentFeeder && currentFeeder.feeder && currentFeeder.feeder.name) ? currentFeeder.feeder.name : 'Unnamed Feeder'; 
    } 
};

DiscomApp.UI.checkOnboardingFlow = function() {
    if(isSetupModalOpen) return;
    if(Object.keys(DiscomApp.State.gssNodes || {}).length === 0) { 
        document.getElementById('onboarding-overlay').style.display = 'flex'; 
        document.getElementById('onboarding-title').innerText = "Network Setup Required"; 
        document.getElementById('onboarding-desc').innerText = "Please add your first GSS to begin mapping."; 
        document.getElementById('onboarding-btn').onclick = function() { document.getElementById('onboarding-overlay').style.display = 'none'; isSetupModalOpen = true; DiscomApp.UI.openAddGssModal(); }; 
    } 
    else if (Object.keys(DiscomApp.State.feeders || {}).length === 0) { 
        document.getElementById('onboarding-overlay').style.display = 'flex'; 
        document.getElementById('onboarding-title').innerText = "Create Feeder"; 
        document.getElementById('onboarding-desc').innerText = "You must create a Feeder linked to your GSS to continue."; 
        document.getElementById('onboarding-btn').onclick = function() { document.getElementById('onboarding-overlay').style.display = 'none'; isSetupModalOpen = true; DiscomApp.UI.openFeederConfigModal(); }; 
    } 
    else { document.getElementById('onboarding-overlay').style.display = 'none'; }
};

DiscomApp.UI.applyTranslations = function() {
    const lang = DiscomApp.State.settings.language || 'en';
    document.querySelectorAll('[data-i18n]').forEach(el => { 
        const key = el.getAttribute('data-i18n'); 
        if(i18n[lang] && i18n[lang][key]) { if(el.tagName === 'INPUT' && el.type === 'text') el.placeholder = i18n[lang][key]; else el.innerHTML = i18n[lang][key]; } 
    });
    const t = i18n[lang];
    if(document.getElementById('kpi11Label')) document.getElementById('kpi11Label').innerText = t.kpi11; if(document.getElementById('kpiLTLabel')) document.getElementById('kpiLTLabel').innerText = t.kpiLT;
    if(document.getElementById('kpi3PhLabel')) document.getElementById('kpi3PhLabel').innerText = t.kpi3Ph; if(document.getElementById('kpi1PhLabel')) document.getElementById('kpi1PhLabel').innerText = t.kpi1Ph;
    if(document.getElementById('kpiConsLabel')) document.getElementById('kpiConsLabel').innerText = t.kpiCons; if(document.getElementById('appSearchBar')) document.getElementById('appSearchBar').placeholder = t.searchPla;
};

DiscomApp.UI.applyTheme = function() { if(DiscomApp.State.settings.theme === 'dark') document.body.classList.add('dark-mode'); else document.body.classList.remove('dark-mode'); };
DiscomApp.UI.showToast = function(msg) { const toast = document.getElementById('app-toast'), msgElem = document.getElementById('toast-msg'); if (!toast || !msgElem) return; msgElem.innerText = msg; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3500); };

DiscomApp.UI.openModal = function(html) { document.getElementById('modalSheetContent').innerHTML = html; document.getElementById('formModalOverlay').classList.add('open'); tempPhotoUrl = null; };
DiscomApp.UI.closeModal = function() { document.getElementById('formModalOverlay').classList.remove('open'); const distInd = document.getElementById('live-distance-indicator'); if(distInd) distInd.style.display='none'; if(DiscomApp.State.user.isLoggedIn) { setTimeout(() => { if(typeof DiscomApp.UI.checkOnboardingFlow === 'function') DiscomApp.UI.checkOnboardingFlow(); }, 400); } };

DiscomApp.UI.isSavingData = false; 
DiscomApp.UI.executeSafeSave = function(actionFn) {
    if(DiscomApp.UI.isSavingData) return; DiscomApp.UI.isSavingData = true; let hasError = false; const origAlert = window.alert; 
    window.alert = function(msg) { hasError = true; origAlert(msg); };
    try { const result = actionFn(); if(result === false) hasError = true; } catch(e) { hasError = true; console.error("Save Error:", e); }
    window.alert = origAlert; 
    if(!hasError) {
        DiscomApp.UI.closeModal(); 
        try { if(DiscomApp.Map.renderEntireNetwork) DiscomApp.Map.renderEntireNetwork(); } catch(e){ console.error(e); }
        try { if(DiscomApp.DB.triggerPersistence) DiscomApp.DB.triggerPersistence(); } catch(e){ console.error(e); }
    }
    setTimeout(() => { DiscomApp.UI.isSavingData = false; }, 800); 
};

DiscomApp.UI.toggleSpeedDial = function(e) { if(e) { e.preventDefault(); e.stopPropagation(); } const dial = document.getElementById('speed-dial-menu'), fab = document.getElementById('mainFabBtn'); if (!dial || !fab) return; const isOpen = !dial.classList.contains('active'); dial.classList.toggle('active', isOpen); fab.classList.toggle('open', isOpen); };
document.addEventListener('click', function(e) { const dial = document.getElementById('speed-dial-menu'), fab = document.getElementById('mainFabBtn'); if (dial && dial.classList.contains('active')) { if (!dial.contains(e.target) && !fab.contains(e.target)) { dial.classList.remove('active'); fab.classList.remove('open'); } } });

DiscomApp.UI.toggleSidebar = function(open) { document.getElementById('sidebar-drawer').classList.toggle('open', open); document.getElementById('sidebarBackdrop').classList.toggle('open', open); if(open) { DiscomApp.UI.renderGssSidebarList(); DiscomApp.UI.renderFeederSidebarList(); } };
DiscomApp.UI.toggleGssFolder = function() { const content = document.getElementById('gssFolderContent'), icon = document.getElementById('gssFolderIcon'); if (!content) return; const isHidden = content.style.display === 'none'; content.style.display = isHidden ? 'block' : 'none'; if(icon) icon.className = isHidden ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'; if (isHidden) DiscomApp.UI.renderGssSidebarList(); };
DiscomApp.UI.toggleFeederFolder = function() { const content = document.getElementById('feederFolderContent'), icon = document.getElementById('feederFolderIcon'); if (!content) return; const isHidden = content.style.display === 'none'; content.style.display = isHidden ? 'block' : 'none'; if(icon) icon.className = isHidden ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'; if (isHidden) DiscomApp.UI.renderFeederSidebarList(); };

DiscomApp.UI.renderGssSidebarList = function() { const container = document.getElementById('gssListContainer'); if (!container) return; let html = ''; Object.values(DiscomApp.State.gssNodes || {}).forEach(gss => { html += `<div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-glass); padding:8px; border-radius:6px; margin-top:6px; border:1px solid var(--border);"><div><b style="font-size:0.85rem;">${gss.name}</b><br><small style="color:var(--text-sub);">Code: ${gss.code}</small></div><div style="display:flex; gap:4px;"><button class="action-btn-sm bg" onclick="DiscomApp.CRUD.relocateGss('${gss.code}')"><i class="fa-solid fa-location-crosshairs"></i></button><button class="action-btn-sm bg" style="color:#ef4444;" onclick="DiscomApp.CRUD.deleteGssAndFeederStrict('${gss.code}')"><i class="fa-solid fa-trash"></i></button></div></div>`; }); container.innerHTML = html; };
DiscomApp.UI.renderFeederSidebarList = function() { const container = document.getElementById('feederListContainer'); if (!container) return; let html = ''; Object.keys(DiscomApp.State.feeders || {}).forEach(fCode => { const f = DiscomApp.State.feeders[fCode].feeder; const isActive = DiscomApp.State.currentFeederCode === fCode; const bgClass = isActive ? 'background:rgba(37,99,235,0.1); border-left:4px solid var(--accent);' : 'background:var(--bg-glass); border:1px solid var(--border);'; html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-radius:6px; margin-top:6px; ${bgClass}" onclick="DiscomApp.State.switchFeeder('${fCode}')"><div style="cursor:pointer; width: 100%;"><b style="font-size:0.85rem; color:var(--text-main);">${f.name}</b><br><small style="color:var(--text-sub);">GSS: ${f.parentGss}</small></div><div style="display:flex; gap:4px;"><button class="action-btn-sm bg" onclick="event.stopPropagation(); DiscomApp.UI.openEditFeederModal('${fCode}')"><i class="fa-solid fa-pen"></i></button><button class="action-btn-sm bg" style="color:#ef4444;" onclick="event.stopPropagation(); DiscomApp.CRUD.deleteFeederStrict('${fCode}')"><i class="fa-solid fa-trash"></i></button></div></div>`; }); container.innerHTML = html; };

// FIX: ADD GSS/FEEDER Forms Ab SafeSave ko force nahi karengi immediately
DiscomApp.UI.openFeederConfigModal = function() { DiscomApp.UI.toggleSidebar(false); const gssOpts = Object.values(DiscomApp.State.gssNodes || {}).map(g => `<option value="${g.code}">${g.name}</option>`).join(''); DiscomApp.UI.openModal(`<div class="sheet-head"><div class="sheet-title">Add Feeder</div><button class="sheet-close-btn" onclick="DiscomApp.UI.closeModal()"><i class="fa-solid fa-xmark"></i></button></div><div class="form-row"><select id="inpFeederGss" class="form-select">${gssOpts}</select><label>Select GSS*</label></div><div class="form-row"><input type="text" id="inpFeederCode" class="form-input" placeholder=" "><label>Feeder Code*</label></div><div class="form-row"><input type="text" id="inpFeederName" class="form-input" placeholder=" "><label>Feeder Name*</label></div><button class="btn-action-primary" onclick="DiscomApp.CRUD.saveNewFeeder()">Save Feeder</button>`); };
DiscomApp.UI.openEditFeederModal = function(code) { DiscomApp.UI.toggleSidebar(false); DiscomApp.UI.openModal(`<div class="sheet-head"><div class="sheet-title">Edit Feeder Name</div><button class="sheet-close-btn" onclick="DiscomApp.UI.closeModal()"><i class="fa-solid fa-xmark"></i></button></div><div class="form-row"><input type="text" class="form-input" value="${code}" disabled placeholder=" "><label>Feeder Code (Locked)</label></div><div class="form-row"><input type="text" id="editFeederName" class="form-input" placeholder=" " value="${DiscomApp.State.feeders[code].feeder.name}"><label>New Name*</label></div><button class="btn-action-primary" onclick="DiscomApp.CRUD.saveEditedFeeder('${code}')">Save Changes</button>`); };
DiscomApp.UI.openAddGssModal = function() { DiscomApp.UI.toggleSidebar(false); DiscomApp.UI.openModal(`<div class="sheet-head"><div class="sheet-title"><i class="fa-solid fa-plus-circle"></i> Add New GSS</div><button class="sheet-close-btn" onclick="DiscomApp.UI.closeModal()"><i class="fa-solid fa-xmark"></i></button></div><div class="form-row"><input type="text" id="inpGssCode" class="form-input" placeholder=" "><label>GSS Code*</label></div><div class="form-row"><input type="text" id="inpGssName" class="form-input" placeholder=" "><label>GSS Name*</label></div><button class="btn-action-primary" onclick="DiscomApp.CRUD.saveNewGss()">Save GSS</button>`); };

// FIX: AutoSaveSettings Ab Turant clustering refresh karega
DiscomApp.UI.autoSaveSettings = function() { 
    DiscomApp.State.settings.unit = document.getElementById('setUnit').value; 
    DiscomApp.State.settings.language = document.getElementById('setLanguage').value; 
    DiscomApp.State.settings.theme = document.getElementById('setTheme').value; 
    DiscomApp.State.settings.liveSync = document.getElementById('setLiveSync').checked; 
    DiscomApp.State.settings.markerCluster = document.getElementById('setMarkerCluster').checked; 
    
    DiscomApp.UI.applyTranslations(); 
    DiscomApp.UI.applyTheme(); 
    DiscomApp.DB.triggerPersistence(); 
    
    // Refresh layers entirely to apply/remove clustering instantly
    DiscomApp.Map.setupFeatureGroups();
    DiscomApp.Map.renderEntireNetwork(); 
    
    DiscomApp.UI.showToast("Settings Saved!"); 
};

DiscomApp.UI.openSettingsPage = function() { 
    DiscomApp.UI.toggleSidebar(false); 
    if(document.getElementById('setUnit')) document.getElementById('setUnit').value = DiscomApp.State.settings.unit || 'm'; 
    if(document.getElementById('setLanguage')) document.getElementById('setLanguage').value = DiscomApp.State.settings.language || 'en'; 
    if(document.getElementById('setTheme')) document.getElementById('setTheme').value = DiscomApp.State.settings.theme || 'light'; 
    if(document.getElementById('setLiveSync')) document.getElementById('setLiveSync').checked = DiscomApp.State.settings.liveSync !== false; 
    if(document.getElementById('setMarkerCluster')) document.getElementById('setMarkerCluster').checked = DiscomApp.State.settings.markerCluster !== false; 
    const sp = document.getElementById('settings-page'); if(sp) sp.classList.add('open'); 
};
DiscomApp.UI.closeSettingsPage = function() { document.getElementById('settings-page').classList.remove('open'); };

DiscomApp.UI.openAboutModal = function() { DiscomApp.UI.toggleSidebar(false); DiscomApp.UI.openModal(`<div class="sheet-head"><div class="sheet-title"><i class="fa-solid fa-circle-info" style="color:#3b82f6;"></i> About App</div><button class="sheet-close-btn" onclick="DiscomApp.UI.closeModal()"><i class="fa-solid fa-xmark"></i></button></div><div style="text-align: center; padding: 10px 0 20px 0;"><div style="width: 64px; height: 64px; background: var(--accent); color: white; font-size: 32px; border-radius: 16px; display: flex; align-items:center; justify-content:center; margin: 0 auto 15px auto;"><i class="fa-solid fa-bolt"></i></div><h3 style="font-size: 1.2rem; font-weight: 900; color: var(--text-main);">DISCOM Survey Pro</h3></div>`); };
DiscomApp.UI.openFilterModal = function() { const f = DiscomApp.State.filters; DiscomApp.UI.openModal(`<div class="sheet-head"><div class="sheet-title"><i class="fa-solid fa-filter" style="color:#d97706;"></i> Object Filter</div><button class="sheet-close-btn" onclick="DiscomApp.UI.closeModal()"><i class="fa-solid fa-xmark"></i></button></div><div class="capsule-filter-group"><label class="capsule"><input type="checkbox" id="flt11" ${f.lines11?'checked':''}><span>11 KV Line</span></label><label class="capsule"><input type="checkbox" id="fltLT" ${f.linesLT?'checked':''}><span>LT Line</span></label><label class="capsule"><input type="checkbox" id="fltPoles" ${f.poles?'checked':''}><span>Poles</span></label><label class="capsule"><input type="checkbox" id="fltDTs" ${f.dts?'checked':''}><span>DT</span></label><label class="capsule"><input type="checkbox" id="fltCons" ${f.consumers?'checked':''}><span>Consumers</span></label></div><button class="btn-action-primary" onclick="DiscomApp.UI.saveFilters()" style="margin-top:20px;">Apply Filters</button>`); };
DiscomApp.UI.saveFilters = function() { DiscomApp.State.filters.lines11 = document.getElementById('flt11').checked; DiscomApp.State.filters.linesLT = document.getElementById('fltLT').checked; DiscomApp.State.filters.poles = document.getElementById('fltPoles').checked; DiscomApp.State.filters.dts = document.getElementById('fltDTs').checked; DiscomApp.State.filters.consumers = document.getElementById('fltCons').checked; DiscomApp.UI.closeModal(); DiscomApp.Map.renderEntireNetwork(); DiscomApp.UI.showToast("Filters Updated"); };

DiscomApp.UI.toggleSearchBox = function() { let box = document.getElementById('searchBoxOverlay'); if(!box) { box = document.createElement('div'); box.id = 'searchBoxOverlay'; box.style.cssText = 'position:absolute; top:65px; left:12px; right:12px; z-index:9000; background:var(--bg-glass); backdrop-filter:blur(10px); padding:10px; border-radius:12px; box-shadow:var(--shadow-md); display:flex; flex-direction:column; gap:10px; border:1px solid var(--border);'; box.innerHTML = `<div style="display:flex; gap:10px; align-items:center;"><input type="text" id="appSearchBar" class="search-input-full" placeholder="Search Consumer, DT, Pole..." onkeyup="DiscomApp.UI.handleSearch(event)"><button class="action-btn-sm" onclick="DiscomApp.UI.toggleSearchBox()"><i class="fa-solid fa-times"></i></button></div><div id="searchSuggestions" class="suggestions-panel" style="position:relative; box-shadow:none; border:none; top:0;"></div>`; document.getElementById('app-container').appendChild(box); } else { box.style.display = box.style.display === 'none' ? 'flex' : 'none'; if(box.style.display === 'none') DiscomApp.UI.clearSearch(); } if(box.style.display === 'flex') { document.getElementById('appSearchBar').focus(); } };
DiscomApp.UI.handleSearch = function(e) { const query = e.target.value.toLowerCase().trim(), suggPanel = document.getElementById('searchSuggestions'); if(query.length === 0) { suggPanel.classList.remove('active'); return; } const net = DiscomApp.State.getActiveNetwork(); if(!net) return; let results = []; (net.consumers||[]).forEach(c => { if (String(c.kno).toLowerCase().includes(query) || (c.name && c.name.toLowerCase().includes(query))) results.push({ type: 'CONSUMER', id: c.id, title: c.name, desc: `K-No: ${c.kno} | Connected to: ${c.parentRef}` }); }); (net.dts||[]).forEach(d => { if (String(d.code).toLowerCase().includes(query) || String(d.rating).includes(query)) results.push({ type: 'DT', id: d.id, title: `DT Code: ${d.code}`, desc: `Rating: ${d.rating} kVA` }); }); (net.poles||[]).forEach(p => { if (String(p.poleNo).toLowerCase().includes(query)) results.push({ type: 'POLE', id: p.id, title: `Pole: ${p.poleNo}`, desc: `Type: ${p.lineType}` }); }); if (results.length > 0) { suggPanel.innerHTML = results.slice(0, 15).map(r => `<div class="suggestion-item" onclick="DiscomApp.UI.selectSearchResult('${r.type}', '${r.id}')"><div class="sugg-title"><span style="color:var(--accent); font-weight:800;">${r.title}</span></div><div class="sugg-desc" style="font-size:0.75rem; color:var(--text-sub); margin-top:2px;">${r.desc}</div></div>`).join(''); suggPanel.classList.add('active'); } else { suggPanel.innerHTML = `<div style="padding:10px 12px; font-size:0.8rem; color:#64748b;">No results found</div>`; suggPanel.classList.add('active'); } };
DiscomApp.UI.clearSearch = function() { const bar = document.getElementById('appSearchBar'); if(bar) bar.value = ''; const sugg = document.getElementById('searchSuggestions'); if(sugg) sugg.classList.remove('active'); };
DiscomApp.UI.selectSearchResult = function(type, id) { const net = DiscomApp.State.getActiveNetwork(); if(!net) return; DiscomApp.UI.clearSearch(); DiscomApp.UI.toggleSearchBox(); let target = null, popupHtml = ''; if(type === 'CONSUMER') { target = net.consumers.find(c => c.id === id); if(target) popupHtml = `K-No: <b>${target.kno}</b>`; } else if(type === 'DT') { target = net.dts.find(d => d.id === id); if(target) popupHtml = `Rating: <b>${target.rating} kVA</b>`; } else if(type === 'POLE') { target = net.poles.find(p => p.id === id); if(target) popupHtml = `Type: <b>${target.lineType}</b>`; } if(target && target.lat) { if(map) map.flyTo([target.lat, target.lng], 19, { duration: 1 }); setTimeout(() => DiscomApp.UI.openObjectSheet(type, id, type === 'CONSUMER' ? target.name : (type === 'DT' ? `DT: ${target.code}` : `Pole: ${target.poleNo}`), popupHtml), 1000); } };
DiscomApp.UI.closeObjectSheet = function() { document.getElementById('object-bottom-sheet').classList.remove('open'); currentSelectedObj = null; };

DiscomApp.UI.openObjectSheet = function(type, id, title, detailsHtml) {
    currentSelectedObj = { type, id }; document.getElementById('objSheetTitle').innerText = title; document.getElementById('objSheetDetails').innerHTML = detailsHtml;
    const imgEl = document.getElementById('objPhotoImg'), placeholderEl = document.getElementById('objPhotoPlaceholder');
    const applyPhoto = (url) => { if(url) { imgEl.src = url; imgEl.style.display = 'block'; placeholderEl.style.display = 'none'; } else { imgEl.style.display = 'none'; imgEl.src = ''; placeholderEl.style.display = 'flex'; } };
    const photoUrlPromise = DiscomApp.DB.getPhotoUrl(id); if(photoUrlPromise instanceof Promise) { applyPhoto(null); photoUrlPromise.then(applyPhoto); } else applyPhoto(photoUrlPromise);
    document.getElementById('object-bottom-sheet').classList.add('open'); 
    document.getElementById('btnObjEdit').onclick = () => DiscomApp.UI.openEditModal(type.toLowerCase(), id);
    document.getElementById('btnObjDelete').style.display = (type === 'GSS') ? 'none' : 'block'; 
    document.getElementById('btnObjMove').style.display = (type === 'DT') ? 'none' : 'block';
    document.getElementById('btnObjMove').onclick = () => DiscomApp.CRUD.startObjectMove(type, id, title); 
    document.getElementById('btnObjDelete').onclick = () => { DiscomApp.CRUD.deleteEntity(type.toLowerCase(), id); DiscomApp.UI.closeObjectSheet(); };
};
