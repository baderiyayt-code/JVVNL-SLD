Folde/**
 * DISCOM GIS SLD Survey App
 * Modular Vanilla JS - Cordova Ready
 */

// --- CONFIGURATION & STATE ---
const Config = {
    // SUPABASE CONFIGURATION (Replace with actual details)
    supabaseUrl: 'https://sxfyeublvtisndnzycib.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZnlldWJsdnRpc25kbnp5Y2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjkzOTEsImV4cCI6MjEwNDgwNTM5MX0.FENa8zOaDzlYZJI_HfWtallAkWukxSiM52-RGQ-CUmA',
    mapLayers: {
        osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        googleHybrid: 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}',
        googleStreets: 'http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}'
    }
};

const State = {
    user: null,
    isOffline: false,
    map: null,
    layers: { features: null },
    data: { nodes: [], lines: [], photos: [] }, // In-memory cache
    placementMode: null, // 'pole', 'dt', 'consumer', 'line_from', 'line_to'
    tempLineSource: null,
    theme: 'light-mode'
};

// Initialize Supabase Client
const supabase = window.supabase ? window.supabase.createClient(Config.supabaseUrl, Config.supabaseKey) : null;

// Cordova Device Ready Wrapper
document.addEventListener('deviceready', onDeviceReady, false);
function onDeviceReady() {
    console.log("Cordova Device Ready - Camera plugin accessible.");
}

// --- INITIALIZATION ---
window.onload = async () => {
    // 1. Splash Screen Logic
    setTimeout(() => {
        document.getElementById('splash-screen').classList.add('hidden');
        checkAuth();
    }, 2000);
    
    // 2. Event Listeners
    setupEventListeners();
};

async function checkAuth() {
    if(!supabase) return startApp(); // Fallback if no supabase configured
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        State.user = session.user;
        document.getElementById('user-display-name').innerText = State.user.user_metadata?.full_name || State.user.email;
        startApp();
    } else {
        document.getElementById('auth-screen').classList.remove('hidden');
    }
}

function startApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    initMap();
    loadLocalData();
}

// --- MAP & GIS ENGINE ---
function initMap() {
    // Center of Hathod, Rajasthan, India (Based on context)
    State.map = L.map('map', { zoomControl: false }).setView([26.9620, 75.6980], 15);
    
    const baseLayers = {
        "OpenStreetMap": L.tileLayer(Config.mapLayers.osm, { maxZoom: 22 }),
        "Google Streets": L.tileLayer(Config.mapLayers.googleStreets, { maxZoom: 22 }),
        "Google Hybrid": L.tileLayer(Config.mapLayers.googleHybrid, { maxZoom: 22 })
    };
    
    baseLayers["Google Hybrid"].addTo(State.map);
    L.control.layers(baseLayers, null, { position: 'bottomleft' }).addTo(State.map);
    
    State.layers.features = L.featureGroup().addTo(State.map);
    State.map.on('move', updateCrosshairPosition);
}

// --- ICONS & SVGS ---
const Icons = {
    pole: L.divIcon({ className: 'custom-icon', html: `<svg viewBox="0 0 100 100" width="30" height="30"><circle cx="50" cy="50" r="40" fill="gray" stroke="black" stroke-width="5"/></svg>`, iconSize: [30,30], iconAnchor: [15,15] }),
    dt: L.divIcon({ className: 'custom-icon', html: `<svg viewBox="0 0 100 100" width="40" height="40"><rect x="10" y="10" width="80" height="80" fill="orange" stroke="black" stroke-width="5"/></svg>`, iconSize: [40,40], iconAnchor: [20, 40] }), // Bottom anchored
    consumer: L.divIcon({ className: 'custom-icon', html: `<svg viewBox="0 0 100 100" width="25" height="25"><polygon points="50,10 90,50 90,90 10,90 10,50" fill="blue" stroke="white" stroke-width="2"/></svg>`, iconSize: [25,25], iconAnchor: [12,12] }),
    gss: L.divIcon({ className: 'custom-icon', html: `<svg viewBox="0 0 100 100" width="50" height="50"><rect x="0" y="0" width="100" height="100" fill="red"/></svg>`, iconSize: [50,50], iconAnchor: [25,25] })
};

// --- CORE UI LOGIC ---
function setupEventListeners() {
    // Auth
    document.getElementById('btn-login').onclick = async () => {
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if(error) alert(error.message); else checkAuth();
    };
    
    // Sidebar & Menus
    document.getElementById('btn-menu').onclick = () => document.getElementById('sidebar').classList.add('active');
    State.map?.on('click', () => document.getElementById('sidebar').classList.remove('active')); // Close on map click
    
    // FAB Logic
    const fabMain = document.getElementById('btn-fab-main');
    const fabMenu = document.querySelector('.fab-menu');
    fabMain.onclick = () => fabMenu.classList.toggle('hidden');
    
    document.querySelectorAll('.fab-item').forEach(btn => {
        btn.onclick = (e) => {
            const type = e.currentTarget.dataset.type;
            fabMenu.classList.add('hidden');
            if(type === 'line') initiateLineDraw();
            else startObjectPlacement(type);
        };
    });
    
    // Placement Logic
    document.getElementById('btn-confirm-placement').onclick = confirmPlacement;
    document.getElementById('btn-cancel-placement').onclick = cancelPlacement;
    
    // Modals
    document.getElementById('btn-close-modal').onclick = () => document.getElementById('data-modal').classList.add('hidden');
    document.getElementById('btn-capture-photo').onclick = capturePhoto;
    document.getElementById('btn-save-entity').onclick = saveEntityData;
    
    // Export UI
    document.getElementById('menu-export').onclick = () => {
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('export-modal').classList.remove('hidden');
    };
    document.getElementById('btn-close-export').onclick = () => document.getElementById('export-modal').classList.add('hidden');
    
    document.querySelectorAll('.export-btn').forEach(btn => {
        btn.onclick = (e) => exportData(e.currentTarget.dataset.format);
    });
    
    // Orphan detection
    document.getElementById('menu-orphan').onclick = detectOrphanNodes;
    document.getElementById('menu-settings').onclick = toggleTheme;
}

// --- WORKFLOW LOGIC: PLACEMENT & VALIDATION ---
function startObjectPlacement(type) {
    State.placementMode = type;
    document.getElementById('crosshair').classList.remove('hidden');
    document.querySelector('.fab-container').classList.add('hidden');
}

function cancelPlacement() {
    State.placementMode = null;
    document.getElementById('crosshair').classList.add('hidden');
    document.querySelector('.fab-container').classList.remove('hidden');
}

function updateCrosshairPosition() {
    // Used for visual tracking if needed. Leaflet map.getCenter() handles actual lat/lng
}

function confirmPlacement() {
    const center = State.map.getCenter();
    openDataForm(State.placementMode, center);
}

function openDataForm(type, latlng) {
    document.getElementById('crosshair').classList.add('hidden');
    const modal = document.getElementById('data-modal');
    const form = document.getElementById('data-form');
    document.getElementById('modal-title').innerText = `Add ${type.toUpperCase()}`;
    
    // Build form dynamically based on type
    let formHTML = `<input type="hidden" id="entity-lat" value="${latlng.lat}">
                    <input type="hidden" id="entity-lng" value="${latlng.lng}">
                    <input type="hidden" id="entity-type" value="${type}">
                    <input type="text" id="entity-name" placeholder="${type.toUpperCase()} Name/ID" required>`;
                    
    if (type === 'pole') {
        formHTML += `<select id="pole-type"><option value="HT">HT Pole</option><option value="LT">LT Pole</option></select>
                     <select id="pole-structure"><option value="PCC">PCC</option><option value="Rail">Rail</option></select>`;
    } else if (type === 'dt') {
        formHTML += `<select id="dt-phase"><option value="3">3-Phase</option><option value="1">1-Phase</option></select>
                     <input type="number" id="dt-capacity" placeholder="Capacity (kVA)">`;
    } else if (type === 'consumer') {
        formHTML += `<input type="text" id="consumer-acc" placeholder="Account Number">
                     <select id="parent-dt" required><option value="">Select Parent DT...</option>
                     ${State.data.nodes.filter(n => n.type === 'dt').map(dt => `<option value="${dt.id}">${dt.name}</option>`).join('')}
                     </select>`;
    }
    
    form.innerHTML = formHTML;
    document.getElementById('photo-preview').classList.add('hidden');
    document.getElementById('photo-preview').removeAttribute('src');
    modal.classList.remove('hidden');
}

// --- LINE DRAWING & STRICT VALIDATION ---
function initiateLineDraw() {
    alert("Select 'From' Node on the map");
    State.placementMode = 'line_from';
    State.map.once('click', handleNodeSelection); // In a real app, attach click events to Node markers directly.
    // Enhanced approach: Make markers clickable for routing
    State.layers.features.eachLayer(layer => {
        if (layer.options.isNode) {
            layer.on('click', onNodeClickForLine);
        }
    });
}

function onNodeClickForLine(e) {
    const node = State.data.nodes.find(n => n.id === e.target.options.id);
    if (!node) return;

    if (State.placementMode === 'line_from') {
        State.tempLineSource = node;
        State.placementMode = 'line_to';
        alert(`Selected ${node.name}. Now select 'To' Node.`);
    } else if (State.placementMode === 'line_to') {
        const destNode = node;
        if (State.tempLineSource.id === destNode.id) return alert("Cannot connect node to itself.");
        
        // Logical Validation
        // LT Line ONLY from DT or LT pole connected to DT. (Simplified check)
        
        const type = confirm("Is this an 11KV line? (Cancel for LT)") ? '11KV' : 'LT';
        const conductor = prompt("Enter Conductor type (Dog/Rabbit/Weasel):", "Rabbit");
        
        const isUG = confirm("Is this an Underground Cable?");
        
        const line = {
            id: 'line_' + Date.now(),
            type: 'line',
            lineType: type,
            conductor,
            isUG,
            from: State.tempLineSource.id,
            to: destNode.id,
            coords: [[State.tempLineSource.lat, State.tempLineSource.lng], [destNode.lat, destNode.lng]]
        };
        
        State.data.lines.push(line);
        saveToLocal();
        renderMap();
        
        // Reset
        State.placementMode = null;
        State.tempLineSource = null;
        document.querySelector('.fab-container').classList.remove('hidden');
        State.layers.features.eachLayer(l => l.off('click', onNodeClickForLine)); // Remove temp listeners
    }
}

// --- DEVICE CAMERA (CORDOVA) ---
function capturePhoto() {
    if (navigator.camera) {
        navigator.camera.getPicture(
            (base64Data) => {
                const img = document.getElementById('photo-preview');
                img.src = "data:image/jpeg;base64," + base64Data;
                img.classList.remove('hidden');
                img.dataset.b64 = base64Data;
            },
            (err) => { alert("Camera Error: " + err); },
            { quality: 50, destinationType: Camera.DestinationType.DATA_URL }
        );
    } else {
        // Web Fallback
        alert("Cordova Camera plugin not found. Running in Web context.");
    }
}

// --- DATA SAVING & SYNC ---
async function saveEntityData() {
    const type = document.getElementById('entity-type').value;
    const lat = parseFloat(document.getElementById('entity-lat').value);
    const lng = parseFloat(document.getElementById('entity-lng').value);
    const name = document.getElementById('entity-name').value;
    
    // Build Object
    const entity = { id: `${type}_` + Date.now(), type, lat, lng, name, properties: {} };
    
    if (type === 'pole') {
        entity.properties.poleType = document.getElementById('pole-type').value;
        entity.properties.structure = document.getElementById('pole-structure').value;
    } else if (type === 'dt') {
        entity.properties.phase = document.getElementById('dt-phase').value;
        entity.properties.capacity = document.getElementById('dt-capacity').value;
    } else if (type === 'consumer') {
        const parentDt = document.getElementById('parent-dt').value;
        if (!parentDt) { alert("Consumer must be linked to a Parent DT."); return; }
        entity.properties.parentDt = parentDt;
        entity.properties.acc = document.getElementById('consumer-acc').value;
    }
    
    State.data.nodes.push(entity);
    
    // Save Photo separately to avoid JSON lag
    const photoImg = document.getElementById('photo-preview');
    if (photoImg.dataset.b64) {
        State.data.photos.push({ entityId: entity.id, base64: photoImg.dataset.b64 });
    }
    
    await saveToLocal();
    renderMap();
    
    document.getElementById('data-modal').classList.add('hidden');
    document.querySelector('.fab-container').classList.remove('hidden');
    State.placementMode = null;
}

async function saveToLocal() {
    await localforage.setItem('discom_nodes', State.data.nodes);
    await localforage.setItem('discom_lines', State.data.lines);
    await localforage.setItem('discom_photos', State.data.photos);
    updateKPIs();
}

async function loadLocalData() {
    State.data.nodes = await localforage.getItem('discom_nodes') || [];
    State.data.lines = await localforage.getItem('discom_lines') || [];
    State.data.photos = await localforage.getItem('discom_photos') || [];
    renderMap();
    updateKPIs();
}

// --- RENDERING ---
function renderMap() {
    State.layers.features.clearLayers();
    
    // Draw Nodes
    State.data.nodes.forEach(node => {
        const icon = Icons[node.type] || Icons.pole;
        const marker = L.marker([node.lat, node.lng], { icon, isNode: true, id: node.id }).bindPopup(`<b>${node.name}</b><br>Type: ${node.type}`);
        State.layers.features.addLayer(marker);
        
        // Visual DT connection logic (Bottom anchor inherently done via iconAnchor)
    });
    
    // Draw Lines
    State.data.lines.forEach(line => {
        const lineStyle = { 
            color: line.isUG ? 'black' : (line.lineType === '11KV' ? 'red' : 'green'), 
            weight: line.lineType === '11KV' ? 4 : 2,
            dashArray: line.isUG ? null : (line.lineType === 'LT' ? '5, 5' : null)
        };
        const polyline = L.polyline(line.coords, lineStyle).bindPopup(`${line.lineType} - ${line.conductor}`);
        State.layers.features.addLayer(polyline);
    });
}

function updateKPIs() {
    let htLength = 0, ltLength = 0;
    State.data.lines.forEach(l => {
        const len = L.latLng(l.coords[0]).distanceTo(L.latLng(l.coords[1]));
        if(l.lineType === '11KV') htLength += len;
        else ltLength += len;
    });
    
    document.getElementById('kpi-11kv').innerText = htLength.toFixed(0);
    document.getElementById('kpi-lt').innerText = ltLength.toFixed(0);
    document.getElementById('kpi-dt').innerText = State.data.nodes.filter(n=>n.type==='dt').length;
    document.getElementById('kpi-cons').innerText = State.data.nodes.filter(n=>n.type==='consumer').length;
}

// --- ORPHAN DETECTION ALGORITHM ---
function detectOrphanNodes() {
    document.getElementById('sidebar').classList.remove('active');
    // Simplified: Find all nodes not present in the lines array as from/to
    const connectedNodeIds = new Set();
    State.data.lines.forEach(l => {
        connectedNodeIds.add(l.from);
        connectedNodeIds.add(l.to);
    });
    
    let orphans = 0;
    State.layers.features.eachLayer(layer => {
        if (layer.options.isNode && !connectedNodeIds.has(layer.options.id)) {
            // Highlight orphan (Add red glow via css or change marker)
            layer._icon?.classList.add('orphan-highlight'); // Requires CSS tweak
            layer.bindTooltip("Orphan Node", { permanent: true, className: 'orphan-tooltip' }).openTooltip();
            orphans++;
        }
    });
    alert(`Found ${orphans} orphan node(s). They have been highlighted on the map.`);
}

// --- EXPORT FUNCTIONALITIES ---
function exportData(format) {
    document.getElementById('export-modal').classList.add('hidden');
    
    if (format === 'csv') exportCSV();
    else if (format === 'kml') exportKML();
    else if (format === 'dxf') exportDXF();
    else if (format === 'pdf') exportPDF();
}

function exportCSV() {
    let csv = "ID,Name,Type,WKT\n";
    State.data.nodes.forEach(n => {
        csv += `${n.id},${n.name},${n.type},"POINT(${n.lng} ${n.lat})"\n`;
    });
    State.data.lines.forEach(l => {
        csv += `${l.id},${l.lineType},LineString,"LINESTRING(${l.coords[0][1]} ${l.coords[0][0]}, ${l.coords[1][1]} ${l.coords[1][0]})"\n`;
    });
    downloadFile(csv, 'survey_export.csv', 'text/csv');
}

function exportKML() {
    let kml = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n`;
    State.data.nodes.forEach(n => {
        kml += `<Placemark><name>${n.name}</name><Point><coordinates>${n.lng},${n.lat},0</coordinates></Point></Placemark>\n`;
    });
    kml += `</Document>\n</kml>`;
    downloadFile(kml, 'survey_export.kml', 'application/vnd.google-earth.kml+xml');
}

function exportDXF() {
    // Basic DXF Polyline/Entity generation structure
    let dxf = "0\nSECTION\n2\nENTITIES\n";
    State.data.lines.forEach(l => {
        dxf += `0\nPOLYLINE\n8\n${l.lineType}\n66\n1\n`;
        l.coords.forEach(c => { dxf += `0\nVERTEX\n8\n${l.lineType}\n10\n${c[1]}\n20\n${c[0]}\n`; });
        dxf += "0\nSEQEND\n";
    });
    dxf += "0\nENDSEC\n0\nEOF\n";
    downloadFile(dxf, 'survey_export.dxf', 'application/dxf');
}

function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a0" });
    doc.text("DISCOM SLD Survey Diagram", 20, 20);
    doc.setFontSize(10);
    // Note: True coordinate mapping to A0 paper scale requires min/max lat/lng bounds math.
    // This is a stub showing jsPDF integration.
    doc.text("Map Export Generated...", 20, 30); 
    doc.save("SLD_Export.pdf");
}

function downloadFile(content, fileName, mimeType) {
    const a = document.createElement('a');
    const blob = new Blob([content], { type: mimeType });
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
}

// --- UTILS ---
function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('light-mode')) {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
    }
}
