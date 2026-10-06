/* --- js/3_map_render.js --- */

DiscomApp.Map.calcDistance = function(lat1, lon1, lat2, lon2) { const R = 6371e3, p1 = lat1 * Math.PI / 180, p2 = lat2 * Math.PI / 180, dp = (lat2 - lat1) * Math.PI / 180, dl = (lon2 - lon1) * Math.PI / 180; const a = Math.sin(dp/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2; return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); }
DiscomApp.Map.formatDistance = function(m) { return (DiscomApp.State.settings.unit === 'km') ? (m / 1000).toFixed(3) + ' KM' : m.toFixed(1) + ' M'; }
DiscomApp.Map.sortByDistance = function(nodes, lat, lng) { return (nodes||[]).slice().sort((a, b) => DiscomApp.Map.calcDistance(lat, lng, a.lat, a.lng) - DiscomApp.Map.calcDistance(lat, lng, b.lat, b.lng)); }
DiscomApp.Map.getOffsetCoords = function(coords, offsetMeters) {
    if(!coords || !coords[0] || !coords[1]) return coords;
    const lat1 = coords[0][0], lng1 = coords[0][1], lat2 = coords[1][0], lng2 = coords[1][1];
    const dx = (lng2 - lng1) * 111139 * Math.cos(lat1 * Math.PI / 180), dy = (lat2 - lat1) * 111139;
    const len = Math.sqrt(dx * dx + dy * dy); if (len === 0) return coords;
    const dLng = ((-dy / len) * offsetMeters) / (111139 * Math.cos(lat1 * Math.PI / 180)), dLat = ((dx / len) * offsetMeters) / 111139;
    return [[lat1 + dLat, lng1 + dLng], [lat2 + dLat, lng2 + dLng]];
};
DiscomApp.Map.getNodeCoords = function(nodeId) { 
    const net = DiscomApp.State.getActiveNetwork(); if(!net) return null; const idStr = String(nodeId);
    if (idStr.startsWith('GSS_')) { const code = idStr.replace('GSS_', ''); if (DiscomApp.State.gssNodes[code]) return { lat: DiscomApp.State.gssNodes[code].lat, lng: DiscomApp.State.gssNodes[code].lng }; }
    if (idStr.startsWith('DT_')) { const code = idStr.replace('DT_', ''); const d = (net.dts||[]).find(x => String(x.code) === code); if (d) return { lat: d.lat, lng: d.lng }; }
    if (idStr.startsWith('POLE_')) { const code = idStr.replace('POLE_', ''); const p = (net.poles||[]).find(x => String(x.poleNo) === code); if (p) return { lat: p.lat, lng: p.lng }; }
    const p = (net.poles||[]).find(x => String(x.poleNo) === idStr); if (p) return { lat: p.lat, lng: p.lng };
    const d = (net.dts||[]).find(x => String(x.code) === idStr); if (d) return { lat: d.lat, lng: d.lng };
    if (DiscomApp.State.gssNodes[idStr]) return { lat: DiscomApp.State.gssNodes[idStr].lat, lng: DiscomApp.State.gssNodes[idStr].lng };
    if (idStr === 'GSS' || (net.feeder && idStr === net.feeder.code)) { const g = DiscomApp.State.gssNodes[net.feeder.parentGss]; if(g) return { lat: g.lat, lng: g.lng }; }
    return null; 
}
DiscomApp.Map.getDistStr = (lat, lng) => { if(!lat || !lng || isNaN(lat)) return ''; if(!map) return ''; const c = map.getCenter(); return DiscomApp.Map.formatDistance(DiscomApp.Map.calcDistance(c.lat, c.lng, lat, lng)); };

DiscomApp.Map.initMapLayers = function() {
    if (typeof L === 'undefined') return; 
    map = L.map('map', { zoomControl: false, attributionControl: false, preferCanvas: true }).setView([26.9150, 75.7830], 16);
    map.on('zoomend', DiscomApp.Map.updateMapZoomClasses); 
    map.on('click', () => { const sheet = document.getElementById('object-bottom-sheet'); if(sheet && sheet.classList.contains('open')) DiscomApp.UI.closeObjectSheet(); });
    map.on('move', () => { 
        const c = map.getCenter(); document.getElementById('reticle-coordinates').innerText = `${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`; 
        if (DiscomApp.State.placementType && document.getElementById('center-placement-pin').style.display === 'block') {
            const net = DiscomApp.State.getActiveNetwork();
            if (net) {
                let nearestDist = Infinity; let nearestName = 'None';
                const checkNode = (lat, lng, name) => { if(lat && lng && !isNaN(lat) && !isNaN(lng)) { const d = DiscomApp.Map.calcDistance(c.lat, c.lng, lat, lng); if(d < nearestDist) { nearestDist = d; nearestName = name; } } };
                (net.poles||[]).forEach(p => checkNode(p.lat, p.lng, `Pole ${p.poleNo}`)); (net.dts||[]).forEach(d => checkNode(d.lat, d.lng, `DT ${d.code}`));
                const ind = document.getElementById('live-distance-indicator');
                if (nearestDist === Infinity) ind.style.display = 'none'; else { ind.style.display = 'block'; ind.innerText = `Nearest: ${nearestName} (${DiscomApp.Map.formatDistance(nearestDist)})`; }
            }
        }
    });
        // FIX: Added missing Google Street Map Layer
    tileLayers = { 
        osm: { name: 'OpenStreetMap', layer: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 22 }) }, 
        street: { name: 'Google Street Map', layer: L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', { maxZoom: 22 }) },
        hybrid: { name: 'Google Hybrid', layer: L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 22 }) } 
    };
    layerKeys = Object.keys(tileLayers); 
    tileLayers[layerKeys[currentTileIndex]].layer.addTo(map);

    featureGroups = { 
        gss: L.featureGroup().addTo(map), lines: L.featureGroup().addTo(map), consumerLines: L.featureGroup().addTo(map), dts: L.featureGroup().addTo(map), 
        poles: (typeof L.markerClusterGroup !== 'undefined') ? L.markerClusterGroup({ disableClusteringAtZoom: 18, maxClusterRadius: 50 }).addTo(map) : L.featureGroup().addTo(map), 
        consumers: (typeof L.markerClusterGroup !== 'undefined') ? L.markerClusterGroup({ disableClusteringAtZoom: 19, maxClusterRadius: 40 }).addTo(map) : L.featureGroup().addTo(map) 
    };
}

DiscomApp.Map.updateMapZoomClasses = function() {
    if(!map) return; const z = map.getZoom(), mapEl = document.getElementById('map'); 
    mapEl.classList.remove('hide-consumers', 'hide-lt-poles', 'hide-lt-lines', 'hide-ht-poles', 'hide-ht-lines', 'hide-dt', 'hide-gss');
    if (z <= 18) mapEl.classList.add('hide-consumers'); if (z <= 17) mapEl.classList.add('hide-lt-poles'); if (z <= 16) mapEl.classList.add('hide-lt-lines'); if (z <= 15) mapEl.classList.add('hide-ht-poles'); if (z <= 14) mapEl.classList.add('hide-ht-lines'); if (z <= 13) mapEl.classList.add('hide-dt'); if (z <= 12) mapEl.classList.add('hide-gss'); 
    let scale = 1; if (z < 19) scale = Math.max(0.35, 1 - ((19 - z) * 0.15)); else if (z > 19) scale = Math.min(1.5, 1 + ((z - 19) * 0.2));
    document.documentElement.style.setProperty('--icon-scale', scale);
}
DiscomApp.Map.toggleMapLayer = function() { if(!map) return; map.removeLayer(tileLayers[layerKeys[currentTileIndex]].layer); currentTileIndex = (currentTileIndex + 1) % layerKeys.length; tileLayers[layerKeys[currentTileIndex]].layer.addTo(map); document.getElementById('layer-indicator').innerText = tileLayers[layerKeys[currentTileIndex]].name; }
/* --- js/3_map_render.js में रिप्लेस करें --- */
/* --- js/3_map_render.js me is function ko replace karein --- */
DiscomApp.Map.centerMapOnGSS = function() { 
    if(!map) return; 
    
    // Timeout added so map renders properly before zooming
    setTimeout(() => {
        map.invalidateSize(); 
        const net = DiscomApp.State.getActiveNetwork(); 
        if(!net) return; 
        
        let latestObj = null;
        let maxTime = 0;

        // Sabhi objects me se sabse naya (latest updated) object dhundhna
        const checkArray = (arr) => {
            (arr || []).forEach(item => {
                if (item && typeof item.lat === 'number' && !isNaN(item.lat)) {
                    let time = item.updatedAt || 0;
                    // Agar updatedAt nahi hai, to object ki ID se time nikalna (jaise POLE_1699999999999)
                    if (time === 0 && item.id) {
                        const match = String(item.id).match(/\d{13}/);
                        if (match) time = parseInt(match[0]);
                    }
                    if (time > maxTime) {
                        maxTime = time;
                        latestObj = item;
                    }
                }
            });
        };

        // Poles, DTs aur Consumers me latest object check karein
        checkArray(net.poles);
        checkArray(net.dts);
        checkArray(net.consumers);

        if (latestObj) {
            // Agar koi object milta hai, to seedha uspar Auto-Zoom (Zoom level 19)
            map.flyTo([latestObj.lat, latestObj.lng], 19, {animate: true, duration: 1}); 
        } else {
            // Agar feeder naya hai aur poora khali hai, tabhi GSS par jayega (Zoom level 17)
            const gss = (net.feeder && net.feeder.parentGss) ? DiscomApp.State.gssNodes[net.feeder.parentGss] : null; 
            if (gss && typeof gss.lat === 'number' && !isNaN(gss.lat)) {
                map.flyTo([gss.lat, gss.lng], 17, {animate: true, duration: 1}); 
            }
        }
    }, 400); 
};

    
    // FIX: Timeout added so map renders properly before zooming
    setTimeout(() => {
        map.invalidateSize(); 
        const net = DiscomApp.State.getActiveNetwork(); 
        if(!net) return; 
        const gss = (net.feeder && net.feeder.parentGss) ? DiscomApp.State.gssNodes[net.feeder.parentGss] : null; 
        
        if (gss && typeof gss.lat === 'number' && !isNaN(gss.lat)) {
            // FIX: Using flyTo instead of setView for a smooth forced zoom
            map.flyTo([gss.lat, gss.lng], 17, {animate: true, duration: 1}); 
        }
    }, 400); 
};


DiscomApp.Map.getPoleWithDTHTML = function(p, associatedDTs, isOrphan) {
    const strokeC = isOrphan ? '#ef4444' : '#475569', fillC = isOrphan ? '#fca5a5' : '#fb923c'; 
    let displayNo = p.poleNo; const isLT = p.lineType === 'LT'; if (isLT && String(p.poleNo).includes('-')) displayNo = String(p.poleNo).split('-')[1];
    let numberPill = `<g transform="translate(0, -18)"><rect x="30" y="0" width="40" height="20" rx="6" fill="#ffffff" stroke="#0f172a" stroke-width="2.5"/><text x="50" y="14" font-size="13" font-weight="900" fill="#0f172a" text-anchor="middle" font-family="sans-serif">${displayNo}</text></g>`;
    let poleSvg = ''; let cx = 50; 
    if(p.poleType === 'TOWER') poleSvg = `<path d="M 30 10 L 10 95 M 30 10 L 50 95" stroke="${strokeC}" stroke-width="3"/><path d="M 23 35 L 37 35 M 19 55 L 41 55 M 14 75 L 46 75" stroke="${strokeC}" stroke-width="2"/><line x1="0" y1="35" x2="60" y2="35" stroke="${strokeC}" stroke-width="4"/><line x1="5" y1="55" x2="55" y2="55" stroke="${strokeC}" stroke-width="4"/><rect x="27" y="20" width="6" height="10" fill="#78350f" rx="2" stroke="#0f172a" stroke-width="1"/>`;
    else if(p.poleType === 'RAIL POLE') poleSvg = `<rect x="22" y="10" width="16" height="85" fill="${fillC}" stroke="${strokeC}" stroke-width="2"/><line x1="12" y1="20" x2="48" y2="20" stroke="${strokeC}" stroke-width="5"/><rect x="18" y="10" width="6" height="10" fill="#78350f" rx="2" stroke="#0f172a" stroke-width="1"/><rect x="36" y="10" width="6" height="10" fill="#78350f" rx="2" stroke="#0f172a" stroke-width="1"/>`;
    else if(p.poleType === 'PCC' && p.poleConfig === 'Double Pole') poleSvg = `<polygon points="12,15 20,15 22,95 10,95" fill="${fillC}" stroke="${strokeC}" stroke-width="1.5"/><polygon points="40,15 48,15 50,95 38,95" fill="${fillC}" stroke="${strokeC}" stroke-width="1.5"/><rect x="6" y="25" width="48" height="5" fill="${strokeC}"/><rect x="6" y="45" width="48" height="5" fill="${strokeC}"/><rect x="13" y="15" width="6" height="10" fill="#78350f" rx="2" stroke="#0f172a" stroke-width="1"/><rect x="27" y="15" width="6" height="10" fill="#78350f" rx="2" stroke="#0f172a" stroke-width="1"/><rect x="41" y="15" width="6" height="10" fill="#78350f" rx="2" stroke="#0f172a" stroke-width="1"/>`;
    else { if(isLT) poleSvg = `<polygon points="26,30 34,30 36,95 24,95" fill="${fillC}" stroke="${strokeC}" stroke-width="1.5"/><rect x="18" y="25" width="24" height="6" fill="${strokeC}" rx="1"/><rect x="27" y="18" width="6" height="8" fill="#78350f" rx="2" stroke="#0f172a" stroke-width="1"/>`; else poleSvg = `<path d="M 10 20 L 30 35 L 50 20" fill="none" stroke="${strokeC}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><polygon points="26,30 34,30 36,95 24,95" fill="${fillC}" stroke="${strokeC}" stroke-width="1.5"/><rect x="7" y="10" width="6" height="10" fill="#78350f" rx="2" stroke="#0f172a" stroke-width="1"/><rect x="47" y="10" width="6" height="10" fill="#78350f" rx="2" stroke="#0f172a" stroke-width="1"/><rect x="27" y="25" width="6" height="10" fill="#78350f" rx="2" stroke="#0f172a" stroke-width="1"/>`; }
    let dtSvgs = '';
    if(associatedDTs && associatedDTs.length > 0) {
        associatedDTs.forEach((d, idx) => {
            const numRating = String(d.rating).replace(/[^0-9]/g, ''); let startX = cx; if (associatedDTs.length > 1) startX = idx === 0 ? cx - 18 : cx + 18;
            if(d.phase === 'Single Phase') dtSvgs += `<g transform="translate(${startX - 13}, 65)" onclick="DiscomApp.UI.openDTFromSVG(event, '${d.id}')" style="cursor:pointer;"><rect x="0" y="0" width="26" height="30" rx="2" fill="${fillC}" stroke="#0f172a" stroke-width="2"/><rect x="3" y="3" width="20" height="24" fill="#fdba74"/><polygon points="10,0 16,0 13,-7" fill="#78350f" stroke="#0f172a" stroke-width="1"/><rect x="11" y="-9" width="4" height="2" fill="#94a3b8"/><text x="13" y="19" font-size="13" font-weight="900" fill="#0f172a" text-anchor="middle" font-family="sans-serif">${numRating}</text></g>`;
            else dtSvgs += `<g transform="translate(${startX - 16}, 60)" onclick="DiscomApp.UI.openDTFromSVG(event, '${d.id}')" style="cursor:pointer;"><rect x="0" y="0" width="32" height="36" rx="3" fill="${fillC}" stroke="#0f172a" stroke-width="2"/><polygon points="7,0 11,0 9,-7" fill="#78350f" stroke="#0f172a" stroke-width="1"/><polygon points="15,0 19,0 17,-7" fill="#78350f" stroke="#0f172a" stroke-width="1"/><polygon points="23,0 27,0 25,-7" fill="#78350f" stroke="#0f172a" stroke-width="1"/><text x="16" y="23" font-size="12" font-weight="900" fill="#0f172a" text-anchor="middle" font-family="sans-serif">${numRating}</text></g>`;
        });
    }
    return `<svg viewBox="0 -20 100 130" style="width:50px;height:75px; filter:drop-shadow(0px 4px 6px rgba(0,0,0,0.6)); overflow:visible;">${numberPill}<g transform="translate(20, 0)">${poleSvg}</g>${dtSvgs}</svg>`;
}

DiscomApp.Map.getDTSVG = function(phase, rating) {
    const numRating = String(rating).replace(/[^0-9]/g, ''); const lightOrange = '#fb923c'; const darkOrange = '#ea580c';  
    if(phase === 'Single Phase') return `<svg viewBox="0 0 40 50" style="width:20px;height:25px; filter:drop-shadow(0 3px 5px rgba(0,0,0,0.7));"><rect x="5" y="15" width="30" height="35" rx="2" fill="${lightOrange}" stroke="#0f172a" stroke-width="2"/><rect x="8" y="18" width="24" height="29" fill="#fdba74"/><polygon points="17,15 23,15 20,2" fill="#78350f" stroke="#0f172a" stroke-width="1"/><rect x="18" y="2" width="4" height="2" fill="#94a3b8"/><text x="20" y="40" font-size="16" font-weight="900" fill="#0f172a" text-anchor="middle" font-family="sans-serif">${numRating}</text></svg>`;
    return `<svg viewBox="0 0 60 70" style="width:34px;height:40px; filter:drop-shadow(0 5px 8px rgba(0,0,0,0.7));"><rect x="15" y="20" width="30" height="40" rx="3" fill="${lightOrange}" stroke="#0f172a" stroke-width="2"/><rect x="8" y="25" width="7" height="30" fill="${darkOrange}" rx="1"/><rect x="5" y="28" width="7" height="24" fill="#c2410c" rx="1"/><rect x="45" y="25" width="7" height="30" fill="${darkOrange}" rx="1"/><rect x="48" y="28" width="7" height="24" fill="#c2410c" rx="1"/><polygon points="18,20 22,20 20,5" fill="#78350f" stroke="#0f172a" stroke-width="1"/><polygon points="28,20 32,20 30,5" fill="#78350f" stroke="#0f172a" stroke-width="1"/><polygon points="38,20 42,20 40,5" fill="#78350f" stroke="#0f172a" stroke-width="1"/><text x="30" y="45" font-size="12" font-weight="900" fill="#0f172a" text-anchor="middle" font-family="sans-serif">${numRating}</text></svg>`;
}

DiscomApp.Map.getConsumerSVG = function(cType, status) {
    let bgColor = '#10b981'; if(status === 'DC') bgColor = '#facc15'; else if(status === 'PDC') bgColor = '#ef4444'; 
    const t = (cType || 'Domestic').toLowerCase(); let innerSvg = '';
    if (t.includes('nondomestic') || t.includes('commercial')) innerSvg = `<rect x="30" y="35" width="40" height="50" fill="#ffffff" rx="2"/><rect x="38" y="45" width="8" height="12" fill="#0f172a"/><rect x="54" y="45" width="8" height="12" fill="#0f172a"/><rect x="38" y="65" width="24" height="18" fill="#2563eb"/>`; 
    else if (t.includes('agri')) innerSvg = `<path d="M 50 80 L 50 35 M 40 45 Q 50 35 60 45 M 40 55 Q 50 45 60 55 M 40 65 Q 50 55 60 65" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>`; 
    else if (t.includes('sip') || t.includes('mip') || t.includes('indus')) innerSvg = `<rect x="25" y="50" width="50" height="35" fill="#ffffff"/><polygon points="35,50 35,35 45,35 45,50" fill="#ffffff"/><rect x="60" y="40" width="8" height="15" fill="#ffffff"/><path d="M 35 30 L 40 22 L 45 30" fill="none" stroke="#ffffff" stroke-width="4"/>`; 
    else if (t.includes('govt')) innerSvg = `<rect x="25" y="75" width="50" height="10" fill="#ffffff"/><polygon points="50,25 20,40 80,40" fill="#ffffff"/><rect x="30" y="45" width="6" height="30" fill="#ffffff"/><rect x="42" y="45" width="6" height="30" fill="#ffffff"/><rect x="54" y="45" width="6" height="30" fill="#ffffff"/><rect x="66" y="45" width="6" height="30" fill="#ffffff"/>`; 
    else innerSvg = `<path d="M 20 50 L 50 20 L 80 50 L 70 50 L 70 85 L 30 85 L 30 50 Z" fill="#ffffff"/><rect x="42" y="60" width="16" height="25" fill="${bgColor}"/><rect x="35" y="40" width="10" height="12" fill="#e0f2fe"/><rect x="55" y="40" width="10" height="12" fill="#e0f2fe"/>`;
    return `<div style="position:relative; width:36px; height:36px; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.5));"><svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="46" fill="${bgColor}" stroke="#ffffff" stroke-width="6"/>${innerSvg}</svg></div>`;
}

DiscomApp.Map.getLineSpec = function(type, phase, conductor) {
    const t = (type || '').toUpperCase(); const cond = (conductor || '').toUpperCase();
    if (t.includes('LT')) return { name: 'LT LINE', color: '#10b981', weight: 3, dash: null, filterKey: 'linesLT', lineClass: 'lt-line-path', strokeColor: '#000000' };
    let lineClass = 'ht-line-path'; let color = '#2563eb'; let weight = 3; let strokeColor = 'transparent'; 
    if (cond.includes('UNDERGROUND') || cond.includes('UG')) { color = '#000000'; weight: 5; strokeColor = 'transparent'; lineClass = 'ug-line-path'; } 
    else if (phase === 'Three Phase') { lineClass = 'ryb-line-path'; color = '#2563eb'; }
    return { name: '11 KV LINE', color: color, weight: weight, dash: null, filterKey: 'lines11', lineClass: lineClass, strokeColor: strokeColor };
}

DiscomApp.Map.updateOrphanStatus = function() {
    if(!DiscomApp.State.orphanPoleIds) DiscomApp.State.orphanPoleIds = new Set();
    DiscomApp.State.orphanPoleIds.clear(); const net = DiscomApp.State.getActiveNetwork(); if(!net) return; 
    const adj = {}, gssCode = net.feeder.parentGss, gssId = 'GSS_' + gssCode; adj[gssId] = [];
    (net.poles||[]).forEach(p => adj['POLE_' + p.poleNo] = []); (net.dts||[]).forEach(d => adj['DT_' + d.code] = []);
    (net.dts||[]).forEach(d => { if(d.parentPole) { const pId = 'POLE_' + d.parentPole; if (!adj[pId]) adj[pId] = []; adj[pId].push('DT_' + d.code); adj['DT_' + d.code].push(pId); } });
    (net.lines||[]).forEach(l => { const u = String(l.fromNode), v = String(l.toNode); if (!adj[u]) adj[u] = []; if (!adj[v]) adj[v] = []; adj[u].push(v); adj[v].push(u); });
    const visited = new Set([gssId]), queue = [gssId];
    while (queue.length > 0) { const curr = queue.shift(); (adj[curr] || []).forEach(neighbor => { if (!visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor); } }); }
    (net.poles||[]).forEach(p => { if (!visited.has('POLE_' + p.poleNo)) DiscomApp.State.orphanPoleIds.add(p.id); }); 
    (net.dts||[]).forEach(d => { if (!visited.has('DT_' + d.code)) DiscomApp.State.orphanPoleIds.add(d.id); });
}

DiscomApp.Map.addSingleObjectToMap = function(type, obj) {
    if(!map || !obj || isNaN(obj.lat) || isNaN(obj.lng)) return;
    if (type === 'POLE' || type === 'LTPOLE') {
        const isOrphan = DiscomApp.State.orphanPoleIds ? DiscomApp.State.orphanPoleIds.has(obj.id) : false;
        let associatedDTs = []; const net = DiscomApp.State.getActiveNetwork(); if(net && net.dts) associatedDTs = net.dts.filter(d => String(d.parentPole) === String(obj.poleNo));
        const m = L.marker([obj.lat, obj.lng], { icon: L.divIcon({ className: 'pole-marker-icon', html: DiscomApp.Map.getPoleWithDTHTML(obj, associatedDTs, isOrphan), iconSize: [50, 75], iconAnchor: [25, 16] }), zIndexOffset: 200 });
        m.on('click', () => { DiscomApp.UI.openObjectSheet('POLE', obj.id, `Pole ${obj.poleNo}`, `Type: <b>${obj.lineType || 'HT'}</b><br>Config: <b>${obj.poleType || 'Standard'}</b>`); }); 
        if(featureGroups.poles) featureGroups.poles.addLayer(m);
    } else if (type === 'DT') {
        const isOrphan = DiscomApp.State.orphanPoleIds ? DiscomApp.State.orphanPoleIds.has(obj.id) : false;
        const m = L.marker([obj.lat, obj.lng], { icon: L.divIcon({ className: `dt-square-icon ${isOrphan ? 'orphan-pulse' : ''}`, html: DiscomApp.Map.getDTSVG(obj.phase, obj.rating), iconSize: [34, 40], iconAnchor: [17, 20] }), zIndexOffset: 400 });
        m.on('click', () => { DiscomApp.UI.openDTFromSVG(null, obj.id); }); 
        if(featureGroups.dts) featureGroups.dts.addLayer(m);
    } else if (type === 'CONSUMER') {
        const m = L.marker([obj.lat, obj.lng], { icon: L.divIcon({ className: 'consumer-marker-icon', html: DiscomApp.Map.getConsumerSVG(obj.cType, obj.status), iconSize: [34,34], iconAnchor: [17, 17] }), zIndexOffset: 100 });
        m.on('click', () => { DiscomApp.UI.openObjectSheet('CONSUMER', obj.id, obj.name, `K-No: <b>${obj.kno}</b>`); }); 
        if(featureGroups.consumers) featureGroups.consumers.addLayer(m);
    }
};

DiscomApp.Map.renderEntireNetwork = function() {
    if(!map) return; DiscomApp.UI.updateFeederDropdown();
    try {
        DiscomApp.Map.updateOrphanStatus(); Object.values(featureGroups).forEach(g => g.clearLayers()); 
        Object.values(DiscomApp.State.gssNodes || {}).forEach(gss => {
            if (typeof gss.lat === 'number' && !isNaN(gss.lat)) {
                if (DiscomApp.State.activeMove && DiscomApp.State.activeMove.id === gss.code) return; 
                const gssSvg = `<div style="background:transparent; border:none; display:flex; justify-content:center; align-items:center; width:100%; height:100%;"><svg viewBox="0 0 100 50" style="width:60px;height:30px; filter:drop-shadow(0px 4px 6px rgba(0,0,0,0.6));"><rect x="2" y="2" width="96" height="46" rx="6" fill="#dc2626" stroke="#ffffff" stroke-width="4"/><text x="50" y="34" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">GSS</text></svg></div>`;
                const m = L.marker([gss.lat, gss.lng], { icon: L.divIcon({ className: 'gss-marker', html: gssSvg, iconSize: [60,30], iconAnchor: [30,15] }), zIndexOffset: 500 });
                m.on('click', () => { DiscomApp.UI.openObjectSheet('GSS', gss.code, gss.name, `Code: <b>${gss.code}</b>`); }); featureGroups.gss.addLayer(m);
            }
        });
        const net = DiscomApp.State.getActiveNetwork(); if(!net) return; const f = DiscomApp.State.filters || {};
        let poleDTMap = {}; (net.dts||[]).forEach(d => { if(d.parentPole) { if(!poleDTMap[String(d.parentPole)]) poleDTMap[String(d.parentPole)] = []; poleDTMap[String(d.parentPole)].push(d); } });
        if (f.poles && net.poles) {
            net.poles.forEach(p => {
                if(!p || isNaN(p.lat) || isNaN(p.lng) || (DiscomApp.State.activeMove && DiscomApp.State.activeMove.id === p.id)) return;
                const m = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: 'pole-marker-icon', html: DiscomApp.Map.getPoleWithDTHTML(p, poleDTMap[String(p.poleNo)] || [], DiscomApp.State.orphanPoleIds.has(p.id)), iconSize: [50, 75], iconAnchor: [25, 16] }), zIndexOffset: 200 });
                m.on('click', () => { DiscomApp.UI.openObjectSheet('POLE', p.id, `Pole ${p.poleNo}`, `Type: <b>${p.lineType || 'HT'}</b><br>Config: <b>${p.poleType || 'Standard'}</b><br>Condition: <b>${p.condition||'Good'}</b>`); }); featureGroups.poles.addLayer(m);
            });
        }
        if (f.dts && net.dts) {
            net.dts.forEach(d => {
                if(!d || !d.parentPole && d.lat && d.lng && !isNaN(d.lat) && !(DiscomApp.State.activeMove && DiscomApp.State.activeMove.id === d.id)) {
                    const m = L.marker([d.lat, d.lng], { icon: L.divIcon({ className: `dt-square-icon ${DiscomApp.State.orphanPoleIds.has(d.id) ? 'orphan-pulse' : ''}`, html: DiscomApp.Map.getDTSVG(d.phase, d.rating), iconSize: [34, 40], iconAnchor: [17, 20] }), zIndexOffset: 400 });
                    m.on('click', () => DiscomApp.UI.openDTFromSVG(null, d.id)); featureGroups.dts.addLayer(m);
                }
            });
        }
        if (net.lines) {
            net.lines.forEach(line => {
                if(!line) return;
                const c1 = DiscomApp.Map.getNodeCoords(line.fromNode), c2 = DiscomApp.Map.getNodeCoords(line.toNode); 
                if (c1 && c2 && !isNaN(c1.lat) && !isNaN(c2.lat)) { line.coords = [[c1.lat, c1.lng], [c2.lat, c2.lng]]; line.distanceMeters = DiscomApp.Map.calcDistance(c1.lat, c1.lng, c2.lat, c2.lng); } else return; 
                const spec = DiscomApp.Map.getLineSpec(line.type, line.phase, line.conductor); 
                if (f[spec.filterKey] === false) return; 
                const hitPoly = L.polyline(line.coords, { color: 'transparent', weight: 45, className: spec.lineClass }).addTo(featureGroups.lines);
                if(spec.lineClass === 'ryb-line-path') { 
                    L.polyline(DiscomApp.Map.getOffsetCoords(line.coords, 1.2), { color: '#ef4444', weight: 2, className: spec.lineClass, interactive: false }).addTo(featureGroups.lines); 
                    L.polyline(line.coords, { color: '#facc15', weight: 2, className: spec.lineClass, interactive: false }).addTo(featureGroups.lines); 
                    L.polyline(DiscomApp.Map.getOffsetCoords(line.coords, -1.2), { color: '#3b82f6', weight: 2, className: spec.lineClass, interactive: false }).addTo(featureGroups.lines); 
                } else if (spec.lineClass === 'ug-line-path') { L.polyline(line.coords, { color: spec.color, weight: spec.weight, className: spec.lineClass, interactive: false }).addTo(featureGroups.lines); 
                } else { 
                    if (spec.strokeColor !== 'transparent') { L.polyline(line.coords, { color: spec.strokeColor, weight: spec.weight + 4, opacity: 0.8, className: spec.lineClass, interactive: false }).addTo(featureGroups.lines); }
                    L.polyline(line.coords, { color: spec.color, weight: spec.weight, dashArray: spec.dash, lineCap: 'round', className: spec.lineClass, interactive: false }).addTo(featureGroups.lines); 
                }
                hitPoly.on('click', (e) => { L.DomEvent.stopPropagation(e); DiscomApp.UI.openObjectSheet('LINE', line.id, spec.name, `Phase: <b>${line.phase || 'N/A'}</b><br>Conductor: <b>${line.conductor || 'Standard'}</b><br>From-To: <b>${line.fromNode} ➔ ${line.toNode}</b><br>Dist: <b>${DiscomApp.Map.formatDistance(line.distanceMeters||0)}</b>`); });
            });
        }
        if (f.consumers && net.consumers) {
            net.consumers.forEach(c => {
                if (!c || isNaN(c.lat) || isNaN(c.lng) || (DiscomApp.State.activeMove && DiscomApp.State.activeMove.id === c.id)) return; 
                const m = L.marker([c.lat + (Math.random() - 0.5)*0.00003, c.lng + (Math.random() - 0.5)*0.00003], { icon: L.divIcon({ className: 'consumer-marker-icon', html: DiscomApp.Map.getConsumerSVG(c.cType, c.status), iconSize: [34,34], iconAnchor: [17, 17] }), zIndexOffset: 100 });
                m.on('click', () => { DiscomApp.UI.openObjectSheet('CONSUMER', c.id, c.name, `Type: <b>${c.cType||'Domestic'}</b><br>Status: <b>${c.status||'Regular'}</b><br>K-No: <b>${c.kno}</b><br>Load: <b>${c.load||'N/A'}</b>`); }); featureGroups.consumers.addLayer(m);
                let parentStr = c.parentType === 'DT' ? `DT_${c.parentRef}` : `POLE_${c.parentRef}`; const pCoords = DiscomApp.Map.getNodeCoords(parentStr);
                if (pCoords && !isNaN(pCoords.lat)) L.polyline([[c.lat, c.lng], [pCoords.lat, pCoords.lng]], { color: '#000000', weight: 1.5, dashArray: '3, 5', interactive: false, className: 'consumer-line-path' }).addTo(featureGroups.consumerLines);
            });
        }
        DiscomApp.Map.updateMapZoomClasses();
        let t11 = 0, tLT = 0, dt3ph = 0, dt1ph = 0; 
        (net.lines||[]).forEach(l => { if(l) { if (DiscomApp.Map.getLineSpec(l.type).name.includes('LT')) tLT += (l.distanceMeters || 0); else t11 += (l.distanceMeters || 0); } }); 
        (net.dts||[]).forEach(d => { if(d) { if(d.phase === 'Single Phase') dt1ph++; else dt3ph++; } });
        if(document.getElementById('kpi11')) document.getElementById('kpi11').innerText = DiscomApp.Map.formatDistance(t11); if(document.getElementById('kpiLT')) document.getElementById('kpiLT').innerText = DiscomApp.Map.formatDistance(tLT); if(document.getElementById('kpi3Ph')) document.getElementById('kpi3Ph').innerText = dt3ph; if(document.getElementById('kpi1Ph')) document.getElementById('kpi1Ph').innerText = dt1ph; if(document.getElementById('kpiCons')) document.getElementById('kpiCons').innerText = (net.consumers||[]).length;
    } catch(err) { console.error("Rendering error:", err); }
}
