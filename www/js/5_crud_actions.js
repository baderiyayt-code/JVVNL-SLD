/* --- js/5_crud_actions.js (Modular Version) --- */

// ==========================================
// CRUD MODULE (Save, Edit, Delete, Move)
// ==========================================

DiscomApp.CRUD.savePhotoData = async function(id, base64) {
    if(!DiscomApp.State.photos) DiscomApp.State.photos = [];
    const existingIndex = DiscomApp.State.photos.findIndex(p => p.id === id);
    if(existingIndex > -1) { DiscomApp.State.photos[existingIndex].synced = false; } 
    else { DiscomApp.State.photos.push({ id: id, object_id: id, synced: false }); }
    try { if(typeof localforage !== 'undefined') await localforage.setItem('PHOTO_DATA_' + id, base64); else localStorage.setItem('PHOTO_DATA_' + id, base64); } catch(e) { console.error("Storage Error:", e); }
    if(window.triggerPersistence) window.triggerPersistence(); 
    if(window.syncPhotosToCloud) window.syncPhotosToCloud(id, base64);
};

DiscomApp.CRUD.getPhotoUrl = async function(id) {
    try { if(typeof localforage !== 'undefined') return await localforage.getItem('PHOTO_DATA_' + id) || null; else return localStorage.getItem('PHOTO_DATA_' + id) || null; } catch(e) { return null; }
};

DiscomApp.CRUD.saveNewPole = function() {
    const net = DiscomApp.State.getActiveNetwork(); if(!net) return false;
    const poleNo = document.getElementById('inpPoleNo').value.trim(), pType = document.getElementById('inpMainPoleType').value, pCond = document.getElementById('inpPoleCondition').value, pConf = document.getElementById('inpPccConfig').value;
    if(!poleNo) { alert("Pole Number is required!"); return false; }
    if((net.poles||[]).some(p => String(p.poleNo) === poleNo && p.lineType !== 'LT')) { alert("HT Pole Number already exists!"); return false; }
    if(window.saveSnapshot) window.saveSnapshot();
    
    const newObj = { id: 'POLE_' + Date.now(), poleNo: poleNo, lineType: 'HT', poleType: pType, condition: pCond, poleConfig: pConf, lat: parseFloat(document.getElementById('inpLat').value), lng: parseFloat(document.getElementById('inpLng').value) };
    
    if(window.tempPhotoUrl) { DiscomApp.CRUD.savePhotoData(newObj.id, window.tempPhotoUrl); window.tempPhotoUrl = null; }
    net.poles.push(newObj); 
    if (window.checkAndSplitLineOnPoleInsert) window.checkAndSplitLineOnPoleInsert(net, newObj);
    DiscomApp.State.placementType = null; 
    if(window.addSingleObjectToMap) window.addSingleObjectToMap('POLE', newObj); else window.renderEntireNetwork();
    return true;
};

DiscomApp.CRUD.saveNewLTPole = function() {
    const net = DiscomApp.State.getActiveNetwork(); if(!net) return false;
    const dt = document.getElementById('inpLTPoleDT').value, pType = document.getElementById('inpMainPoleType').value, pCond = document.getElementById('inpPoleCondition').value;
    if(!dt) { alert("Associated DT is required!"); return false; }
    let dtCodeClean = dt.replace('DT_',''); let maxL = 0; 
    (net.poles||[]).filter(p => p.lineType === 'LT' && String(p.dtCode) === dtCodeClean).forEach(p => { const pts = String(p.poleNo).split('-'); if(pts.length > 1) { const num = parseInt(pts[1]); if(!isNaN(num) && num > maxL) maxL = num; } });
    const poleNo = dtCodeClean + '-' + (maxL + 1);
    if(window.saveSnapshot) window.saveSnapshot();
    
    const newObj = { id: 'POLE_' + Date.now(), poleNo: poleNo, lineType: 'LT', dtCode: dtCodeClean, poleType: pType, condition: pCond, lat: parseFloat(document.getElementById('inpLat.value') || document.getElementById('inpLat').value), lng: parseFloat(document.getElementById('inpLng.value') || document.getElementById('inpLng').value) };
    
    if(window.tempPhotoUrl) { DiscomApp.CRUD.savePhotoData(newObj.id, window.tempPhotoUrl); window.tempPhotoUrl = null; }
    net.poles.push(newObj); 
    if(window.checkAndSplitLineOnPoleInsert) window.checkAndSplitLineOnPoleInsert(net, newObj);
    DiscomApp.State.placementType = null; 
    if(window.addSingleObjectToMap) window.addSingleObjectToMap('POLE', newObj); else window.renderEntireNetwork();
    return true;
};

// Worker implementation remains same, just inside namespace
DiscomApp.Utils.networkValidatorWorker = new Worker('js/loop_worker.js');

DiscomApp.CRUD.saveNewLine = function() {
    const net = DiscomApp.State.getActiveNetwork(); if(!net) return false;
    const type = document.getElementById('inpLineType').value, phase = document.getElementById('inpLinePhase') ? document.getElementById('inpLinePhase').value : '', cond = document.getElementById('inpConductor').value, fNode = document.getElementById('inpFromNode').value, tNode = document.getElementById('inpToNode').value;
    if(!fNode || !tNode || fNode === tNode) { alert("Invalid From/To nodes!"); return false; }
    if((net.lines||[]).some(l => (l.fromNode === fNode && l.toNode === tNode) || (l.fromNode === tNode && l.toNode === fNode))) { alert("This line route already exists!"); return false; }
    if(window.saveSnapshot) window.saveSnapshot();
    
    const newObj = { id: 'LINE_' + Date.now(), type: type, phase: phase, conductor: cond, fromNode: fNode, toNode: tNode };
    net.lines.push(newObj);
    if(window.showToast) window.showToast("⏳ Checking topology...");
    
    const isLT = type && type.includes('LT');
    DiscomApp.Utils.networkValidatorWorker.postMessage({ lines: net.lines, poles: net.poles, dts: net.dts, gssNodes: DiscomApp.State.gssNodes, feeder: net.feeder, networkType: isLT ? 'LT' : 'HT' });
    
    DiscomApp.Utils.networkValidatorWorker.onmessage = function(e) {
        if (e.data.hasLoop) { net.lines.pop(); alert(e.data.message); } 
        else {
            if(window.tempPhotoUrl) { DiscomApp.CRUD.savePhotoData(newObj.id, window.tempPhotoUrl); window.tempPhotoUrl = null; }
            if(window.showToast) window.showToast("✅ Line saved successfully!");
            window.renderEntireNetwork(); window.triggerPersistence();
        }
    };
    return true;
};

DiscomApp.CRUD.saveNewDT = function() {
    const net = DiscomApp.State.getActiveNetwork(); if(!net) return false;
    const parent = document.getElementById('inpDTParent').value, mountedOn = document.getElementById('inpDTMounted').value, code = document.getElementById('inpDTCode').value.trim(), phase = document.getElementById('inpDTPhase').value, rating = document.getElementById('inpDTRating').value, loc = document.getElementById('inpDTLocation').value;
    if(!parent || !code || !rating) { alert("Code, Parent and Rating required!"); return false; }
    if((net.dts||[]).some(d => String(d.code) === code)) { alert(`A DT with Code ${code} already exists!`); return false; }
    let lat = 0, lng = 0; if(document.getElementById('inpLat')) { lat = parseFloat(document.getElementById('inpLat').value); lng = parseFloat(document.getElementById('inpLng').value); }
    if(isNaN(lat) || lat === 0) { const pNode = window.getNodeCoords(parent); if(pNode) { lat = pNode.lat; lng = pNode.lng; } }
    if(window.saveSnapshot) window.saveSnapshot();
    
    const newObj = { id: 'DT_' + Date.now(), code: code, parentPole: parent.replace('POLE_','').replace('GSS_',''), mountedOn: mountedOn, phase: phase, rating: rating, location: loc, lat: lat, lng: lng };
    if(window.tempPhotoUrl) { DiscomApp.CRUD.savePhotoData(newObj.id, window.tempPhotoUrl); window.tempPhotoUrl = null; }
    net.dts.push(newObj); DiscomApp.State.placementType = null; 
    if(window.addSingleObjectToMap) window.addSingleObjectToMap('DT', newObj); else window.renderEntireNetwork();
    return true;
};

DiscomApp.CRUD.saveNewConsumer = function() {
    const net = DiscomApp.State.getActiveNetwork(); if(!net) return false;
    const dt = document.getElementById('inpConsDT').value, parent = document.getElementById('inpConsParent').value, status = document.getElementById('inpConsStatus').value, cType = document.getElementById('inpConsType').value, kno = document.getElementById('inpConsKno').value.trim(), load = document.getElementById('inpConsLoad').value, name = document.getElementById('inpConsName').value.trim();
    if(!dt || !parent || !kno || !name) { alert("Missing K-No or Name!"); return false; }
    if((net.consumers||[]).some(c => String(c.kno) === kno)) { alert(`Consumer K-Number ${kno} already exists!`); return false; }
    if(window.saveSnapshot) window.saveSnapshot();
    
    const newObj = { id: 'CONS_' + Date.now(), parentType: parent.startsWith('DT_') ? 'DT' : 'POLE', parentRef: parent.replace('POLE_','').replace('DT_',''), status: status, cType: cType, kno: kno, load: load, name: name, lat: parseFloat(document.getElementById('inpLat').value), lng: parseFloat(document.getElementById('inpLng').value) };
    if(window.tempPhotoUrl) { DiscomApp.CRUD.savePhotoData(newObj.id, window.tempPhotoUrl); window.tempPhotoUrl = null; }
    net.consumers.push(newObj); DiscomApp.State.placementType = null; 
    if(window.addSingleObjectToMap) window.addSingleObjectToMap('CONSUMER', newObj); else window.renderEntireNetwork();
    return true;
};

DiscomApp.CRUD.saveEditedGss = function(code) { const gss = DiscomApp.State.gssNodes[code]; if(!gss) return false; const newName = document.getElementById('editGssName').value.trim(); if(!newName) { alert("Name is required"); return false; } if(window.saveSnapshot) window.saveSnapshot(); gss.name = newName; gss.updatedAt = Date.now(); gss.synced = false; return true; };
DiscomApp.CRUD.saveEditedPole = function(id) { const net = DiscomApp.State.getActiveNetwork(); if(!net) return false; const p = (net.poles||[]).find(x => x.id === id); if(!p) return false; if(window.saveSnapshot) window.saveSnapshot(); p.poleType = document.getElementById('editMainPoleType').value; p.condition = document.getElementById('editPoleCondition').value; p.poleConfig = document.getElementById('editPccConfig') ? document.getElementById('editPccConfig').value : p.poleConfig; p.updatedAt = Date.now(); p.synced = false; return true; };
DiscomApp.CRUD.saveEditedDT = function(id) { const net = DiscomApp.State.getActiveNetwork(); if(!net) return false; const d = (net.dts||[]).find(x => x.id === id); if(!d) return false; if(window.saveSnapshot) window.saveSnapshot(); d.mountedOn = document.getElementById('editDTMounted').value; d.phase = document.getElementById('editDTPhase').value; d.rating = document.getElementById('editDTRating').value; d.location = document.getElementById('editDTLocation').value; d.updatedAt = Date.now(); d.synced = false; return true; };
DiscomApp.CRUD.saveEditedConsumer = function(id) { const net = DiscomApp.State.getActiveNetwork(); if(!net) return false; const c = (net.consumers||[]).find(x => x.id === id); if(!c) return false; if(window.saveSnapshot) window.saveSnapshot(); c.name = document.getElementById('editConsName').value.trim(); c.load = document.getElementById('editConsLoad').value; c.status = document.getElementById('editConsStatus').value; c.cType = document.getElementById('editConsType').value; if(!c.name) { alert("Name required"); return false; } c.updatedAt = Date.now(); c.synced = false; return true; };
DiscomApp.CRUD.saveEditedLine = function(id) { const net = DiscomApp.State.getActiveNetwork(); if(!net) return false; const l = (net.lines||[]).find(x => x.id === id); if(!l) return false; if(window.saveSnapshot) window.saveSnapshot(); l.phase = document.getElementById('editLinePhase') ? document.getElementById('editLinePhase').value : l.phase; l.conductor = document.getElementById('editLineConductor').value; l.updatedAt = Date.now(); l.synced = false; return true; };

DiscomApp.CRUD.deleteEntity = function(type, id) {
    const net = DiscomApp.State.getActiveNetwork(); if(!net) return;
    if(!confirm("Are you sure you want to delete this?")) return;
    if(window.saveSnapshot) window.saveSnapshot();
    if(!DiscomApp.State.deletedObjectIds) DiscomApp.State.deletedObjectIds = []; DiscomApp.State.deletedObjectIds.push(id);
    if (type === 'pole') net.poles = net.poles.filter(x => x.id !== id); 
    else if (type === 'dt') net.dts = net.dts.filter(x => x.id !== id); 
    else if (type === 'consumer') net.consumers = net.consumers.filter(x => x.id !== id); 
    else if (type === 'line') net.lines = net.lines.filter(x => x.id !== id);
    if(typeof localforage !== 'undefined') localforage.removeItem('PHOTO_DATA_' + id); else localStorage.removeItem('PHOTO_DATA_' + id);
    if(window.renderEntireNetwork) window.renderEntireNetwork(); if(window.triggerPersistence) window.triggerPersistence(); if(window.showToast) window.showToast("Deleted successfully");
};

DiscomApp.CRUD.startObjectMove = function(type, id, title) { 
    DiscomApp.State.activeMove = { type, id }; document.getElementById('center-placement-pin').style.display = 'block'; if(window.closeObjectSheet) window.closeObjectSheet(); 
    let moveBar = document.getElementById('move-confirm-bar'); 
    if(!moveBar) { moveBar = document.createElement('div'); moveBar.id = 'move-confirm-bar'; moveBar.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); z-index:9999999; display:flex; gap:10px; width:90%; max-width:400px; pointer-events:auto;'; moveBar.innerHTML = `<button class="btn-danger-outline" style="background:white; flex:1;" onclick="DiscomApp.CRUD.cancelMove()">Cancel</button><button class="btn-action-primary" style="flex:1;" onclick="DiscomApp.CRUD.confirmMove()">Set New Location</button>`; document.body.appendChild(moveBar); if(typeof L !== 'undefined' && L.DomEvent) { L.DomEvent.disableClickPropagation(moveBar); L.DomEvent.disableScrollPropagation(moveBar); } } 
    moveBar.style.display = 'flex'; document.getElementById('bottom-single-action').style.display = 'none'; if(window.showToast) window.showToast("Pan map to new location..."); 
};

DiscomApp.CRUD.cancelMove = function() { DiscomApp.State.activeMove = null; document.getElementById('center-placement-pin').style.display = 'none'; document.getElementById('move-confirm-bar').style.display = 'none'; document.getElementById('bottom-single-action').style.display = 'block'; if(window.renderEntireNetwork) window.renderEntireNetwork(); };

DiscomApp.CRUD.confirmMove = function() { 
    if(!DiscomApp.State.activeMove) return; 
    const center = map.getCenter(); const net = DiscomApp.State.getActiveNetwork(); if(window.saveSnapshot) window.saveSnapshot(); 
    const id = DiscomApp.State.activeMove.id; let isUpdated = false;
    if(DiscomApp.State.gssNodes && DiscomApp.State.gssNodes[id]) { DiscomApp.State.gssNodes[id].lat = parseFloat(center.lat.toFixed(6)); DiscomApp.State.gssNodes[id].lng = parseFloat(center.lng.toFixed(6)); DiscomApp.State.gssNodes[id].updatedAt = Date.now(); DiscomApp.State.gssNodes[id].synced = false; isUpdated = true; } 
    if (net && !isUpdated) {
        const arraysToCheck = ['poles', 'dts', 'consumers'];
        for (let arrName of arraysToCheck) {
            let targetObj = (net[arrName] || []).find(x => x.id === id);
            if (targetObj) { targetObj.lat = parseFloat(center.lat.toFixed(6)); targetObj.lng = parseFloat(center.lng.toFixed(6)); targetObj.updatedAt = Date.now(); targetObj.synced = false; isUpdated = true; break; }
        }
    }
    DiscomApp.CRUD.cancelMove(); 
    if(isUpdated) { if(window.triggerPersistence) window.triggerPersistence(); if(window.showToast) window.showToast("Location Updated & Synced to Cloud!"); } else { if(window.showToast) window.showToast("Error: Object not found to move."); }
};


// ==========================================
// THE BRIDGE (ताकि HTML में लिखे onclick काम करते रहें)
// ==========================================
window.savePhotoData = DiscomApp.CRUD.savePhotoData;
window.getPhotoUrl = DiscomApp.CRUD.getPhotoUrl;
window.saveNewPole = DiscomApp.CRUD.saveNewPole;
window.saveNewLTPole = DiscomApp.CRUD.saveNewLTPole;
window.saveNewLine = DiscomApp.CRUD.saveNewLine;
window.saveNewDT = DiscomApp.CRUD.saveNewDT;
window.saveNewConsumer = DiscomApp.CRUD.saveNewConsumer;
window.saveEditedGss = DiscomApp.CRUD.saveEditedGss;
window.saveEditedPole = DiscomApp.CRUD.saveEditedPole;
window.saveEditedDT = DiscomApp.CRUD.saveEditedDT;
window.saveEditedConsumer = DiscomApp.CRUD.saveEditedConsumer;
window.saveEditedLine = DiscomApp.CRUD.saveEditedLine;
window.deleteEntity = DiscomApp.CRUD.deleteEntity;
window.startObjectMove = DiscomApp.CRUD.startObjectMove;
window.cancelMove = DiscomApp.CRUD.cancelMove;
window.confirmMove = DiscomApp.CRUD.confirmMove;
window.networkValidatorWorker = DiscomApp.Utils.networkValidatorWorker;
