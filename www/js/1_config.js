/* --- js/1_config.js --- */
const DiscomApp = { State: {}, DB: {}, Map: {}, UI: {}, CRUD: {}, Export: {}, Main: {} };

var DB_KEY = "DISCOM_ENTERPRISE_DB";
var SUPABASE_URL = 'https://sxfyeublvtisndnzycib.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZnlldWJsdnRpc25kbnp5Y2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjkzOTEsImV4cCI6MjEwNDgwNTM5MX0.FENa8zOaDzlYZJI_HfWtallAkWukxSiM52-RGQ-CUmA';
var supabaseClient = null; 
var ADMIN_EMAIL = 'admin@discom.com';

DiscomApp.State = {
    settings: { checkOrphanNode: true, unit: 'm', gpsInterval: 3, gpsAccuracy: 10, language: 'en', theme: 'light', liveSync: true, markerCluster: true }, 
    user: { isLoggedIn: false, name: "", email: "", id: null },
    filters: { lines11: true, linesLT: true, poles: true, dts: true, consumers: true },
    currentFeederCode: null, gssNodes: {}, feeders: {}, orphanPoleIds: new Set(), activeMove: null, placementType: null, photos: [], deletedObjectIds: [], deletedFeederCodes: [],
    appMode: 'edit' // Default mode is 'edit' for full access
};

var historyStack = []; var map = null; var tileLayers = {}; var currentTileIndex = 0; var layerKeys = []; var featureGroups = {}; 
var isSetupModalOpen = false; var tempPhotoUrl = null; var currentSelectedObj = null; var liveTrackingId = null; 
var liveUserMarker = null; var liveTrackCircle = null; var liveTrackWatchId = null; var isFirstLocationLock = true; var authMode = 'login'; 

const i18n = {
    en: { appLanguage: "Language", distUnit: "Distance Unit", theme: "Theme", settings: "Settings", save: "Save", edit: "Edit", delete: "Delete", mapSetup: "Network Setup Required", htPole: "HT Pole", ltPole: "LT Pole", line: "Line", dt: "DT", consumer: "Consumer", permReq: "Permissions Required", permDesc: "This app requires Location, Camera and Storage permissions.", grantPerm: "Grant Permissions", kpi11: "11 KV LINE", kpiLT: "LT LINE", kpi3Ph: "3-PH DT", kpi1Ph: "1-PH DT", kpiCons: "CONSUMERS", searchPla: "Search Consumer, DT, Pole..." },
    hi: { appLanguage: "ऐप की भाषा", distUnit: "दूरी की इकाई", theme: "थीम मोड", settings: "सेटिंग्स", save: "सेव करें", edit: "बदलें", delete: "डिलीट", mapSetup: "नेटवर्क सेटअप ज़रूरी है", htPole: "HT पोल", ltPole: "LT पोल", line: "लाइन", dt: "डी.टी", consumer: "कंज्यूमर", permReq: "अनुमति आवश्यक है", permDesc: "इस ऐप को चलाने के लिए Location, Camera और Storage की अनुमति दें।", grantPerm: "अनुमति दें", kpi11: "11 KV लाइन", kpiLT: "LT लाइन", kpi3Ph: "3-फेज़ DT", kpi1Ph: "1-फेज़ DT", kpiCons: "कंज्यूमर", searchPla: "सर्च करें: पोल, डी.टी, उपभोक्ता..." }
};

DiscomApp.State.getActiveNetwork = function() { 
    let keys = Object.keys(DiscomApp.State.feeders || {}); 
    if (keys.length > 0 && (!DiscomApp.State.currentFeederCode || !DiscomApp.State.feeders[DiscomApp.State.currentFeederCode])) DiscomApp.State.currentFeederCode = keys[0]; 
    let net = DiscomApp.State.feeders[DiscomApp.State.currentFeederCode]; 
    if (!net) return null; 
    if (!Array.isArray(net.poles)) net.poles = []; if (!Array.isArray(net.lines)) net.lines = []; if (!Array.isArray(net.dts)) net.dts = []; if (!Array.isArray(net.consumers)) net.consumers = []; 
    return net; 
};

DiscomApp.State.switchFeeder = function(code) { 
    if (DiscomApp.State.feeders[code]) { 
        DiscomApp.State.currentFeederCode = code; 
        if(DiscomApp.UI.updateFeederDropdown) DiscomApp.UI.updateFeederDropdown(); 
        if(DiscomApp.Map.renderEntireNetwork) DiscomApp.Map.renderEntireNetwork(); 
        if(DiscomApp.DB.triggerPersistence) DiscomApp.DB.triggerPersistence(); 
        if(DiscomApp.Map.centerMapOnGSS) DiscomApp.Map.centerMapOnGSS(); 
        if(DiscomApp.UI.toggleSidebar) DiscomApp.UI.toggleSidebar(false); 
    } 
};

DiscomApp.State.getDTStatistics = function(dtCode) { 
    const net = DiscomApp.State.getActiveNetwork(); if(!net || !net.consumers) return { count: 0, totalLoadKW: 0 }; 
    let count = 0; let totalLoadKW = 0; 
    net.consumers.forEach(c => { 
        let isConnected = false; 
        if(String(c.parentRef) === String(dtCode) || String(c.parentRef) === String('DT_' + dtCode)) isConnected = true; 
        else { const pole = (net.poles||[]).find(p => String(p.poleNo) === String(c.parentRef) || String(p.id) === String('POLE_' + c.parentRef)); if(pole && String(pole.dtCode) === String(dtCode)) isConnected = true; } 
        if(isConnected) { count++; const numMatch = String(c.load || '0').match(/[\d.]+/); if(numMatch) totalLoadKW += parseFloat(numMatch[0]) || 0; } 
    }); 
    return { count, totalLoadKW: totalLoadKW.toFixed(2) }; 
};

DiscomApp.State.saveSnapshot = function() { 
    const net = DiscomApp.State.getActiveNetwork(); if(!net) return; 
    historyStack.push(JSON.parse(JSON.stringify({ poles: net.poles||[], lines: net.lines||[], dts: net.dts||[], consumers: net.consumers||[] }))); 
    if (historyStack.length > 15) historyStack.shift(); 
};

DiscomApp.State.undoLastAction = function() { 
    if (historyStack.length === 0) return DiscomApp.UI.showToast("No actions to Undo!"); 
    const prevState = historyStack.pop(), net = DiscomApp.State.getActiveNetwork(); if(!net) return; 
    net.poles = prevState.poles; net.lines = prevState.lines; net.dts = prevState.dts; net.consumers = prevState.consumers; 
    DiscomApp.Map.renderEntireNetwork(); DiscomApp.DB.triggerPersistence(); DiscomApp.UI.showToast("Undo Successful ↺"); 
};
