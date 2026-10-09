/* --- js/2_db_sync.js --- */
DiscomApp.DB.handleSupabaseAuth = async function(mode) {
    if(!supabaseClient) return alert("Network/Supabase Error.");
    const email = document.getElementById('authEmail').value.trim(), password = document.getElementById('authPassword').value.trim(), name = document.getElementById('authName').value.trim();
    if(!email || !password) return alert("Email and Password required!"); 
    DiscomApp.UI.showToast("Processing..."); 
    try {
        let response;
        if (mode === 'signup') { 
            if(!name) return alert("Full Name required!"); 
            response = await supabaseClient.auth.signUp({ email, password, options: { data: { full_name: name } } }); 
            if(response.error) alert("Signup Error: " + response.error.message); else { alert("Account Created! You can now Login."); DiscomApp.UI.toggleAuthMode(); }
        } else { 
            response = await supabaseClient.auth.signInWithPassword({ email, password }); 
            if (response.error) alert("Login Error: " + response.error.message); 
            else if (response.data.user) { 
                DiscomApp.State.user.isLoggedIn = true; DiscomApp.State.user.email = response.data.user.email; DiscomApp.State.user.id = response.data.user.id; 
                DiscomApp.State.user.name = response.data.user.user_metadata?.full_name || email.split('@')[0]; 
                DiscomApp.UI.applyAuthUIVisuals(); await DiscomApp.DB.pullFromSupabase(); DiscomApp.UI.showToast("Login Successful!"); 
            }
        }
    } catch(err) { console.error("Auth Exception:", err); alert("Connection error: " + err.message); }
};

DiscomApp.DB.handleSupabaseLogout = async function() { if(supabaseClient) await supabaseClient.auth.signOut(); if(typeof localforage !== 'undefined') await localforage.clear(); localStorage.clear(); location.reload(); };

DiscomApp.DB.setSyncStatus = function(status) { 
    const ind = document.getElementById('sync-indicator'); if(!ind) return;
    if(!navigator.onLine) status = 'offline'; 
    if(status === 'syncing') ind.innerHTML = '<i class="fa-solid fa-cloud-arrow-up sync-active"></i>'; 
    else if(status === 'synced') ind.innerHTML = '<i class="fa-solid fa-cloud-check sync-success"></i>'; 
    else ind.innerHTML = '<i class="fa-solid fa-cloud-xmark sync-error"></i>'; 
};

DiscomApp.DB.updateUnsyncedBadge = function() {
    let unsyncCount = 0; if(DiscomApp.State.photos) unsyncCount += DiscomApp.State.photos.filter(p => !p.synced).length;
    for(let fCode in DiscomApp.State.feeders) { let f = DiscomApp.State.feeders[fCode]; if(f.poles) unsyncCount += f.poles.filter(p => !p.synced).length; if(f.lines) unsyncCount += f.lines.filter(l => !l.synced).length; if(f.dts) unsyncCount += f.dts.filter(d => !d.synced).length; if(f.consumers) unsyncCount += f.consumers.filter(c => !c.synced).length; }
    let badge = document.getElementById('unsync-badge'); const syncBtn = document.getElementById('sync-indicator');
    if(!badge && syncBtn) { badge = document.createElement('div'); badge.id = 'unsync-badge'; badge.style.cssText = 'position:absolute; top:-5px; right:-5px; background:#ef4444; color:white; font-size:10px; font-weight:900; padding:2px 6px; border-radius:10px; border:2px solid white; z-index:10; pointer-events:none;'; syncBtn.style.position = 'relative'; syncBtn.appendChild(badge); }
    if(badge) { badge.innerText = unsyncCount; badge.style.display = unsyncCount > 0 ? 'block' : 'none'; }
};

DiscomApp.DB.saveLocalData = async function() {
    const pureData = {
        settings: DiscomApp.State.settings, user: DiscomApp.State.user, filters: DiscomApp.State.filters, currentFeederCode: DiscomApp.State.currentFeederCode, gssNodes: DiscomApp.State.gssNodes, feeders: DiscomApp.State.feeders, photos: DiscomApp.State.photos, deletedObjectIds: DiscomApp.State.deletedObjectIds, deletedFeederCodes: DiscomApp.State.deletedFeederCodes
    };
    try { if(typeof localforage !== 'undefined') await localforage.setItem(DB_KEY, pureData); else localStorage.setItem(DB_KEY, JSON.stringify(pureData)); } catch(e) { console.error("Local save error:", e); }
};

DiscomApp.DB.syncToSupabase = async function() {
    if (!supabaseClient || !DiscomApp.State.user.isLoggedIn || !DiscomApp.State.user.id) return; DiscomApp.DB.setSyncStatus('syncing');
    try {
        if (DiscomApp.State.deletedObjectIds && DiscomApp.State.deletedObjectIds.length > 0) { await supabaseClient.from('object_photos').delete().in('object_id', DiscomApp.State.deletedObjectIds); await supabaseClient.from('survey_objects').delete().in('id', DiscomApp.State.deletedObjectIds); DiscomApp.State.deletedObjectIds = []; }
        if (DiscomApp.State.deletedFeederCodes && DiscomApp.State.deletedFeederCodes.length > 0) { await supabaseClient.from('feeders').delete().in('code', DiscomApp.State.deletedFeederCodes); DiscomApp.State.deletedFeederCodes = []; }
        const metaData = { settings: DiscomApp.State.settings, filters: DiscomApp.State.filters, currentFeederCode: DiscomApp.State.currentFeederCode, gssNodes: DiscomApp.State.gssNodes };
        const { error: metaErr } = await supabaseClient.from('survey_data').upsert({ user_id: DiscomApp.State.user.id, data: metaData, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }); if(metaErr) throw metaErr;
        let feedersPayload = []; let objectsPayload = [];
        for (let fCode in DiscomApp.State.feeders) {
            let f = DiscomApp.State.feeders[fCode]; let gCode = f.feeder.parentGss || 'UNKNOWN'; feedersPayload.push({ code: fCode, user_id: DiscomApp.State.user.id, gss_code: gCode, name: f.feeder.name, details: f.feeder });
            (f.poles||[]).filter(p=>!p.synced).forEach(p => objectsPayload.push({ id: p.id, user_id: DiscomApp.State.user.id, gss_code: gCode, feeder_code: fCode, object_type: 'POLE', details: p }));
            (f.dts||[]).filter(d=>!d.synced).forEach(d => objectsPayload.push({ id: d.id, user_id: DiscomApp.State.user.id, gss_code: gCode, feeder_code: fCode, object_type: 'DT', details: d }));
            (f.lines||[]).filter(l=>!l.synced).forEach(l => objectsPayload.push({ id: l.id, user_id: DiscomApp.State.user.id, gss_code: gCode, feeder_code: fCode, object_type: 'LINE', details: l }));
            (f.consumers||[]).filter(c=>!c.synced).forEach(c => objectsPayload.push({ id: c.id, user_id: DiscomApp.State.user.id, gss_code: gCode, feeder_code: fCode, object_type: 'CONSUMER', details: c }));
        }
        if (feedersPayload.length > 0) await supabaseClient.from('feeders').upsert(feedersPayload, { onConflict: 'code' });
        if (objectsPayload.length > 0) {
            for (let i = 0; i < objectsPayload.length; i += 200) await supabaseClient.from('survey_objects').upsert(objectsPayload.slice(i, i + 200), { onConflict: 'id' });
            for (let fCode in DiscomApp.State.feeders) { (DiscomApp.State.feeders[fCode].poles||[]).forEach(p => p.synced = true); (DiscomApp.State.feeders[fCode].dts||[]).forEach(d => d.synced = true); (DiscomApp.State.feeders[fCode].lines||[]).forEach(l => l.synced = true); (DiscomApp.State.feeders[fCode].consumers||[]).forEach(c => c.synced = true); }
        }
        await DiscomApp.DB.saveLocalData(); DiscomApp.DB.setSyncStatus('synced'); DiscomApp.DB.updateUnsyncedBadge();
    } catch (err) { console.warn("Sync error", err); DiscomApp.DB.setSyncStatus('offline'); DiscomApp.DB.updateUnsyncedBadge(); }
};

DiscomApp.DB.pullFromSupabase = async function() {
    if (!supabaseClient || !DiscomApp.State.user.isLoggedIn || !DiscomApp.State.user.id) return; DiscomApp.DB.setSyncStatus('syncing');
    try {
        const { data: metaData } = await supabaseClient.from('survey_data').select('data').eq('user_id', DiscomApp.State.user.id);
        if(metaData && metaData.length > 0) { const cd = metaData[0].data; DiscomApp.State.gssNodes = cd.gssNodes || {}; DiscomApp.State.settings = { ...DiscomApp.State.settings, ...(cd.settings || {}) }; DiscomApp.State.filters = cd.filters || DiscomApp.State.filters; DiscomApp.State.currentFeederCode = cd.currentFeederCode || null; }
        const { data: feedersData } = await supabaseClient.from('feeders').select('*').eq('user_id', DiscomApp.State.user.id); if(!DiscomApp.State.feeders) DiscomApp.State.feeders = {};
        if(feedersData) { feedersData.forEach(f => { if(!DiscomApp.State.feeders[f.code]) DiscomApp.State.feeders[f.code] = { feeder: f.details, poles: [], dts: [], lines: [], consumers: [] }; }); }
        const { data: objData } = await supabaseClient.from('survey_objects').select('*').eq('user_id', DiscomApp.State.user.id);
        if(objData) { 
            objData.forEach(row => { 
                const fCode = row.feeder_code; 
                if (DiscomApp.State.deletedObjectIds && DiscomApp.State.deletedObjectIds.includes(row.id)) return;
                if(DiscomApp.State.feeders[fCode]) { 
                    const type = row.object_type; let targetArray = null;
                    if(type === 'POLE') { if(!DiscomApp.State.feeders[fCode].poles) DiscomApp.State.feeders[fCode].poles = []; targetArray = DiscomApp.State.feeders[fCode].poles; }
                    else if(type === 'DT') { if(!DiscomApp.State.feeders[fCode].dts) DiscomApp.State.feeders[fCode].dts = []; targetArray = DiscomApp.State.feeders[fCode].dts; }
                    else if(type === 'LINE') { if(!DiscomApp.State.feeders[fCode].lines) DiscomApp.State.feeders[fCode].lines = []; targetArray = DiscomApp.State.feeders[fCode].lines; }
                    else if(type === 'CONSUMER') { if(!DiscomApp.State.feeders[fCode].consumers) DiscomApp.State.feeders[fCode].consumers = []; targetArray = DiscomApp.State.feeders[fCode].consumers; }
                    if (targetArray) {
                        const existingObjIndex = targetArray.findIndex(x => x.id === row.id);
                        if (existingObjIndex > -1) {
                            const localObj = targetArray[existingObjIndex];
                            if (localObj.synced === false) return;
                            const cloudTime = row.details.updatedAt || 0, localTime = localObj.updatedAt || 0;
                            if (cloudTime > localTime) { row.details.synced = true; targetArray[existingObjIndex] = row.details; } 
                            else { targetArray[existingObjIndex].synced = true; }
                        } else { row.details.synced = true; targetArray.push(row.details); }
                    }
                } 
            }); 
        }
        await DiscomApp.DB.saveLocalData(); DiscomApp.UI.applyTranslations(); DiscomApp.UI.applyTheme(); if(map) map.invalidateSize(); 
        if(DiscomApp.Map.renderEntireNetwork) DiscomApp.Map.renderEntireNetwork(); 
        DiscomApp.UI.updateFeederDropdown(); DiscomApp.DB.setSyncStatus('synced'); 
        if(DiscomApp.UI.checkOnboardingFlow) DiscomApp.UI.checkOnboardingFlow(); DiscomApp.DB.updateUnsyncedBadge();
    } catch (err) { console.error("Sync pull error:", err); DiscomApp.DB.setSyncStatus('offline'); DiscomApp.DB.updateUnsyncedBadge(); }
};

// FIX: Instant Force Sync Logic
DiscomApp.DB.forceSync = async function() {
    if(!navigator.onLine) return DiscomApp.UI.showToast("⚠️ You are offline!");
    DiscomApp.UI.showToast("🔄 Force Sync Started...");
    await DiscomApp.DB.syncToSupabase();
    await DiscomApp.DB.pullFromSupabase();
    DiscomApp.UI.showToast("✅ Sync Complete!");
};

DiscomApp.DB.syncTimeout = null;
DiscomApp.DB.triggerPersistence = function() { 
    if(DiscomApp.DB.syncTimeout) clearTimeout(DiscomApp.DB.syncTimeout);
    DiscomApp.DB.syncTimeout = setTimeout(() => { DiscomApp.DB.saveLocalData().then(() => { DiscomApp.DB.updateUnsyncedBadge(); if(navigator.onLine && DiscomApp.State.settings.liveSync) DiscomApp.DB.syncToSupabase(); else if (!navigator.onLine) DiscomApp.DB.setSyncStatus('offline'); }); }, 1500); 
};

DiscomApp.DB.savePhotoData = async function(id, base64) {
    if(!DiscomApp.State.photos) DiscomApp.State.photos = []; const existingIndex = DiscomApp.State.photos.findIndex(p => p.id === id);
    if(existingIndex > -1) { DiscomApp.State.photos[existingIndex].synced = false; } else { DiscomApp.State.photos.push({ id: id, object_id: id, synced: false }); }
    try { if(typeof localforage !== 'undefined') await localforage.setItem('PHOTO_DATA_' + id, base64); else localStorage.setItem('PHOTO_DATA_' + id, base64); } catch(e) { console.error("Storage Full or Error:", e); }
    DiscomApp.DB.triggerPersistence();
};

DiscomApp.DB.getPhotoUrl = async function(id) { try { if(typeof localforage !== 'undefined') { const data = await localforage.getItem('PHOTO_DATA_' + id); return data || null; } else { return localStorage.getItem('PHOTO_DATA_' + id) || null; } } catch(e) { return null; } };

window.addEventListener('online', () => { if(DiscomApp.State.settings.liveSync) { DiscomApp.UI.showToast("Back Online! Syncing..."); DiscomApp.DB.syncToSupabase(); } });
window.addEventListener('offline', () => { DiscomApp.DB.setSyncStatus('offline'); DiscomApp.UI.showToast("Offline. Data saved locally."); });
setInterval(() => { if (navigator.onLine && DiscomApp.State.user.isLoggedIn && DiscomApp.State.settings.liveSync) DiscomApp.DB.pullFromSupabase(); }, 60000);
