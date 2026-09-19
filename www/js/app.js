const DB_KEY = "DISCOM_ENTERPRISE_DB";

const SUPABASE_URL = 'https://sxfyeublvtisndnzycib.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZnlldWJsdnRpc25kbnp5Y2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjkzOTEsImV4cCI6MjEwNDgwNTM5MX0.FENa8zOaDzlYZJI_HfWtallAkWukxSiM52-RGQ-CUmA';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const ADMIN_EMAIL = 'admin@discom.com';

let appState = {
    settings: { checkOrphanNode: true, unit: 'm', gpsInterval: 3, gpsAccuracy: 10, language: 'en' },
    user: { isLoggedIn: false, name: "", email: "", id: null },
    filters: { lines11: true, linesLT: true, poles: true, dts: true, consumers: true },
    currentFeederCode: "1",
    gssNodes: { "1": { code: "1", name: "132/33 kV Substation", lat: 26.9150, lng: 75.7830 } },
    feeders: { 
        "1": { feeder: { name: "11 kV Feeder-01", code: "1", subdivCode: "SD-01", parentGss: "1" }, poles: [], dts: [], lines: [], consumers: [] } 
    },
    orphanPoleIds: new Set(), activeMove: null, placementType: null
};

let historyStack = [];

// Req 4: Bilingual Localization Support Engine
const i18n = {
    en: {
        hybridMap: "Google Hybrid",
        htPole: "HT Pole",
        ltPole: "LT Pole",
        line: "Line",
        dt: "DT",
        consumer: "Consumer",
        line11: "11 KV Line",
        lineLT: "LT Line",
        dt3ph: "3-Ph DT",
        dt1ph: "1-Ph DT",
        totalCons: "Consumers",
        gssMgmt: "GSS Management",
        addNewGss: "Add New GSS",
        manageFdr: "Manage Feeders",
        export: "Export Data (Downloads)",
        exportPdf: "Export SLD PDF",
        exportDxf: "Export DXF",
        exportKml: "Export styled KML",
        exportCsv: "Export CSV (GE Ready)",
        import: "Backup & Restore",
        exportJson: "Export Backup (JSON)",
        importData: "Import Backup (JSON)",
        system: "System",
        settings: "Settings",
        about: "About App",
        appLanguage: "App Language",
        distUnit: "Distance Unit",
        gpsInterval: "GPS Polling Interval",
        gpsAcc: "GPS Accuracy",
        resetData: "Reset App Data",
        confirmLoc: "Confirm Location",
        confirmHere: "Confirm Here",
        cancel: "Cancel",
        setNewLoc: "Set New Location",
        toastSettings: "Settings Saved!",
        toastDel: "Deleted Successfully!",
        toastImport: "Imported Successfully!",
        fillReq: "Fill required fields",
        feederExists: "Feeder Code already exists!",
        feederAdded: "New Feeder Created!",
        confirmDel: "Are you sure you want to delete this?",
        searchPlaceholder: "Search K-No, Name, DT Code...",
        noResults: "No results found",
        authProcessing: "Processing...",
        authLoginSuccess: "Login Successful!",
        emailPassRequired: "Email and Password required",
        enterFullName: "Enter Full Name",
        adminPassMin: "Password must be at least 6 characters.",
        adminPassUpdated: "Admin password updated successfully!",
        toastUndoNone: "No actions to Undo!",
        toastUndoSuccess: "Undo Successful ↺",
        addHtPole: "Add HT Pole",
        poleNumber: "Pole Number*",
        saveHtPole: "Save HT Pole",
        enterPoleNumber: "Enter pole number",
        poleExists: "Pole exists!",
        toastHtPoleAdded: "HT Pole added successfully!",
        addLtPole: "Add LT Pole",
        associatedDt: "Associated DT*",
        saveLtPole: "Save LT Pole",
        mustAddDtFirst: "You must add a DT first before adding an LT Pole!",
        selectDt: "Select DT",
        alreadyExists: "already exists!",
        toastLtPoleAdded: "LT Pole added successfully!",
        addLine: "Add Line",
        lineTypeLabel: "Line Type*",
        selectDtRouting: "Select DT for LT Line Routing*",
        fromNode: "From Node*",
        toNode: "To Node*",
        saveLine: "Save Line",
        addPoleFirst: "Add at least one pole first!",
        cannotConnectSelf: "Cannot connect node to itself!",
        selectTargetNode: "Please select a target node!",
        lineExists: "A line already exists between these two nodes!",
        invalidCoords: "Invalid node coordinates!",
        toastLineAdded: "Line added successfully!",
        addDt: "Add DT",
        connectedToParent: "Connected To (Parent HT Node)*",
        dtCode: "DT Code*",
        phase: "Phase*",
        threePhase: "Three Phase",
        singlePhase: "Single Phase",
        ratingKva: "Rating (kVA)*",
        locationLandmark: "Location / Landmark",
        saveDt: "Save DT",
        enterDtCode: "Enter DT Code",
        toastDtAdded: "DT added successfully!",
        addConsumer: "Add Consumer",
        mustHaveDt: "Must have at least one DT to connect Consumer!",
        selectParentDt: "Select Parent DT*",
        connectsTo: "Connects To (LT Pole / DT)*",
        knoLabel: "K-Number*",
        loadLabel: "Load",
        consumerName: "Consumer Name*",
        saveConsumer: "Save Consumer",
        knoExists: "K-Number already exists in this feeder!",
        enterNameKno: "Enter Consumer Name and K-No",
        toastConsumerAdded: "Consumer added successfully!",
        editPole: "Edit Pole",
        poleNumberLocked: "Pole Number (Locked)*",
        saveChanges: "Save Changes",
        editDt: "Edit DT",
        editConsumer: "Edit Consumer",
        editGss: "Edit GSS",
        gssNameLabel: "GSS Name*",
        toastPoleUpdated: "Pole Settings Updated",
        toastUpdated: "Updated",
        toastGssUpdated: "GSS Updated",
        addNewGssTitle: "Add New GSS",
        gssCodeLabel: "GSS Code*",
        saveGssAtCenter: "Save GSS at Map Center",
        enterGssCodeName: "Enter GSS Code and Name",
        gssCodeExists: "GSS Code already exists!",
        toastGssAdded: "New GSS added successfully!",
        addFeederTitle: "Add Feeder",
        feederCodeLabel: "Feeder Code (Numeric Only)*",
        feederNameLabel: "Feeder Name*",
        parentGssLabel: "Parent GSS*",
        createFeederBtn: "Create Feeder",
        manageFeedersTitle: "Manage Feeders",
        noFeedersFound: "No feeders found.",
        addFeederBtn: "Add New Feeder",
        deleteFeederConfirm: "Delete this feeder? All its poles, lines, DTs and consumers will be removed permanently.",
        toastFeederDeleted: "Feeder deleted successfully!",
        toastFeederUpdated: "Feeder updated successfully!",
        editFeederTitle: "Edit Feeder",
        objectFilter: "Object Filter",
        filterPoles: "Poles",
        filterDt: "DT",
        filterConsumers: "Consumers",
        applyBtn: "Apply",
        toastFiltersUpdated: "Filters Updated",
        orphanFound: "Orphan Nodes Found",
        poleLabel: "Pole:",
        typeLabel: "Type:",
        zoomBtn: "Zoom",
        toastLocationUpdated: "Location Updated!",
        moveTargetPrefix: "Move:",
        liveTrackDisabled: "Live tracking disabled.",
        fetchingLocation: "Fetching location...",
        geoNotFound: "Geolocation API not found.",
        gpsError: "GPS Error. Ensure location permissions are granted.",
        pdfLibError: "PDF Generator library load error.",
        noDtGssToPlot: "No DT/GSS nodes found to plot!",
        generatingPdf: "Generating A0 SLD PDF...",
        preparingExport: "Preparing file export...",
        fileSavedDownloads: "File saved to Downloads folder!",
        fileWriteError: "File write error",
        fileCreateError: "Error creating file",
        downloadsAccessError: "Error accessing Downloads folder",
        fileDownloadedLocal: "File Downloaded to local storage!",
        exportFailedPrefix: "Export failed:",
        invalidBackupFormat: "Invalid Backup Format! File missing core node structures.",
        backupParseError: "Error parsing file. Ensure it is a valid JSON backup file.",
        dataImported: "Data Imported Successfully!",
        deletionCancelledMismatch: "Deletion cancelled: GSS code did not match.",
        typeGssCodeConfirm: "To strictly confirm deletion, please type the GSS code",
        noOrphanFound: "No orphan poles or nodes found! Network is fully connected.",
        btnEdit: "Edit", btnMove: "Move", btnDelete: "Delete", btnRelocate: "Relocate",
        codeLabel: "Code:", parentLabel: "Parent:", ratingLabel: "Rating:", connectedToLabel: "Connected To:",
        fromToLabel: "From-To:", distanceLabel: "Distance:", connectedToLower: "Connected to:", feederFallback: "Feeder"
    },
    hi: {
        hybridMap: "गूगल हाइब्रिड",
        htPole: "HT पोल",
        ltPole: "LT पोल",
        line: "लाइन",
        dt: "डीटी",
        consumer: "उपभोक्ता",
        line11: "11 KV लाइन",
        lineLT: "LT लाइन",
        dt3ph: "3-Ph डीटी",
        dt1ph: "1-Ph डीटी",
        totalCons: "उपभोक्ता",
        gssMgmt: "GSS प्रबंधन",
        addNewGss: "नया GSS जोड़ें",
        manageFdr: "फीडर प्रबंधन",
        export: "एक्सपोर्ट (डिवाइस में सेव करें)",
        exportPdf: "SLD PDF एक्सपोर्ट",
        exportDxf: "DXF एक्सपोर्ट",
        exportKml: "स्टाइल्ड KML एक्सपोर्ट",
        exportCsv: "CSV एक्सपोर्ट",
        import: "बैकअप और रीस्टोर",
        exportJson: "बैकअप एक्सपोर्ट (JSON)",
        importData: "बैकअप इंपोर्ट करें (JSON)",
        system: "सिस्टम",
        settings: "सेटिंग्स",
        about: "ऐप के बारे में",
        appLanguage: "ऐप की भाषा",
        distUnit: "दूरी की इकाई",
        gpsInterval: "GPS अंतराल (सेकंड)",
        gpsAcc: "GPS सटीकता (मीटर)",
        resetData: "ऐप डेटा रीसेट करें",
        confirmLoc: "स्थान की पुष्टि करें",
        confirmHere: "यहाँ पुष्टि करें",
        cancel: "रद्द करें",
        setNewLoc: "नया स्थान सेट करें",
        toastSettings: "सेटिंग्स सहेजी गईं!",
        toastDel: "सफलतापूर्वक हटा दिया गया!",
        toastImport: "सफलतापूर्वक इंपोर्ट किया गया!",
        fillReq: "आवश्यक फ़ील्ड भरें",
        feederExists: "फीडर कोड पहले से मौजूद है!",
        feederAdded: "नया फीडर बनाया गया!",
        confirmDel: "क्या आप वाकई इसे हटाना चाहते हैं?",
        searchPlaceholder: "खोजें (K-No, नाम, DT कोड)...",
        noResults: "कोई परिणाम नहीं मिला",
        authProcessing: "प्रोसेसिंग...",
        authLoginSuccess: "लॉगिन सफल!",
        emailPassRequired: "ईमेल और पासवर्ड आवश्यक है",
        enterFullName: "पूरा नाम दर्ज करें",
        adminPassMin: "पासवर्ड कम से कम 6 अक्षर का होना चाहिए।",
        adminPassUpdated: "एडमिन पासवर्ड सफलतापूर्वक अपडेट हुआ!",
        toastUndoNone: "कोई अंडू करने के लिए कार्रवाई नहीं!",
        toastUndoSuccess: "अंडू सफल ↺",
        addHtPole: "HT पोल जोड़ें",
        poleNumber: "पोल नंबर*",
        saveHtPole: "HT पोल सहेजें",
        enterPoleNumber: "पोल नंबर दर्ज करें",
        poleExists: "पोल पहले से मौजूद है!",
        toastHtPoleAdded: "HT पोल सफलतापूर्वक जोड़ा गया!",
        addLtPole: "LT पोल जोड़ें",
        associatedDt: "संबंधित DT*",
        saveLtPole: "LT पोल सहेजें",
        mustAddDtFirst: "LT पोल जोड़ने से पहले आपको DT जोड़ना होगा!",
        selectDt: "DT चुनें",
        alreadyExists: "पहले से मौजूद है!",
        toastLtPoleAdded: "LT पोल सफलतापूर्वक जोड़ा गया!",
        addLine: "लाइन जोड़ें",
        lineTypeLabel: "लाइन का प्रकार*",
        selectDtRouting: "LT लाइन रूटिंग हेतु DT चुनें*",
        fromNode: "प्रारंभ बिंदु*",
        toNode: "अंतिम बिंदु*",
        saveLine: "लाइन सहेजें",
        addPoleFirst: "कृपया पहले कम से कम एक पोल जोड़ें!",
        cannotConnectSelf: "नोड को स्वयं से जोड़ा नहीं जा सकता!",
        selectTargetNode: "कृपया लक्ष्य नोड चुनें!",
        lineExists: "इन दो नोड्स के बीच पहले से ही लाइन मौजूद है!",
        invalidCoords: "अवैध नोड स्थान!",
        toastLineAdded: "लाइन सफलतापूर्वक जोड़ी गई!",
        addDt: "DT जोड़ें",
        connectedToParent: "जुड़ा हुआ (पेरेंट HT नोड)*",
        dtCode: "DT कोड*",
        phase: "फेज*",
        threePhase: "थ्री फेज",
        singlePhase: "सिंगल फेज",
        ratingKva: "रेटिंग (kVA)*",
        locationLandmark: "स्थान / लैंडमार्क",
        saveDt: "DT सहेजें",
        enterDtCode: "DT कोड दर्ज करें",
        toastDtAdded: "DT सफलतापूर्वक जोड़ा गया!",
        addConsumer: "उपभोक्ता जोड़ें",
        mustHaveDt: "उपभोक्ता जोड़ने के लिए कम से कम एक DT होना चाहिए!",
        selectParentDt: "पेरेंट DT चुनें*",
        connectsTo: "किससे जुड़ा है (LT पोल / DT)*",
        knoLabel: "K-नंबर*",
        loadLabel: "लोड",
        consumerName: "उपभोक्ता का नाम*",
        saveConsumer: "उपभोक्ता सहेजें",
        knoExists: "K-नंबर इस फीडर में पहले से मौजूद है!",
        enterNameKno: "उपभोक्ता का नाम और K-No दर्ज करें",
        toastConsumerAdded: "उपभोक्ता सफलतापूर्वक जोड़ा गया!",
        editPole: "पोल संपादित करें",
        poleNumberLocked: "पोल नंबर (लॉक)*",
        saveChanges: "परिवर्तन सहेजें",
        editDt: "DT संपादित करें",
        editConsumer: "उपभोक्ता संपादित करें",
        editGss: "GSS संपादित करें",
        gssNameLabel: "GSS नाम*",
        toastPoleUpdated: "पोल सेटिंग अपडेट हुई",
        toastUpdated: "अपडेट हुआ",
        toastGssUpdated: "GSS अपडेट हुआ",
        addNewGssTitle: "नया GSS जोड़ें",
        gssCodeLabel: "GSS कोड*",
        saveGssAtCenter: "मैप सेंटर पर GSS सहेजें",
        enterGssCodeName: "GSS कोड और नाम दर्ज करें",
        gssCodeExists: "GSS कोड पहले से मौजूद है!",
        toastGssAdded: "नया GSS सफलतापूर्वक जोड़ा गया!",
        addFeederTitle: "फीडर जोड़ें",
        feederCodeLabel: "फीडर कोड (केवल संख्या)*",
        feederNameLabel: "फीडर का नाम*",
        parentGssLabel: "पेरेंट GSS*",
        createFeederBtn: "फीडर बनाएं",
        manageFeedersTitle: "फीडर प्रबंधन",
        noFeedersFound: "कोई फीडर नहीं मिला।",
        addFeederBtn: "नया फीडर जोड़ें",
        deleteFeederConfirm: "इस फीडर को हटाएं? इसके सभी पोल, लाइन, DT और उपभोक्ता स्थायी रूप से हटा दिए जाएंगे।",
        toastFeederDeleted: "फीडर सफलतापूर्वक हटाया गया!",
        toastFeederUpdated: "फीडर सफलतापूर्वक अपडेट हुआ!",
        editFeederTitle: "फीडर संपादित करें",
        objectFilter: "ऑब्जेक्ट फ़िल्टर",
        filterPoles: "पोल",
        filterDt: "DT",
        filterConsumers: "उपभोक्ता",
        applyBtn: "लागू करें",
        toastFiltersUpdated: "फ़िल्टर अपडेट हुआ",
        orphanFound: "अनाथ नोड्स मिले",
        poleLabel: "पोल:",
        typeLabel: "प्रकार:",
        zoomBtn: "ज़ूम",
        toastLocationUpdated: "स्थान अपडेट हुआ!",
        moveTargetPrefix: "स्थानांतरित करें:",
        liveTrackDisabled: "लाइव ट्रैकिंग बंद कर दी गई।",
        fetchingLocation: "स्थान प्राप्त किया जा रहा है...",
        geoNotFound: "जियोलोकेशन API नहीं मिला।",
        gpsError: "GPS त्रुटि। कृपया सुनिश्चित करें कि लोकेशन अनुमति दी गई है।",
        pdfLibError: "PDF जेनरेटर लोड त्रुटि।",
        noDtGssToPlot: "प्लॉट करने के लिए कोई DT/GSS नोड नहीं मिला!",
        generatingPdf: "A0 SLD PDF बनाया जा रहा है...",
        preparingExport: "निर्यात तैयार किया जा रहा है...",
        fileSavedDownloads: "फ़ाइल डाउनलोड फ़ोल्डर में सहेजी गई!",
        fileWriteError: "फ़ाइल लिखने में त्रुटि",
        fileCreateError: "फ़ाइल बनाने में त्रुटि",
        downloadsAccessError: "डाउनलोड फ़ोल्डर एक्सेस करने में त्रुटि",
        fileDownloadedLocal: "फ़ाइल डिवाइस में डाउनलोड हो गई!",
        exportFailedPrefix: "निर्यात विफल:",
        invalidBackupFormat: "अवैध बैकअप फॉर्मेट! मूल डेटा संरचना गायब है।",
        backupParseError: "फ़ाइल पढ़ने में त्रुटि। कृपया सुनिश्चित करें कि यह वैध JSON बैकअप फ़ाइल है।",
        dataImported: "डेटा सफलतापूर्वक इंपोर्ट हुआ!",
        deletionCancelledMismatch: "हटाना रद्द: GSS कोड मेल नहीं खाया।",
        typeGssCodeConfirm: "पुष्टि के लिए कृपया नीचे GSS कोड टाइप करें",
        noOrphanFound: "कोई अनाथ पोल या नोड नहीं मिला! नेटवर्क पूरी तरह जुड़ा हुआ है।",
        btnEdit: "संपादित करें", btnMove: "स्थानांतरित करें", btnDelete: "हटाएं", btnRelocate: "स्थान बदलें",
        codeLabel: "कोड:", parentLabel: "पेरेंट:", ratingLabel: "रेटिंग:", connectedToLabel: "जुड़ा हुआ है:",
        fromToLabel: "से-तक:", distanceLabel: "दूरी:", connectedToLower: "जुड़ा हुआ है:", feederFallback: "फीडर"
    }
};

function t(key) { const lang = appState.settings.language || 'en'; return (i18n[lang] && i18n[lang][key]) ? i18n[lang][key] : (i18n['en'][key] || key); }

function translateApp() {
    document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.getAttribute('data-i18n')); });
    const searchBar = document.getElementById('appSearchBar'); if (searchBar) searchBar.placeholder = t('searchPlaceholder');
}

function getActiveNetwork() {
    if (!appState.feeders[appState.currentFeederCode]) appState.currentFeederCode = Object.keys(appState.feeders)[0] || "1";
    let net = appState.feeders[appState.currentFeederCode];
    if (!net) { net = { feeder: { name: "11 kV Feeder-01", code: "1", subdivCode: "SD-01", parentGss: "1" }, poles: [], dts: [], lines: [], consumers: [] }; appState.feeders[appState.currentFeederCode] = net; }
    if (!Array.isArray(net.poles)) net.poles = []; if (!Array.isArray(net.lines)) net.lines = []; if (!Array.isArray(net.dts)) net.dts = []; if (!Array.isArray(net.consumers)) net.consumers = [];
    return net;
}

function showToast(msg) {
    const toast = document.getElementById('app-toast'); const msgElem = document.getElementById('toast-msg');
    if (!toast || !msgElem) return; msgElem.innerText = msg; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3500);
}

function setSyncStatus(status) {
    const ind = document.getElementById('sync-indicator'); if(!navigator.onLine) status = 'offline';
    if(status === 'syncing') ind.innerHTML = '<i class="fa-solid fa-cloud-arrow-up sync-active"></i>';
    else if(status === 'synced') ind.innerHTML = '<i class="fa-solid fa-cloud-check sync-success"></i>';
    else ind.innerHTML = '<i class="fa-solid fa-cloud-xmark sync-error"></i>';
}

function syncToSupabase() {
    if (!appState.user.isLoggedIn || !appState.user.id) return; setSyncStatus('syncing');
    const dataToSync = JSON.parse(JSON.stringify(appState)); delete dataToSync.user; delete dataToSync.orphanPoleIds;
    supabaseClient.from('survey_data').upsert({ user_id: appState.user.id, data: dataToSync, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .then(({error}) => { if(error) setSyncStatus('offline'); else setSyncStatus('synced'); }).catch(() => setSyncStatus('offline'));
}

async function pullFromSupabase() {
    if (!appState.user.isLoggedIn || !appState.user.id) return; setSyncStatus('syncing');
    const isAdmin = appState.user.email === ADMIN_EMAIL; let query = supabaseClient.from('survey_data').select('data');
    if (!isAdmin) query = query.eq('user_id', appState.user.id);
    try {
        const { data, error } = await query; if (error) throw error;
        if (data && data.length > 0) {
            if (isAdmin) {
                appState.feeders = {}; appState.gssNodes = {};
                data.forEach(row => { const cloudData = row.data; if (cloudData.gssNodes) Object.assign(appState.gssNodes, cloudData.gssNodes); if (cloudData.feeders) { Object.keys(cloudData.feeders).forEach(fCode => { appState.feeders[fCode] = cloudData.feeders[fCode]; }); } });
            } else {
                const cloudData = data[0].data; appState.feeders = cloudData.feeders || appState.feeders; appState.gssNodes = cloudData.gssNodes || appState.gssNodes; appState.currentFeederCode = cloudData.currentFeederCode || appState.currentFeederCode;
            }
            await localforage.setItem(DB_KEY, appState); renderEntireNetwork(); setSyncStatus('synced'); centerMapOnGSS();
        }
    } catch (err) { console.error("Sync error:", err); setSyncStatus('offline'); }
}

function triggerPersistence() { localforage.setItem(DB_KEY, appState).catch(() => localStorage.setItem(DB_KEY, JSON.stringify(appState))); syncToSupabase(); }

let authMode = 'login';
window.toggleAuthMode = function() {
    authMode = authMode === 'login' ? 'signup' : 'login';
    document.getElementById('loginBtn').style.display = authMode === 'login' ? 'inline-block' : 'none';
    document.getElementById('signupBtn').style.display = authMode === 'signup' ? 'inline-block' : 'none';
    document.getElementById('signupNameField').style.display = authMode === 'signup' ? 'block' : 'none';
    document.getElementById('authToggleText').innerText = authMode === 'login' ? "Need an account? Sign Up" : "Already have an account? Login";
}

function applyAuthUIVisuals() {
    document.getElementById('auth-screen').style.display = 'none'; document.getElementById('app-container').style.display = 'flex';
    document.getElementById('userNameDisplay').innerText = appState.user.name; document.getElementById('userEmailDisplay').innerText = appState.user.email;
    const adminCard = document.getElementById('adminPasswordCard'); if (adminCard) adminCard.style.display = (appState.user.email === ADMIN_EMAIL) ? 'block' : 'none';
}

window.handleSupabaseAuth = async function(mode) {
    const email = document.getElementById('authEmail').value.trim(), password = document.getElementById('authPassword').value.trim(), name = document.getElementById('authName').value.trim();
    if(!email || !password) return alert(t('emailPassRequired')); showToast(t('authProcessing')); let response;
    if (mode === 'signup') {
        if(!name) return alert(t('enterFullName')); response = await supabaseClient.auth.signUp({ email, password, options: { data: { full_name: name } } });
    } else response = await supabaseClient.auth.signInWithPassword({ email, password });
    if (response.error) alert(response.error.message);
    else if (response.data.user) {
        appState.user.isLoggedIn = true; appState.user.email = response.data.user.email; appState.user.id = response.data.user.id;
        appState.user.name = response.data.user.user_metadata?.full_name || email.split('@')[0];
        applyAuthUIVisuals(); pullFromSupabase(); showToast(t('authLoginSuccess'));
    }
}
window.changeAdminPassword = async function() {
    const newPass = document.getElementById('newAdminPassword').value.trim(); if (!newPass || newPass.length < 6) return alert(t('adminPassMin'));
    const { error } = await supabaseClient.auth.updateUser({ password: newPass });
    if (error) alert("Error updating password: " + error.message); else { alert(t('adminPassUpdated')); document.getElementById('newAdminPassword').value = ''; }
}
window.handleSupabaseLogout = async function() { await supabaseClient.auth.signOut(); await localforage.clear(); localStorage.removeItem(DB_KEY); location.reload(); }

/* ====== MAP LAYER SETUP & LIVE TRACKING ====== */
const map = L.map('map', { 
    zoomControl: false, attributionControl: false, preferCanvas: true, rotate: true, touchRotate: true, shiftKeyRotate: true, bearing: 0, zoomAnimation: false, markerZoomAnimation: false, fadeAnimation: false
}).setView([26.9150, 75.7830], 16);

// Req 3: Dynamic Zoom Visibility Hierarchy Engine
function updateMapZoomClasses() {
    const z = map.getZoom(); const mapEl = document.getElementById('map');
    mapEl.classList.remove('zoom-hide-consumers', 'zoom-hide-lt-poles', 'zoom-hide-lt-lines', 'zoom-hide-ht-poles', 'zoom-hide-dts', 'zoom-transform-gss');
    if (z <= 20) mapEl.classList.add('zoom-hide-consumers');
    if (z <= 19) mapEl.classList.add('zoom-hide-lt-poles');
    if (z <= 18) mapEl.classList.add('zoom-hide-lt-lines');
    if (z <= 17) mapEl.classList.add('zoom-hide-ht-poles');
    if (z <= 16) mapEl.classList.add('zoom-hide-dts');
    if (z <= 14) mapEl.classList.add('zoom-transform-gss');
}
map.on('zoomend', updateMapZoomClasses); setTimeout(updateMapZoomClasses, 100);

const tileLayers = { 
    hybrid: { name: 'Google Hybrid', layer: L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 22 }) }, 
    street: { name: 'Google Street Map', layer: L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', { maxZoom: 22 }) },
    osm: { name: 'OpenStreetMap', layer: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 22 }) }
};
let currentTileIndex = 0; const layerKeys = Object.keys(tileLayers); tileLayers[layerKeys[currentTileIndex]].layer.addTo(map);

window.toggleMapLayer = function() { 
    map.removeLayer(tileLayers[layerKeys[currentTileIndex]].layer); currentTileIndex = (currentTileIndex + 1) % layerKeys.length; 
    tileLayers[layerKeys[currentTileIndex]].layer.addTo(map); document.getElementById('layer-indicator').innerText = tileLayers[layerKeys[currentTileIndex]].name;
}

const featureGroups = { gss: L.featureGroup().addTo(map), lines: L.featureGroup().addTo(map), consumerLines: L.featureGroup().addTo(map), poles: L.featureGroup().addTo(map), dts: L.featureGroup().addTo(map), consumers: L.featureGroup().addTo(map) };
map.on('move', () => { const c = map.getCenter(); document.getElementById('reticle-coordinates').innerText = `${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`; });

function centerMapOnGSS() {
    const net = getActiveNetwork(); const gss = appState.gssNodes[net.feeder.parentGss]; setTimeout(() => { map.invalidateSize(); }, 200);
    if (gss && typeof gss.lat === 'number') map.setView([gss.lat, gss.lng], 16);
}

window.liveTrackingId = null; window.liveUserMarker = null;
window.toggleLiveTracking = function() {
    if (!navigator.geolocation) return alert(t('geoNotFound'));
    if (window.liveTrackingId) {
        navigator.geolocation.clearWatch(window.liveTrackingId); window.liveTrackingId = null;
        if (window.liveUserMarker) { map.removeLayer(window.liveUserMarker); window.liveUserMarker = null; }
        document.getElementById('liveTrackBtn').style.color = '#ef4444'; showToast(t('liveTrackDisabled'));
    } else {
        showToast(t('fetchingLocation'));
        window.liveTrackingId = navigator.geolocation.watchPosition((pos) => {
            const lat = pos.coords.latitude, lng = pos.coords.longitude;
            if (!window.liveUserMarker) {
                const humanIcon = L.divIcon({ className: 'live-human-icon', html: '', iconSize: [24,24], iconAnchor: [12,12] });
                window.liveUserMarker = L.marker([lat, lng], {icon: humanIcon, zIndexOffset: 5000}).addTo(map);
            } else window.liveUserMarker.setLatLng([lat, lng]);
            map.setView([lat, lng]); document.getElementById('liveTrackBtn').style.color = '#10b981';
        }, (err) => alert(t('gpsError')), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    }
}

/* ====== GIS CORE LOGIC (REQ 2 & REQ 6) ====== */
function renderEntireNetwork() {
    try {
        updateOrphanStatus(); Object.values(featureGroups).forEach(g => g.clearLayers()); const net = getActiveNetwork(), f = appState.filters;

        // Req 6: Strict Feeder GSS Selection (Only Render Parent GSS for current feeder)
        const activeGssCode = net.feeder.parentGss;
        const gss = appState.gssNodes[activeGssCode];
        if (gss && typeof gss.lat === 'number') {
            if (!(appState.activeMove && appState.activeMove.id === gss.code)) {
                // Req 3: Support GSS transformation mapping via wrapper logic
                const gssIcon = L.divIcon({ className: 'gss-wrapper', html: `<div class="gss-square-icon"><span>GSS</span></div><div class="gss-mini-dot"></div>`, iconSize: [36,36], iconAnchor: [18,18] });
                const m = L.marker([gss.lat, gss.lng], { icon: gssIcon, zIndexOffset: 500 });
                // Req 2: Force exact popup placement
                m.on('click', () => {
                    const html = `<div style="padding:4px;"><b style="color:#b91c1c; font-size:1.1rem;">${gss.name}</b><br><small>${t('codeLabel')} ${gss.code}</small><div style="display:flex; gap:6px; margin-top:8px;"><button style="flex:1; padding:8px; background:#eff6ff; border:none; border-radius:6px;" onclick="window.openEditModal('gss','${gss.code}')">${t('btnEdit')}</button><button style="flex:1; padding:8px; background:#fef3c7; border:none; border-radius:6px;" onclick="window.relocateGss('${gss.code}')">${t('btnRelocate')}</button></div></div>`;
                    L.popup({ offset: [0,0], autoPan: false }).setLatLng([gss.lat, gss.lng]).setContent(html).openOn(map);
                }); featureGroups.gss.addLayer(m);
            }
        }

        if (f.poles) {
            net.poles.forEach(p => {
                const isOrphan = appState.orphanPoleIds.has(p.id), isLT = p.lineType === 'LT';
                if (appState.activeMove && appState.activeMove.id === p.id) return;
                const iconClass = isLT ? 'lt-pole-icon' : 'pole-marker-icon'; const size = isLT ? [20, 20] : [24, 24];
                let displayNo = p.poleNo; if (isLT && String(p.poleNo).includes('-')) displayNo = String(p.poleNo).split('-')[1];

                const m = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: iconClass + (isOrphan ? ' orphan-pulse' : ''), html: `<span>${displayNo}</span>`, iconSize: size, iconAnchor: [size[0]/2, size[1]/2] }), zIndexOffset: 200 });
                // Req 2: Popup coordinates strict anchoring
                m.on('click', () => {
                    const html = `<div style="padding:4px;"><b>${t('poleLabel')} ${p.poleNo} (${p.lineType || 'HT'})</b><p style="margin:4px 0; font-size:0.8rem;">${t('parentLabel')} ${p.dtCode || t('feederFallback')}</p><div style="display:flex; gap:6px; margin-top:8px;"><button style="flex:1; padding:8px; background:#eff6ff; border:none; border-radius:6px;" onclick="window.openEditModal('pole','${p.id}')">${t('btnEdit')}</button><button style="flex:1; padding:8px; background:#fef3c7; border:none; border-radius:6px;" onclick="window.startObjectMove('POLE','${p.id}','${p.poleNo}')">${t('btnMove')}</button><button style="flex:1; padding:8px; background:#fee2e2; color:#dc2626; border:none; border-radius:6px;" onclick="window.deleteEntity('pole','${p.id}')">${t('btnDelete')}</button></div></div>`;
                    L.popup({ offset: [0,0], autoPan: false }).setLatLng([p.lat, p.lng]).setContent(html).openOn(map);
                }); featureGroups.poles.addLayer(m);
            });
        }

        if (f.dts) {
            net.dts.forEach(d => {
                if (!d.lat || !d.lng) { const p = net.poles.find(x => x.poleNo == d.parentPole); if (p) { d.lat = p.lat; d.lng = p.lng; } }
                if (d.lat && d.lng) {
                    const isOrphan = appState.orphanPoleIds.has(d.id); const numRating = String(d.rating).replace(/[^0-9]/g, '');
                    const locTitle = d.location ? d.location : `DT Code: ${d.code}`;
                    const m = L.marker([d.lat, d.lng], { icon: L.divIcon({ className: 'dt-square-icon' + (isOrphan ? ' orphan-pulse' : ''), html: `${numRating}`, iconSize: [28, 28], iconAnchor: [14, 14] }), zIndexOffset: 400 });
                    // Req 2: Strict popup origin
                    m.on('click', () => {
                        const html = `<div style="padding:6px;"><b style="color:#d97706; font-size:1.05rem;"><i class="fa-solid fa-location-dot"></i> ${locTitle}</b><p style="margin:6px 0; font-size:0.9rem; line-height:1.4;">${t('ratingLabel')} <b>${d.rating} kVA</b><br>${t('typeLabel')} <b>${d.phase || t('threePhase')}</b><br>${t('connectedToLabel')} <b>${d.parentPole ? t('poleLabel')+' '+d.parentPole : 'GSS'}</b></p><div style="display:flex; gap:6px; margin-top:8px;"><button style="flex:1; padding:6px; background:#eff6ff; border:none; border-radius:6px;" onclick="window.openEditModal('dt','${d.id}')">${t('btnEdit')}</button><button style="flex:1; padding:6px; background:#fee2e2; color:#dc2626; border:none; border-radius:6px;" onclick="window.deleteEntity('dt','${d.id}')">${t('btnDelete')}</button></div></div>`;
                        L.popup({ offset: [0,0], autoPan: false }).setLatLng([d.lat, d.lng]).setContent(html).openOn(map);
                    }); featureGroups.dts.addLayer(m);
                }
            });
        }

        net.lines.forEach(line => {
            const c1 = getNodeCoords(line.fromNode), c2 = getNodeCoords(line.toNode); 
            if (c1 && c2) { line.coords = [[c1.lat, c1.lng], [c2.lat, c2.lng]]; line.distanceMeters = window.calcDistance(c1.lat, c1.lng, c2.lat, c2.lng); } else return; 
            const spec = getLineSpec(line.type); if (!f[spec.filterKey]) return;
            
            const hitPoly = L.polyline(line.coords, { color: 'transparent', weight: 25, className: spec.lineClass }).addTo(featureGroups.lines);
            L.polyline(line.coords, { color: spec.color, weight: spec.weight, dashArray: spec.dash, lineCap: 'round', interactive: false, className: spec.lineClass }).addTo(featureGroups.lines);
            
            // Req 2: Absolute popup position mapping to line centroid
            hitPoly.on('click', () => {
                const html = `<div style="padding:4px;"><b style="color:${spec.color};">${spec.name}</b><p style="margin:4px 0;">${t('fromToLabel')} <b>${line.fromNode} ➔ ${line.toNode}</b></p><p style="margin:4px 0;">${t('distanceLabel')} <b>${window.formatDistance(line.distanceMeters||0)}</b></p><button style="width:100%; padding:8px; background:#fee2e2; color:#dc2626; border:none; border-radius:6px; font-weight:700;" onclick="window.deleteEntity('line','${line.id}')">${t('btnDelete')}</button></div>`;
                const midLat = (c1.lat + c2.lat) / 2; const midLng = (c1.lng + c2.lng) / 2;
                L.popup({ offset: [0,0], autoPan: false }).setLatLng([midLat, midLng]).setContent(html).openOn(map);
            });
        });

        if (f.consumers) {
            net.consumers.forEach(c => {
                if (appState.activeMove && appState.activeMove.id === c.id) return; 
                const m = L.marker([c.lat, c.lng], { icon: L.divIcon({ className: 'consumer-marker-icon', html: `<i class="fa-solid fa-house"></i>`, iconSize: [16,16], iconAnchor: [8,8] }), zIndexOffset: 100 });
                // Req 2: Perfect popup position mapping
                m.on('click', () => {
                    const html = `<div style="padding:4px;"><b>${c.name}</b><p style="color:#64748b; margin:4px 0;">K-No: ${c.kno} | ${t('connectedToLower')} ${c.parentRef}</p><div style="display:flex; gap:6px; margin-top:8px;"><button style="flex:1; padding:6px; background:#eff6ff; border:none; border-radius:6px;" onclick="window.openEditModal('consumer','${c.id}')">${t('btnEdit')}</button><button style="flex:1; padding:6px; background:#fef3c7; border:none; border-radius:6px;" onclick="window.startObjectMove('CONSUMER','${c.id}','${c.name}')">${t('btnMove')}</button><button style="flex:1; padding:6px; background:#fee2e2; color:#dc2626; border:none; border-radius:6px;" onclick="window.deleteEntity('consumer','${c.id}')">${t('btnDelete')}</button></div></div>`;
                    L.popup({ offset: [0,0], autoPan: false }).setLatLng([c.lat, c.lng]).setContent(html).openOn(map);
                }); featureGroups.consumers.addLayer(m);

                let parentStr = c.parentType === 'DT' ? `DT_${c.parentRef}` : `POLE_${c.parentRef}`; const pCoords = getNodeCoords(parentStr);
                if (pCoords) L.polyline([[c.lat, c.lng], [pCoords.lat, pCoords.lng]], { color: '#000000', weight: 1.2, dashArray: '4, 4', interactive: false, className: 'consumer-line-path' }).addTo(featureGroups.consumerLines);
            });
        }

        updateMapZoomClasses();

        let t11 = 0, tLT = 0, dt3ph = 0, dt1ph = 0; 
        net.lines.forEach(l => { if (getLineSpec(l.type).name.includes('LT')) tLT += (l.distanceMeters || 0); else t11 += (l.distanceMeters || 0); });
        net.dts.forEach(d => { if(d.phase === 'Single Phase') dt1ph++; else dt3ph++; });
        
        if(document.getElementById('kpi11')) document.getElementById('kpi11').innerText = window.formatDistance(t11);
        if(document.getElementById('kpiLT')) document.getElementById('kpiLT').innerText = window.formatDistance(tLT);
        document.getElementById('kpi3Ph').innerText = dt3ph; document.getElementById('kpi1Ph').innerText = dt1ph;
        document.getElementById('kpiCons').innerText = net.consumers.length;
        document.getElementById('feederSelectHeader').innerHTML = Object.keys(appState.feeders).map(code => `<option value="${code}" ${code === appState.currentFeederCode ? 'selected':''}>${appState.feeders[code].feeder.name}</option>`).join('');

    } catch(err) { console.error("Rendering error:", err); }
}

function saveSnapshot() {
    const net = getActiveNetwork(); historyStack.push(JSON.parse(JSON.stringify({ poles: net.poles, lines: net.lines, dts: net.dts, consumers: net.consumers })));
    if (historyStack.length > 15) historyStack.shift();
}

window.undoLastAction = function() {
    if (historyStack.length === 0) return showToast(t('toastUndoNone')); const prevState = historyStack.pop(), net = getActiveNetwork();
    net.poles = prevState.poles; net.lines = prevState.lines; net.dts = prevState.dts; net.consumers = prevState.consumers;
    renderEntireNetwork(); triggerPersistence(); showToast(t('toastUndoSuccess'));
}

/* ====== UI MENUS & UTILITIES ====== */
window.openFilterModal = function() {
    const f = appState.filters;
    openModal(`<div class="sheet-head"><div class="sheet-title"><i class="fa-solid fa-filter" style="color:#d97706;"></i> ${t('objectFilter')}</div><button class="sheet-close-btn" onclick="window.closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
        <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;"><b>${t('line11')}</b><label><input type="checkbox" id="flt11" ${f.lines11?'checked':''}></label></div>
            <div style="display:flex; justify-content:space-between; align-items:center;"><b>${t('lineLT')}</b><label><input type="checkbox" id="fltLT" ${f.linesLT?'checked':''}></label></div>
            <div style="display:flex; justify-content:space-between; align-items:center;"><b>${t('filterPoles')}</b><label><input type="checkbox" id="fltPoles" ${f.poles?'checked':''}></label></div>
            <div style="display:flex; justify-content:space-between; align-items:center;"><b>${t('filterDt')}</b><label><input type="checkbox" id="fltDTs" ${f.dts?'checked':''}></label></div>
            <div style="display:flex; justify-content:space-between; align-items:center;"><b>${t('filterConsumers')}</b><label><input type="checkbox" id="fltCons" ${f.consumers?'checked':''}></label></div>
        </div><button class="btn-action-primary" onclick="window.saveFilters()">${t('applyBtn')}</button>`);
}
window.saveFilters = function() {
    appState.filters.lines11 = document.getElementById('flt11').checked; appState.filters.linesLT = document.getElementById('fltLT').checked;
    appState.filters.poles = document.getElementById('fltPoles').checked; appState.filters.dts = document.getElementById('fltDTs').checked; appState.filters.consumers = document.getElementById('fltCons').checked;
    window.closeModal(); renderEntireNetwork(); showToast(t('toastFiltersUpdated'));
}

window.autoSaveSettings = function() { 
    appState.settings.unit = document.getElementById('setUnit').value; appState.settings.gpsInterval = parseFloat(document.getElementById('setGpsInterval').value);
    appState.settings.gpsAccuracy = parseFloat(document.getElementById('setGpsAccuracy').value); appState.settings.language = document.getElementById('setLanguage').value;
    triggerPersistence(); translateApp(); renderEntireNetwork(); showToast(t('toastSettings')); 
}

window.toggleSpeedDial = function(force) {
    const dial = document.getElementById('speed-dial-menu'), fab = document.getElementById('mainFabBtn'); if (!dial || !fab) return; 
    const isOpen = force !== undefined ? force : !dial.classList.contains('active'); dial.classList.toggle('active', isOpen); fab.classList.toggle('open', isOpen);
}

document.addEventListener('click', function(e) {
    const dial = document.getElementById('speed-dial-menu'); const fab = document.getElementById('mainFabBtn');
    if (dial && dial.classList.contains('active')) { if (!dial.contains(e.target) && !fab.contains(e.target)) { window.toggleSpeedDial(false); } }
});

window.toggleSidebar = function(open) { 
    document.getElementById('sidebar-drawer').classList.toggle('open', open); document.getElementById('sidebarBackdrop').classList.toggle('open', open); 
    if(open) window.renderGssSidebarList();
}

window.openModal = function(html) { document.getElementById('modalSheetContent').innerHTML = html; document.getElementById('formModalOverlay').classList.add('open'); translateApp(); }
window.closeModal = function() { document.getElementById('formModalOverlay').classList.remove('open'); }

window.openSettingsPage = function() { 
    window.toggleSidebar(false); document.getElementById('setUnit').value = appState.settings.unit || 'm';
    document.getElementById('setGpsInterval').value = appState.settings.gpsInterval || 3; document.getElementById('setGpsAccuracy').value = appState.settings.gpsAccuracy || 10;
    document.getElementById('setLanguage').value = appState.settings.language || 'en'; document.getElementById('settings-page').classList.add('open'); 
}
window.closeSettingsPage = function() { document.getElementById('settings-page').classList.remove('open'); }

// Req 6: Strict Data Feeder Swapping Mechanism
window.switchFeeder = function(code) { if (appState.feeders[code]) { appState.currentFeederCode = code; renderEntireNetwork(); triggerPersistence(); centerMapOnGSS(); } }

window.calcDistance = function(lat1, lon1, lat2, lon2) {
    const R = 6371e3, p1 = lat1 * Math.PI / 180, p2 = lat2 * Math.PI / 180, dp = (lat2 - lat1) * Math.PI / 180, dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dp/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
window.formatDistance = function(m) { return (appState.settings.unit === 'km') ? (m / 1000).toFixed(3) + ' KM' : m.toFixed(1) + ' M'; }
window.sortByDistance = function(nodes, lat, lng) { return nodes.slice().sort((a, b) => window.calcDistance(lat, lng, a.lat, a.lng) - window.calcDistance(lat, lng, b.lat, b.lng)); }

function getLineSpec(type) {
    const t_str = (type || '').toUpperCase();
    if (t_str.includes('LT')) return { name: 'LT LINE', color: '#10b981', weight: 2.2, dash: null, filterKey: 'linesLT', lineClass: 'lt-line-path' };
    return { name: '11 KV LINE', color: '#2563eb', weight: 3.5, dash: null, filterKey: 'lines11', lineClass: 'ht-line-path' };
}

function getNodeCoords(nodeId) { 
    const net = getActiveNetwork(), idStr = String(nodeId);
    if (idStr.startsWith('GSS_')) { const code = idStr.replace('GSS_', ''); if (appState.gssNodes[code]) return { lat: appState.gssNodes[code].lat, lng: appState.gssNodes[code].lng }; }
    if (idStr.startsWith('DT_')) { const code = idStr.replace('DT_', ''), d = net.dts.find(x => String(x.code) === code); if (d) return { lat: d.lat, lng: d.lng }; }
    if (idStr.startsWith('POLE_')) { const code = idStr.replace('POLE_', ''), p = net.poles.find(x => String(x.poleNo) === code); if (p) return { lat: p.lat, lng: p.lng }; }

    const p = net.poles.find(x => String(x.poleNo) === idStr); if (p) return { lat: p.lat, lng: p.lng };
    const d = net.dts.find(x => String(x.code) === idStr); if (d) return { lat: d.lat, lng: d.lng };
    if (appState.gssNodes[idStr]) return { lat: appState.gssNodes[idStr].lat, lng: appState.gssNodes[idStr].lng };
    if (idStr === 'GSS' || idStr === net.feeder.code) { const g = appState.gssNodes[net.feeder.parentGss]; if(g) return { lat: g.lat, lng: g.lng }; }
    return null; 
}

/* ====== ORPHAN CHECK & GSS MANAGEMENT ====== */
window.runOrphanNodeChecker = function() {
    updateOrphanStatus(); const net = getActiveNetwork(), orphanCount = appState.orphanPoleIds.size;
    if (orphanCount === 0) return showToast(t('noOrphanFound'));

    let html = `<div class="sheet-head"><div class="sheet-title" style="color:#d97706;"><i class="fa-solid fa-network-wired"></i> ${t('orphanFound')} (${orphanCount})</div><button class="sheet-close-btn" onclick="window.closeModal()"><i class="fa-solid fa-xmark"></i></button></div>`;
    html += `<div style="max-height:300px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">`;
    net.poles.forEach(p => {
        if (appState.orphanPoleIds.has(p.id)) {
            html += `<div style="display:flex; justify-content:space-between; align-items:center; background:#fef3c7; padding:10px; border-radius:8px;">
                <div><b>${t('poleLabel')} ${p.poleNo}</b><br><small>${t('typeLabel')} ${p.lineType || 'HT'}</small></div>
                <button class="action-btn-sm bg" onclick="window.zoomToEntity('${p.lat}', '${p.lng}')">${t('zoomBtn')}</button>
            </div>`;
        }
    }); html += `</div>`; openModal(html);
};

window.zoomToEntity = function(lat, lng) { window.closeModal(); map.flyTo([parseFloat(lat), parseFloat(lng)], 19, { duration: 1 }); };

window.toggleGssFolder = function() {
    const content = document.getElementById('gssFolderContent'), icon = document.getElementById('gssFolderIcon');
    if (!content || !icon) return; const isHidden = content.style.display === 'none'; content.style.display = isHidden ? 'block' : 'none'; 
    icon.className = isHidden ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'; if (isHidden) window.renderGssSidebarList();
};

window.renderGssSidebarList = function() {
    const container = document.getElementById('gssListContainer'); if (!container) return; let html = '';
    Object.values(appState.gssNodes).forEach(gss => {
        html += `<div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:8px; border-radius:6px; margin-top:6px; border:1px solid var(--border);">
            <div><b style="font-size:0.85rem;">${gss.name}</b><br><small style="color:var(--text-sub);">Code: ${gss.code}</small></div>
            <div style="display:flex; gap:4px;">
                <button class="action-btn-sm bg" onclick="window.relocateGss('${gss.code}')" title="Relocate GSS"><i class="fa-solid fa-location-crosshairs"></i></button>
                <button class="action-btn-sm bg" style="color:#ef4444;" onclick="window.deleteGssAndFeederStrict('${gss.code}')" title="Strict Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    }); container.innerHTML = html;
};

window.deleteGssAndFeederStrict = function(code) {
    const conf1 = confirm(t('confirmDel'));
    if (!conf1) return;
    const conf2 = prompt(`${t('typeGssCodeConfirm')} "${code}":`);
    if (conf2 !== code) return alert(t('deletionCancelledMismatch'));

    saveSnapshot();
    if (appState.gssNodes[code]) delete appState.gssNodes[code];
    
    const feedersToDelete = [];
    Object.keys(appState.feeders).forEach(fCode => { if (appState.feeders[fCode].feeder.parentGss === code) feedersToDelete.push(fCode); });
    feedersToDelete.forEach(fCode => delete appState.feeders[fCode]);
    
    if (!appState.feeders[appState.currentFeederCode] || feedersToDelete.includes(appState.currentFeederCode)) {
        const remainingFeeders = Object.keys(appState.feeders);
        appState.currentFeederCode = remainingFeeders.length > 0 ? remainingFeeders[0] : null;
    }

    renderEntireNetwork(); triggerPersistence(); window.renderGssSidebarList(); 
    showToast(t('toastDel'));
}

// Req 5: "Add Feeder" UI Functionality Form
window.openAddNewFeederModal = function() {
    const gssOpts = Object.values(appState.gssNodes).map(g => `<option value="${g.code}">${g.code} - ${g.name}</option>`).join('');
    openModal(`<div class="sheet-head"><div class="sheet-title"><i class="fa-solid fa-plus-circle"></i> ${t('addFeederTitle')}</div><button class="sheet-close-btn" onclick="window.closeModal()"><i class="fa-solid fa-xmark"></i></button></div><div class="form-row"><label>${t('feederCodeLabel')}</label><input type="number" id="newFdrCode" class="form-input" value="${Object.keys(appState.feeders).length + 1}"></div><div class="form-row"><label>${t('feederNameLabel')}</label><input type="text" id="newFdrName" class="form-input" placeholder="e.g. City Feed 11kV"></div><div class="form-row"><label>${t('parentGssLabel')}</label><select id="newFdrGss" class="form-select">${gssOpts}</select></div><button class="btn-action-primary" onclick="window.createNewFeeder()">${t('createFeederBtn')}</button>`);
}

// Req 5: Immediate saving and rendering of Added Feeders
window.createNewFeeder = function() {
    const code = document.getElementById('newFdrCode').value.trim(), name = document.getElementById('newFdrName').value.trim(), gss = document.getElementById('newFdrGss').value;
    if (!code || !name) return alert(t('fillReq')); 
    if (appState.feeders[code]) return alert(t('feederExists'));
    appState.feeders[code] = { feeder: { name, code, subdivCode: "SD-01", parentGss: gss }, poles: [], dts: [], lines: [], consumers: [] };
    appState.currentFeederCode = code; window.closeModal(); renderEntireNetwork(); triggerPersistence(); showToast(t('feederAdded'));
}

window.openAddGssModal = function() {
    window.toggleSidebar(false);
    openModal(`<div class="sheet-head"><div class="sheet-title"><i class="fa-solid fa-plus-circle"></i> ${t('addNewGssTitle')}</div><button class="sheet-close-btn" onclick="window.closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
        <div class="form-row"><label>${t('gssCodeLabel')}</label><input type="text" id="inpGssCode" class="form-input" placeholder="e.g. 132"></div>
        <div class="form-row"><label>${t('gssNameLabel')}</label><input type="text" id="inpGssName" class="form-input" placeholder="e.g. 132/33 kV Substation"></div>
        <button class="btn-action-primary" onclick="window.saveNewGss()">${t('saveGssAtCenter')}</button>`);
};
window.saveNewGss = function() {
    const code = document.getElementById('inpGssCode').value.trim(), name = document.getElementById('inpGssName').value.trim();
    if (!code || !name) return alert(t('enterGssCodeName'));
    if (appState.gssNodes[code]) return alert(t('gssCodeExists'));
    const center = map.getCenter(); appState.gssNodes[code] = { code, name, lat: parseFloat(center.lat.toFixed(6)), lng: parseFloat(center.lng.toFixed(6)) };
    window.closeModal(); renderEntireNetwork(); triggerPersistence(); showToast(t('toastGssAdded'));
};
window.relocateGss = function(gssCode) { map.closePopup(); window.toggleSidebar(false); window.startObjectMove('GSS', gssCode, `GSS (${gssCode})`); };

function updateOrphanStatus() {
    appState.orphanPoleIds.clear(); const net = getActiveNetwork(), adj = {}, gssCode = net.feeder.parentGss, gssId = 'GSS_' + gssCode; adj[gssId] = [];
    net.poles.forEach(p => adj['POLE_' + p.poleNo] = []); net.dts.forEach(d => adj['DT_' + d.code] = []);
    net.dts.forEach(d => { if(d.parentPole) { const pId = 'POLE_' + d.parentPole; if (!adj[pId]) adj[pId] = []; adj[pId].push('DT_' + d.code); adj['DT_' + d.code].push(pId); } });
    net.lines.forEach(l => { const u = String(l.fromNode), v = String(l.toNode); if (!adj[u]) adj[u] = []; if (!adj[v]) adj[v] = []; adj[u].push(v); adj[v].push(u); });
    const visited = new Set([gssId]), queue = [gssId];
    while (queue.length > 0) { const curr = queue.shift(); (adj[curr] || []).forEach(neighbor => { if (!visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor); } }); }
    net.poles.forEach(p => { if (!visited.has('POLE_' + p.poleNo)) appState.orphanPoleIds.add(p.id); });
    net.dts.forEach(d => { if (!visited.has('DT_' + d.code)) appState.orphanPoleIds.add(d.id); });
}

// Req 5/6: Manage Feeders — list, edit (rename / reassign parent GSS) and strictly delete feeders
window.openFeederConfigModal = function() {
    window.toggleSidebar(false);
    let rows = Object.values(appState.feeders).map(f => {
        const gss = appState.gssNodes[f.feeder.parentGss];
        return `<div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:10px; border-radius:8px; margin-bottom:8px; border:1px solid var(--border);">
            <div><b style="font-size:0.9rem;">${f.feeder.name}</b><br><small style="color:var(--text-sub);">${t('codeLabel')} ${f.feeder.code} | GSS: ${gss ? gss.name : '-'}</small></div>
            <div style="display:flex; gap:4px;">
                <button class="action-btn-sm bg" onclick="window.openEditFeederModal('${f.feeder.code}')" title="${t('btnEdit')}"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn-sm bg" style="color:#ef4444;" onclick="window.deleteFeederFromConfig('${f.feeder.code}')" title="${t('btnDelete')}"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');
    if (!rows) rows = `<p style="color:var(--text-sub); font-size:0.85rem; text-align:center; padding:20px 0;">${t('noFeedersFound')}</p>`;
    openModal(`<div class="sheet-head"><div class="sheet-title"><i class="fa-solid fa-tower-broadcast"></i> ${t('manageFeedersTitle')}</div><button class="sheet-close-btn" onclick="window.closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
        <div id="feederConfigList" style="max-height:340px; overflow-y:auto;">${rows}</div>
        <button class="btn-action-primary" onclick="window.closeModal(); window.openAddNewFeederModal();"><i class="fa-solid fa-plus"></i> ${t('addFeederBtn')}</button>`);
};

window.openEditFeederModal = function(code) {
    const f = appState.feeders[code]; if (!f) return;
    const gssOpts = Object.values(appState.gssNodes).map(g => `<option value="${g.code}" ${g.code === f.feeder.parentGss ? 'selected' : ''}>${g.code} - ${g.name}</option>`).join('');
    openModal(`<div class="sheet-head"><div class="sheet-title"><i class="fa-solid fa-pen"></i> ${t('editFeederTitle')}</div><button class="sheet-close-btn" onclick="window.closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
        <div class="form-row"><label>${t('feederNameLabel')}</label><input type="text" id="editFdrName" class="form-input" value="${f.feeder.name}"></div>
        <div class="form-row"><label>${t('parentGssLabel')}</label><select id="editFdrGss" class="form-select">${gssOpts}</select></div>
        <button class="btn-action-primary" onclick="window.saveEditedFeeder('${code}')">${t('saveChanges')}</button>`);
};

window.saveEditedFeeder = function(code) {
    const f = appState.feeders[code]; if (!f) return;
    const name = document.getElementById('editFdrName').value.trim(), gss = document.getElementById('editFdrGss').value;
    if (!name) return alert(t('fillReq'));
    f.feeder.name = name; f.feeder.parentGss = gss;
    window.closeModal(); renderEntireNetwork(); triggerPersistence(); showToast(t('toastFeederUpdated'));
    window.openFeederConfigModal();
};

window.deleteFeederFromConfig = function(code) {
    if (!confirm(t('deleteFeederConfirm'))) return;
    saveSnapshot(); delete appState.feeders[code];
    if (appState.currentFeederCode === code) { const remaining = Object.keys(appState.feeders); appState.currentFeederCode = remaining.length > 0 ? remaining[0] : null; }
    renderEntireNetwork(); triggerPersistence(); showToast(t('toastFeederDeleted'));
    window.openFeederConfigModal();
};

/* ====== TOP BAR SEARCH ======= */
window.toggleSearchBox = function() {
    const box = document.getElementById('searchBoxOverlay');
    if (box.style.display === 'none') { box.style.display = 'flex'; document.getElementById('appSearchBar').focus(); } else { box.style.display = 'none'; window.clearSearch(); }
}
window.handleSearch = function(e) {
    const query = e.target.value.toLowerCase().trim(), suggPanel = document.getElementById('searchSuggestions');
    if(query.length === 0) { suggPanel.classList.remove('active'); return; }
    const net = getActiveNetwork(); let results = [];
    net.consumers.forEach(c => { if (String(c.kno).toLowerCase().includes(query) || (c.name && c.name.toLowerCase().includes(query))) results.push({ type: 'CONSUMER', id: c.id, title: c.name, desc: `K-No: ${c.kno} | Connected to: ${c.parentRef}` }); });
    net.dts.forEach(d => { if (String(d.code).toLowerCase().includes(query) || String(d.rating).includes(query) || (d.location && d.location.toLowerCase().includes(query))) results.push({ type: 'DT', id: d.id, title: `DT Code: ${d.code}`, desc: `Rating: ${d.rating} kVA | Loc: ${d.location || 'N/A'}` }); });
    if (results.length > 0) {
        suggPanel.innerHTML = results.slice(0, 15).map(r => `<div class="suggestion-item" onclick="window.selectSearchResult('${r.type}', '${r.id}')"><div class="sugg-title"><span>${r.type === 'CONSUMER' ? '<i class="fa-solid fa-house" style="color:#3b82f6;"></i>' : '<i class="fa-solid fa-bolt" style="color:#f59e0b;"></i>'} ${r.title}</span></div><div class="sugg-desc">${r.desc}</div></div>`).join('');
        suggPanel.classList.add('active');
    } else { suggPanel.innerHTML = `<div style="padding:10px 12px; font-size:0.8rem; color:#64748b;">${t('noResults')}</div>`; suggPanel.classList.add('active'); }
}
window.clearSearch = function() { document.getElementById('appSearchBar').value = ''; document.getElementById('searchSuggestions').classList.remove('active'); }
window.selectSearchResult = function(type, id) {
    const net = getActiveNetwork(); window.clearSearch(); window.toggleSearchBox(); let target = null, popupHtml = '';
    if(type === 'CONSUMER') { target = net.consumers.find(c => c.id === id); if(target) popupHtml = `<div style="padding:4px;"><b>${target.name}</b><p style="color:#64748b; margin:4px 0;">K-No: ${target.kno} | Connected to: ${target.parentRef}</p><div style="display:flex; gap:6px; margin-top:8px;"><button style="flex:1; padding:6px; background:#eff6ff; border:none; border-radius:6px;" onclick="window.openEditModal('consumer','${target.id}')">Edit</button></div></div>`; } 
    else if(type === 'DT') { target = net.dts.find(d => d.id === id); if(target) popupHtml = `<div style="padding:4px;"><b style="color:#d97706;">DT: ${target.code}</b><p style="margin:4px 0;">Rating: ${target.rating} kVA<br>Loc: ${target.location || 'N/A'}</p><div style="display:flex; gap:6px; margin-top:8px;"><button style="flex:1; padding:8px; background:#eff6ff; border:none; border-radius:6px;" onclick="window.openEditModal('dt','${target.id}')">Edit</button></div></div>`; }
    if(target && target.lat) { map.flyTo([target.lat, target.lng], 19, { duration: 1 }); setTimeout(() => { L.popup({ offset: [0,0], autoPan: false }).setLatLng([target.lat, target.lng]).setContent(popupHtml).openOn(map); }, 1000); }
}

/* ====== CRUD LOGIC ====== */
window.openAddForm = function(type) {
    window.toggleSpeedDial(false); 
    if (type === 'POLE' || type === 'LTPOLE' || type === 'CONSUMER') { appState.placementType = type; document.getElementById('center-placement-pin').style.display = 'block'; document.getElementById('bottom-single-action').style.display = 'none'; document.getElementById('placement-confirm-bar').style.display = 'flex'; } 
    else window.showFormModal(type, null, null);
}
window.confirmPlacement = function() { document.getElementById('center-placement-pin').style.display = 'none'; document.getElementById('placement-confirm-bar').style.display = 'none'; document.getElementById('bottom-single-action').style.display = 'block'; const center = map.getCenter(); window.showFormModal(appState.placementType, parseFloat(center.lat.toFixed(6)), parseFloat(center.lng.toFixed(6))); }
window.cancelPlacement = function() { document.getElementById('center-placement-pin').style.display = 'none'; document.getElementById('placement-confirm-bar').style.display = 'none'; document.getElementById('bottom-single-action').style.display = 'block'; }

window.showFormModal = function(type, snapLat, snapLng) {
    const net = getActiveNetwork(); const center = map.getCenter(); snapLat = snapLat || parseFloat(center.lat.toFixed(6)); snapLng = snapLng || parseFloat(center.lng.toFixed(6));
    if (type === 'POLE') {
        const nextNo = net.poles.filter(p => p.lineType !== 'LT').length + 1;
        openModal(`<div class="sheet-head"><div class="sheet-title">${t('addHtPole')}</div><button class="sheet-close-btn" onclick="window.closeModal()"><i class="fa-solid fa-xmark"></i></button></div><div class="form-row"><label>${t('poleNumber')}</label><input type="number" id="inpPoleNo" class="form-input" value="${nextNo}"></div><input type="hidden" id="inpPoleCategory" value="HT"><input type="hidden" id="inpLat" value="${snapLat}"><input type="hidden" id="inpLng" value="${snapLng}"><button class="btn-action-primary" onclick="window.saveNewPole()">${t('saveHtPole')}</button>`);
    } else if (type === 'LTPOLE') {
        if (net.dts.length === 0) return alert(t('mustAddDtFirst'));
        let sortedDTs = window.sortByDistance(net.dts.map(d=>({id: d.code, lat: d.lat, lng: d.lng})), snapLat, snapLng); const dtOpts = sortedDTs.map(d => `<option value="${d.id}">DT: ${d.id} (${window.formatDistance(window.calcDistance(snapLat, snapLng, d.lat, d.lng))})</option>`).join('');
        openModal(`<div class="sheet-head"><div class="sheet-title">${t('addLtPole')}</div><button class="sheet-close-btn" onclick="window.closeModal()"><i class="fa-solid fa-xmark"></i></button></div><div class="form-row"><label>${t('associatedDt')}</label><select id="inpLTPoleDT" class="form-select">${dtOpts}</select></div><input type="hidden" id="inpPoleCategory" value="LT"><input type="hidden" id="inpLat" value="${snapLat}"><input type="hidden" id="inpLng" value="${snapLng}"><button class="btn-action-primary" onclick="window.saveNewLTPole()">${t('saveLtPole')}</button>`);
    } else if (type === 'LINE') {
        if (net.poles.length === 0) return alert(t('addPoleFirst'));
        window.filterLineNodes = function() {
            const type = document.getElementById('inpLineType').value, net = getActiveNetwork(), fromSel = document.getElementById('inpFromNode'), dtSelectorBox = document.getElementById('ltLineDTSelector');
            let defaultFrom = ''; const defInput = document.getElementById('inpDefaultFrom'); if(defInput) defaultFrom = String(defInput.value); const center = map.getCenter(); let nodes = [];
            if (type.includes('LT')) {
                dtSelectorBox.style.display = 'block'; const targetDTElem = document.getElementById('inpTargetDT'), selectedDT = targetDTElem ? targetDTElem.value : ''; if(!selectedDT) return;
                nodes = net.poles.filter(p => p.lineType === 'LT' && String(p.dtCode) === String(selectedDT)).map(p => ({...p, title: 'LT Pole: '+p.poleNo, id: 'POLE_' + p.poleNo}));
                const dtObj = net.dts.find(d => String(d.code) === String(selectedDT)); if(dtObj) nodes.push({id: 'DT_'+selectedDT, title: 'DT: '+selectedDT, lat: dtObj.lat, lng: dtObj.lng});
            } else {
                dtSelectorBox.style.display = 'none'; nodes = net.poles.filter(p => p.lineType !== 'LT').map(p => ({...p, title: 'HT Pole '+p.poleNo, id: 'POLE_' + p.poleNo}));
                const parentGss = appState.gssNodes[net.feeder.parentGss]; if (parentGss) nodes.push({id: 'GSS_'+parentGss.code, title: 'GSS ('+parentGss.code+')', lat: parentGss.lat, lng: parentGss.lng});
            }
            nodes = window.sortByDistance(nodes, center.lat, center.lng); if (!defaultFrom && nodes.length > 0) defaultFrom = nodes[0].id;
            let optsHtml = ''; nodes.forEach(n => { optsHtml += `<option value="${n.id}" ${n.id === defaultFrom ? 'selected' : ''}>${n.title} (${window.formatDistance(window.calcDistance(center.lat, center.lng, n.lat, n.lng))})</option>`; });
            fromSel.innerHTML = optsHtml; window.syncLineToSelect();
        };
        window.syncLineToSelect = function() {
            const type = document.getElementById('inpLineType').value, fromSel = document.getElementById('inpFromNode'), fromVal = fromSel && fromSel.options.length > 0 ? String(fromSel.value) : '';
            const toSel = document.getElementById('inpToNode'), net = getActiveNetwork(), center = map.getCenter(); let nodes = [];
            if (type.includes('LT')) {
                const targetDTElem = document.getElementById('inpTargetDT'), selectedDT = targetDTElem ? String(targetDTElem.value) : '';
                nodes = net.poles.filter(p => p.lineType === 'LT' && String(p.dtCode) === selectedDT && ('POLE_'+p.poleNo) !== fromVal).map(p => ({...p, title: 'LT Pole: '+p.poleNo, id: 'POLE_' + p.poleNo}));
                if(selectedDT && ('DT_'+selectedDT) !== fromVal) { const dtObj = net.dts.find(d => String(d.code) === selectedDT); if(dtObj) nodes.push({id: 'DT_'+selectedDT, title: 'DT: '+selectedDT, lat: dtObj.lat, lng: dtObj.lng}); }
            } else {
                nodes = net.poles.filter(p => p.lineType !== 'LT' && ('POLE_'+p.poleNo) !== fromVal).map(p => ({...p, title: 'HT Pole '+p.poleNo, id: 'POLE_' + p.poleNo}));
                const parentGss = appState.gssNodes[net.feeder.parentGss]; if (parentGss && ('GSS_'+parentGss.code) !== fromVal) nodes.push({id: 'GSS_'+parentGss.code, title: 'GSS ('+parentGss.code+')', lat: parentGss.lat, lng: parentGss.lng});
            }
            nodes = window.sortByDistance(nodes, center.lat, center.lng); toSel.innerHTML = nodes.map(n => `<option value="${n.id}">${n.title} (${window.formatDistance(window.calcDistance(center.lat, center.lng, n.lat, n.lng))})</option>`).join(''); 
        };
        const htNodes = net.poles.filter(p => p.lineType !== 'LT').map(p => ({id: 'POLE_'+p.poleNo, lat: p.lat, lng: p.lng}));
        const feederGss = appState.gssNodes[net.feeder.parentGss]; if(feederGss) htNodes.push({id: 'GSS_'+feederGss.code, lat: feederGss.lat, lng: feederGss.lng});
        let sortedHT = window.sortByDistance(htNodes, snapLat, snapLng); let initialDefaultFrom = sortedHT.length > 0 ? sortedHT[0].id : '';

        openModal(`<div class="sheet-head"><div class="sheet-title">${t('addLine')}</div><button class="sheet-close-btn" onclick="window.closeModal()"><i class="fa-solid fa-xmark"></i></button></div><div class="form-row"><label>${t('lineTypeLabel')}</label><select id="inpLineType" class="form-select" onchange="window.filterLineNodes()"><option value="11 KV LINE" selected>${t('line11')}</option><option value="LT LINE">${t('lineLT')}</option></select></div><div id="ltLineDTSelector" style="display:none; background:#f1f5f9; padding:8px; border-radius:8px; margin-bottom:12px;"><label style="font-size:0.75rem; font-weight:700;">${t('selectDtRouting')}</label><select id="inpTargetDT" class="form-select" onchange="window.filterLineNodes()"></select></div><input type="hidden" id="inpDefaultFrom" value="${initialDefaultFrom}"><div class="form-grid-2"><div class="form-row"><label>${t('fromNode')}</label><select id="inpFromNode" class="form-select" onchange="window.syncLineToSelect()"></select></div><div class="form-row"><label>${t('toNode')}</label><select id="inpToNode" class="form-select"></select></div></div><button class="btn-action-primary" onclick="window.saveNewLine()">${t('saveLine')}</button>`);
        setTimeout(() => { let sortedDTs = window.sortByDistance(net.dts.map(d=>({id: d.code, lat: d.lat, lng: d.lng})), snapLat, snapLng); document.getElementById('inpTargetDT').innerHTML = sortedDTs.map(d => `<option value="${d.id}">DT: ${d.id}</option>`).join(''); window.filterLineNodes(); }, 30);
    } else if (type === 'DT') {
        let parentNodes = net.poles.filter(p => p.lineType !== 'LT').map(p => ({id: p.poleNo, title: 'HT Pole '+p.poleNo, lat: p.lat, lng: p.lng})); const feederGss = appState.gssNodes[net.feeder.parentGss]; if(feederGss) parentNodes.push({id: feederGss.code, title: 'GSS '+feederGss.code, lat: feederGss.lat, lng: feederGss.lng});
        parentNodes = window.sortByDistance(parentNodes, snapLat, snapLng); const parentOpts = parentNodes.map(p => `<option value="${p.id}">${p.title} (${window.formatDistance(window.calcDistance(snapLat, snapLng, p.lat, p.lng))})</option>`).join('');
        openModal(`<div class="sheet-head"><div class="sheet-title">${t('addDt')}</div><button class="sheet-close-btn" onclick="window.closeModal()"><i class="fa-solid fa-xmark"></i></button></div><div class="form-row"><label>${t('connectedToParent')}</label><select id="inpDTParent" class="form-select">${parentOpts}</select></div><div class="form-grid-2"><div class="form-row"><label>${t('dtCode')}</label><input type="number" id="inpDTCode" class="form-input" value="${Math.floor(Math.random()*9000)}"></div><div class="form-row"><label>${t('phase')}</label><select id="inpDTPhase" class="form-select" onchange="window.updateDTRatingDropdowns('inpDTPhase', 'inpDTRating')"><option value="Three Phase" selected>${t('threePhase')}</option><option value="Single Phase">${t('singlePhase')}</option></select></div></div><div class="form-row"><label>${t('ratingKva')}</label><select id="inpDTRating" class="form-select"></select></div><div class="form-row"><label>${t('locationLandmark')}</label><input type="text" id="inpDTLocation" class="form-input" placeholder="e.g. Near Main Market"></div><button class="btn-action-primary" onclick="window.saveNewDT()">${t('saveDt')}</button>`);
        setTimeout(() => window.updateDTRatingDropdowns('inpDTPhase', 'inpDTRating'), 30);
    } else if (type === 'CONSUMER') {
        if (net.dts.length === 0) return alert(t('mustHaveDt')); let sortedDTs = window.sortByDistance(net.dts.map(d=>({id: d.code, lat: d.lat, lng: d.lng})), snapLat, snapLng); const dtOpts = sortedDTs.map(d => `<option value="${d.id}">DT: ${d.id} (${window.formatDistance(window.calcDistance(snapLat, snapLng, d.lat, d.lng))})</option>`).join('');
        openModal(`<div class="sheet-head"><div class="sheet-title">${t('addConsumer')}</div><button class="sheet-close-btn" onclick="window.closeModal()"><i class="fa-solid fa-xmark"></i></button></div><div class="form-row"><label>${t('selectParentDt')}</label><select id="inpConsDT" class="form-select" onchange="window.filterConsumerPoles()">${dtOpts}</select></div><div class="form-row"><label>${t('connectsTo')}</label><select id="inpConsParent" class="form-select"></select></div><div class="form-grid-2"><div class="form-row"><label>${t('knoLabel')}</label><input type="number" id="inpConsKno" class="form-input"></div><div class="form-row"><label>${t('loadLabel')}</label><input type="text" id="inpConsLoad" class="form-input" value="1 kW"></div></div><div class="form-row"><label>${t('consumerName')}</label><input type="text" id="inpConsName" class="form-input"></div><input type="hidden" id="inpLat" value="${snapLat}"><input type="hidden" id="inpLng" value="${snapLng}"><button class="btn-action-primary" onclick="window.saveNewConsumer()">${t('saveConsumer')}</button>`);
        setTimeout(() => window.filterConsumerPoles(), 30);
    }
}
window.updateDTRatingDropdowns = function(phaseId, ratingId) {
    const phase = document.getElementById(phaseId).value, ratingSel = document.getElementById(ratingId);
    if(phase === 'Single Phase') ratingSel.innerHTML = `<option value="5">5 kVA</option><option value="10">10 kVA</option><option value="16" selected>16 kVA</option><option value="25">25 kVA</option>`;
    else ratingSel.innerHTML = `<option value="10">10 kVA</option><option value="16">16 kVA</option><option value="25" selected>25 kVA</option><option value="63">63 kVA</option><option value="100">100 kVA</option><option value="160">160 kVA</option><option value="250">250 kVA</option><option value="315">315 kVA</option><option value="500">500 kVA</option>`;
}
window.filterConsumerPoles = function() {
    const net = getActiveNetwork(), selectedDT = document.getElementById('inpConsDT').value, centerLat = parseFloat(document.getElementById('inpLat').value), centerLng = parseFloat(document.getElementById('inpLng').value);
    let nodes = net.poles.filter(p => p.lineType === 'LT' && String(p.dtCode) === String(selectedDT)).map(p => ({...p, title: 'LT Pole: '+p.poleNo, id: p.poleNo}));
    const dtObj = net.dts.find(d => String(d.code) === String(selectedDT)); if(dtObj) nodes.push({id: selectedDT, title: 'Direct to DT: '+selectedDT, lat: dtObj.lat, lng: dtObj.lng});
    nodes = window.sortByDistance(nodes, centerLat, centerLng); document.getElementById('inpConsParent').innerHTML = nodes.map(n => `<option value="${n.id}">${n.title} (${window.formatDistance(window.calcDistance(centerLat, centerLng, n.lat, n.lng))})</option>`).join('');
}
window.saveNewPole = function() { 
    saveSnapshot(); const no = document.getElementById('inpPoleNo').value.trim(), category = document.getElementById('inpPoleCategory').value, lat = parseFloat(document.getElementById('inpLat').value), lng = parseFloat(document.getElementById('inpLng').value); 
    if (!no) return alert(t('enterPoleNumber')); const net = getActiveNetwork(); if (net.poles.some(p => String(p.poleNo) === no)) return alert(t('poleExists')); 
    net.poles.push({ id: 'P_'+Date.now(), poleNo: no, lineType: category, lat, lng }); window.closeModal(); renderEntireNetwork(); triggerPersistence(); showToast(t('toastHtPoleAdded'));
}
window.saveNewLTPole = function() {
    saveSnapshot(); const dtCode = document.getElementById('inpLTPoleDT').value, category = document.getElementById('inpPoleCategory').value, lat = parseFloat(document.getElementById('inpLat').value), lng = parseFloat(document.getElementById('inpLng').value); 
    if (!dtCode) return alert(t('selectDt')); const net = getActiveNetwork(); const existingLTPoles = net.poles.filter(p => p.lineType === 'LT' && String(p.dtCode) === String(dtCode)); const finalPoleNo = `${dtCode}-${existingLTPoles.length + 1}`;
    if (net.poles.some(p => String(p.poleNo) === String(finalPoleNo))) return alert(`${t('poleLabel')} ${finalPoleNo} ${t('alreadyExists')}`); 
    net.poles.push({ id: 'P_'+Date.now(), poleNo: finalPoleNo, lineType: category, dtCode: dtCode, lat, lng }); window.closeModal(); renderEntireNetwork(); triggerPersistence(); showToast(t('toastLtPoleAdded'));
}
window.saveNewLine = function() { 
    saveSnapshot(); const from = document.getElementById('inpFromNode').value, to = document.getElementById('inpToNode').value, type = document.getElementById('inpLineType').value; 
    if (from === to) return alert(t('cannotConnectSelf')); if (!to) return alert(t('selectTargetNode'));
    const net = getActiveNetwork(), spec = getLineSpec(type), existingLine = net.lines.find(l => (l.fromNode === from && l.toNode === to) || (l.fromNode === to && l.toNode === from));
    if(existingLine) return alert(t('lineExists'));
    const c1 = getNodeCoords(from), c2 = getNodeCoords(to); if(!c1 || !c2) return alert(t('invalidCoords')); const dist = window.calcDistance(c1.lat, c1.lng, c2.lat, c2.lng); 
    net.lines.push({ id: 'LN_'+Date.now(), type: spec.name, fromNode: from, toNode: to, distanceMeters: dist, coords: [[c1.lat, c1.lng], [c2.lat, c2.lng]] }); window.closeModal(); renderEntireNetwork(); triggerPersistence(); showToast(t('toastLineAdded'));
}
window.saveNewDT = function() { 
    saveSnapshot(); const parentRef = document.getElementById('inpDTParent').value, code = document.getElementById('inpDTCode').value.trim(), rating = parseFloat(document.getElementById('inpDTRating').value), phase = document.getElementById('inpDTPhase').value, location = document.getElementById('inpDTLocation').value.trim();
    if (!code) return alert(t('enterDtCode')); const net = getActiveNetwork(), p = net.poles.find(x => String(x.poleNo) === String(parentRef)); let lat = net.feeder.lat, lng = net.feeder.lng; if (p) { lat = p.lat; lng = p.lng; }
    net.dts.push({ id: 'DT_'+Date.now(), parentPole: parentRef, code, rating, phase, location, lat, lng }); window.closeModal(); renderEntireNetwork(); triggerPersistence(); showToast(t('toastDtAdded'));
}
window.saveNewConsumer = function() { 
    saveSnapshot(); const parentRef = document.getElementById('inpConsParent').value, kno = document.getElementById('inpConsKno').value.trim(), name = document.getElementById('inpConsName').value.trim(), load = document.getElementById('inpConsLoad').value.trim(), lat = parseFloat(document.getElementById('inpLat').value), lng = parseFloat(document.getElementById('inpLng').value); 
    const net = getActiveNetwork(); if(net.consumers.some(c => String(c.kno) === String(kno))) return alert(t('knoExists'));
    let parentType = 'POLE'; const p = net.poles.find(x => String(x.poleNo) === String(parentRef)); if (!p) parentType = 'DT';
    if (!name || !kno) return alert(t('enterNameKno')); 
    net.consumers.push({ id: 'CS_'+Date.now(), parentRef, parentType, kno, name, load, lat, lng }); window.closeModal(); renderEntireNetwork(); triggerPersistence(); showToast(t('toastConsumerAdded'));
}

function deleteDTLogic(dtId, net) {
    const d = net.dts.find(x => x.id === dtId); if(!d) return;
    const ltPolesToRemove = net.poles.filter(p => p.lineType === 'LT' && String(p.dtCode) === String(d.code)), ltPoleIds = ltPolesToRemove.map(p => String(p.poleNo)), ltPoleNodeIds = ltPoleIds.map(pn => 'POLE_' + pn);
    net.lines = net.lines.filter(l => l.fromNode !== ('DT_' + d.code) && l.toNode !== ('DT_' + d.code) && !ltPoleNodeIds.includes(String(l.fromNode)) && !ltPoleNodeIds.includes(String(l.toNode)));
    net.consumers = net.consumers.filter(c => { const isDirectToDT = (c.parentType === 'DT' && String(c.parentRef) === String(d.code)), isOnRemovedLTPole = (c.parentType === 'POLE' && ltPoleIds.includes(String(c.parentRef))); return !(isDirectToDT || isOnRemovedLTPole); });
    net.poles = net.poles.filter(p => !ltPoleIds.includes(String(p.poleNo))); net.dts = net.dts.filter(x => x.id !== dtId);
}
function deleteLTPoleLogic(p, net) { net.consumers = net.consumers.filter(c => !(c.parentType === 'POLE' && String(c.parentRef) === String(p.poleNo))); net.lines = net.lines.filter(l => String(l.fromNode) !== ('POLE_'+p.poleNo) && String(l.toNode) !== ('POLE_'+p.poleNo)); net.poles = net.poles.filter(x => x.id !== p.id); }
window.deleteEntity = function(type, id) {
    const net = getActiveNetwork(); if(!confirm(t('confirmDel'))) return; saveSnapshot();
    if (type === 'line') net.lines = net.lines.filter(x => x.id !== id); else if (type === 'consumer') net.consumers = net.consumers.filter(x => x.id !== id); else if (type === 'dt') deleteDTLogic(id, net);
    else if (type === 'pole') {
        const p = net.poles.find(x => x.id === id);
        if (p) { if (p.lineType === 'LT') deleteLTPoleLogic(p, net); else { const dtsOnPole = net.dts.filter(d => String(d.parentPole) === String(p.poleNo)); dtsOnPole.forEach(dt => deleteDTLogic(dt.id, net)); net.lines = net.lines.filter(l => l.fromNode !== ('POLE_'+p.poleNo) && l.toNode !== ('POLE_'+p.poleNo)); net.poles = net.poles.filter(x => x.id !== id); } }
    } else if (type === 'gss') { if (appState.gssNodes[id]) delete appState.gssNodes[id]; }
    map.closePopup(); renderEntireNetwork(); triggerPersistence(); showToast(t('toastDel'));
}
window.openEditModal = function(type, id) {
    map.closePopup(); const net = getActiveNetwork();
    if (type === 'pole') { const p = net.poles.find(x => x.id === id); if (!p) return; openModal(`<div class="sheet-head"><div class="sheet-title">${t('editPole')}</div><button class="sheet-close-btn" onclick="window.closeModal()"><i class="fa-solid fa-xmark"></i></button></div><div class="form-row"><label>${t('poleNumberLocked')}</label><input type="text" id="editPoleNo" class="form-input" value="${p.poleNo}" readonly disabled style="background-color:#e2e8f0; cursor:not-allowed; opacity:0.8;"></div><button class="btn-action-primary" onclick="window.saveEditedPole('${p.id}')">${t('saveChanges')}</button>`); } 
    else if (type === 'dt') { const d = net.dts.find(x => x.id === id); if (!d) return; openModal(`<div class="sheet-head"><div class="sheet-title">${t('editDt')}</div><button class="sheet-close-btn" onclick="window.closeModal()"><i class="fa-solid fa-xmark"></i></button></div><div class="form-row"><label>${t('dtCode')}</label><input type="number" id="editDTCode" class="form-input" value="${d.code}"></div><div class="form-row"><label>${t('locationLandmark')}</label><input type="text" id="editDTLocation" class="form-input" value="${d.location || ''}"></div><button class="btn-action-primary" onclick="window.saveEditedDT('${d.id}')">${t('saveChanges')}</button>`); } 
    else if (type === 'consumer') { const c = net.consumers.find(x => x.id === id); if (!c) return; openModal(`<div class="sheet-head"><div class="sheet-title">${t('editConsumer')}</div><button class="sheet-close-btn" onclick="window.closeModal()"><i class="fa-solid fa-xmark"></i></button></div><div class="form-row"><label>${t('consumerName')}</label><input type="text" id="editConsName" class="form-input" value="${c.name}"></div><div class="form-row"><label>${t('knoLabel')}</label><input type="number" id="editConsKno" class="form-input" value="${c.kno}"></div><button class="btn-action-primary" onclick="window.saveEditedConsumer('${c.id}')">${t('saveChanges')}</button>`); } 
    else if (type === 'gss') { const g = appState.gssNodes[id]; if (!g) return; openModal(`<div class="sheet-head"><div class="sheet-title">${t('editGss')}</div><button class="sheet-close-btn" onclick="window.closeModal()"><i class="fa-solid fa-xmark"></i></button></div><div class="form-row"><label>${t('gssNameLabel')}</label><input type="text" id="editGssName" class="form-input" value="${g.name}"></div><button class="btn-action-primary" onclick="window.saveEditedGss('${g.code}')">${t('saveChanges')}</button>`); }
}
window.saveEditedPole = function(id) { saveSnapshot(); window.closeModal(); showToast(t('toastPoleUpdated')); }
window.saveEditedDT = function(id) { saveSnapshot(); const net = getActiveNetwork(); const d = net.dts.find(x => x.id === id); if (!d) return; d.code = document.getElementById('editDTCode').value.trim(); d.location = document.getElementById('editDTLocation').value.trim(); window.closeModal(); renderEntireNetwork(); triggerPersistence(); showToast(t('toastUpdated')); }
window.saveEditedConsumer = function(id) { saveSnapshot(); const net = getActiveNetwork(); const c = net.consumers.find(x => x.id === id); if (!c) return; c.name = document.getElementById('editConsName').value.trim(); c.kno = document.getElementById('editConsKno').value.trim(); window.closeModal(); renderEntireNetwork(); triggerPersistence(); showToast(t('toastUpdated')); }
window.saveEditedGss = function(code) { saveSnapshot(); const g = appState.gssNodes[code]; if (g) g.name = document.getElementById('editGssName').value.trim(); window.closeModal(); renderEntireNetwork(); triggerPersistence(); showToast(t('toastGssUpdated')); }

window.startObjectMove = function(type, id, title) {
    map.closePopup(); appState.activeMove = { type, id }; document.getElementById('bottom-single-action').style.display = 'none'; document.getElementById('move-confirm-bar').style.display = 'flex'; document.getElementById('moveTargetTitle').innerText = `${t('moveTargetPrefix')} ${title}`;
    let target = null; let htmlContent = '';
    if(type === 'GSS') { target = appState.gssNodes[id]; htmlContent = `<div class="gss-square-icon" style="box-shadow: 0 10px 25px rgba(0,0,0,0.5);"><span>GSS</span></div>`; } 
    else {
        const net = getActiveNetwork(); 
        if (type === 'POLE') { target = net.poles.find(x => x.id === id); const isLT = target.lineType === 'LT'; let displayNo = target.poleNo; if (isLT && String(target.poleNo).includes('-')) displayNo = String(target.poleNo).split('-')[1]; htmlContent = `<div class="${isLT ? 'lt-pole-icon' : 'pole-marker-icon'}" style="box-shadow: 0 10px 25px rgba(0,0,0,0.5);"><span>${displayNo}</span></div>`; } 
        else if (type === 'CONSUMER') { target = net.consumers.find(x => x.id === id); htmlContent = `<div class="consumer-marker-icon" style="box-shadow: 0 10px 25px rgba(0,0,0,0.5);"><i class="fa-solid fa-house"></i></div>`; }
    }
    if (target && target.lat) { map.panTo([target.lat, target.lng]); const liveIconContainer = document.getElementById('live-move-icon'); liveIconContainer.innerHTML = htmlContent; liveIconContainer.style.display = 'block'; renderEntireNetwork(); }
}
window.confirmObjectMove = function() {
    if (!appState.activeMove) return; saveSnapshot(); const c = map.getCenter(); const lat = parseFloat(c.lat.toFixed(6)), lng = parseFloat(c.lng.toFixed(6)), net = getActiveNetwork(); 
    if (appState.activeMove.type === 'GSS') {
        const gss = appState.gssNodes[appState.activeMove.id];
        if(gss) { gss.lat = lat; gss.lng = lng; net.lines.forEach(l => { if (l.fromNode == gss.code) { l.coords[0] = [lat, lng]; l.distanceMeters = window.calcDistance(lat, lng, l.coords[1][0], l.coords[1][1]); } if (l.toNode == gss.code) { l.coords[1] = [lat, lng]; l.distanceMeters = window.calcDistance(l.coords[0][0], l.coords[0][1], lat, lng); } }); }
    } else {
        if (appState.activeMove.type === 'POLE') {
            const p = net.poles.find(x => x.id === appState.activeMove.id);
            if (p) { p.lat = lat; p.lng = lng; net.dts.forEach(d => { if (d.parentPole == p.poleNo) { d.lat = lat; d.lng = lng; } }); net.lines.forEach(l => { if (l.fromNode == p.poleNo) { l.coords[0] = [lat, lng]; l.distanceMeters = window.calcDistance(lat, lng, l.coords[1][0], l.coords[1][1]); } if (l.toNode == p.poleNo) { l.coords[1] = [lat, lng]; l.distanceMeters = window.calcDistance(l.coords[0][0], l.coords[0][1], lat, lng); } }); }
        } else if (appState.activeMove.type === 'CONSUMER') { const cons = net.consumers.find(x => x.id === appState.activeMove.id); if (cons) { cons.lat = lat; cons.lng = lng; } }
    }
    window.cancelObjectMove(); renderEntireNetwork(); triggerPersistence(); showToast(t('toastLocationUpdated'));
}
window.cancelObjectMove = function() { appState.activeMove = null; document.getElementById('live-move-icon').style.display = 'none'; document.getElementById('move-confirm-bar').style.display = 'none'; document.getElementById('bottom-single-action').style.display = 'block'; renderEntireNetwork(); }

async function smartExportFile(filename, dataBlobOrText, mimeType) {
    try {
        showToast(t('preparingExport'));
        const blob = dataBlobOrText instanceof Blob ? dataBlobOrText : new Blob([dataBlobOrText], { type: mimeType });
        
        if (window.cordova && cordova.file) {
            const storageLocation = cordova.file.externalRootDirectory + 'Download/';
            window.resolveLocalFileSystemURL(storageLocation, function(dirEntry) {
                dirEntry.getFile(filename, { create: true, exclusive: false }, function(fileEntry) {
                    fileEntry.createWriter(function(fileWriter) {
                        fileWriter.onwriteend = function() { showToast(t('fileSavedDownloads')); };
                        fileWriter.onerror = function(e) { console.error(e); showToast(t('fileWriteError')); };
                        fileWriter.write(blob);
                    });
                }, err => { console.error(err); showToast(t('fileCreateError')); });
            }, err => { console.error(err); showToast(t('downloadsAccessError')); });
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = 'none'; a.href = url; a.download = filename;
            document.body.appendChild(a); a.click();
            setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
            showToast(t('fileDownloadedLocal'));
        }

    } catch (err) { console.error("Export Error: ", err); alert(t('exportFailedPrefix') + " " + err.message); }
}

window.exportFullJSONBackup = async function() {
    window.toggleSidebar(false); const backupData = JSON.stringify(appState);
    await smartExportFile(`DISCOM_Backup_${new Date().getTime()}.json`, backupData, "application/json");
}

window.handleImportChoice = function(e) {
    const file = e.target.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const content = event.target.result; const importedData = JSON.parse(content);
            if (importedData.feeders && importedData.gssNodes) { appState = importedData; triggerPersistence(); renderEntireNetwork(); showToast(t('dataImported')); } 
            else alert(t('invalidBackupFormat'));
        } catch (err) { alert(t('backupParseError')); }
    };
    reader.readAsText(file); e.target.value = ''; window.toggleSidebar(false);
}

window.getCSVString = function() {
    const net = getActiveNetwork(); let csv = "\uFEFFWKT,Name,Type,ParentNode,Details\n"; 
    Object.values(appState.gssNodes).forEach(g => csv += `"POINT (${g.lng} ${g.lat})","${g.name}","GSS","","Code: ${g.code}"\n`);
    net.poles.forEach(p => csv += `"POINT (${p.lng} ${p.lat})","Pole ${p.poleNo}","POLE","${p.dtCode||p.poleNo}","Type: ${p.lineType}"\n`);
    net.dts.forEach(d => csv += `"POINT (${d.lng} ${d.lat})","DT ${d.code}","DT","${d.parentPole}","Rating: ${d.rating}kVA"\n`);
    net.consumers.forEach(c => csv += `"POINT (${c.lng} ${c.lat})","${c.name}","CONSUMER","${c.parentRef}","KNo: ${c.kno}"\n`);
    net.lines.forEach(l => { if (l.coords && l.coords.length === 2) csv += `"LINESTRING (${l.coords[0][1]} ${l.coords[0][0]}, ${l.coords[1][1]} ${l.coords[1][0]})","${l.type}","LINE","${l.fromNode} ➔ ${l.toNode}","Dist: ${(l.distanceMeters||0).toFixed(1)}m"\n`; });
    return csv;
}
window.exportDataToCSV = async function() { window.toggleSidebar(false); await smartExportFile(`${getActiveNetwork().feeder.name.replace(/\s+/g, '_')}_GE.csv`, window.getCSVString(), "text/csv;charset=utf-8;"); }

window.exportToAutoCAD_DXF = async function() { 
    window.toggleSidebar(false); let dxf = "0\nSECTION\n2\nENTITIES\n"; getActiveNetwork().lines.forEach(l => { if (l.coords && l.coords[0] && l.coords[1]) dxf += `0\nLINE\n8\n${l.type.replace(/\s+/g,'_')}\n10\n${l.coords[0][1]}\n20\n${l.coords[0][0]}\n30\n0\n11\n${l.coords[1][1]}\n21\n${l.coords[1][0]}\n31\n0\n`; }); dxf += "0\nENDSEC\n0\nEOF\n"; 
    await smartExportFile(`${getActiveNetwork().feeder.name.replace(/\s+/g, '_')}.dxf`, dxf, "application/dxf"); 
}

window.exportToGoogleEarth_KML = async function() { 
    window.toggleSidebar(false); const esc = u => u.replace(/[<>&'"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','\'':'&apos;','"':'&quot;'}[c]));
    const feederName = esc(getActiveNetwork().feeder.name); let kml = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n<name>${feederName}</name>\n`; 
    getActiveNetwork().lines.forEach(l => { if (l.coords) kml += `<Placemark><LineString><coordinates>${l.coords[0][1]},${l.coords[0][0]},0 ${l.coords[1][1]},${l.coords[1][0]},0</coordinates></LineString></Placemark>\n`; }); 
    getActiveNetwork().dts.forEach(d => { if (d.lat) kml += `<Placemark><Point><coordinates>${d.lng},${d.lat},0</coordinates></Point></Placemark>\n`; });
    kml += "</Document>\n</kml>"; await smartExportFile(`${getActiveNetwork().feeder.name.replace(/\s+/g, '_')}.kml`, kml, "application/vnd.google-earth.kml+xml"); 
}

// Req 1: Exclusive HT Node Plotting + Embedded Distance Texts + Shrunk DT Icons
window.generateCadSLDPdf = async function() { 
    window.toggleSidebar(false); const net = getActiveNetwork();
    if(!window.jspdf || !window.jspdf.jsPDF) return alert(t('pdfLibError'));
    
    showToast(t('generatingPdf'));
    const { jsPDF } = window.jspdf; const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a0' });
    
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    const allPoints = [];
    
    // Extractor Logic: Explicitly pushing ONLY the active feeder's GSS and DTs
    if(appState.gssNodes[net.feeder.parentGss]) allPoints.push(appState.gssNodes[net.feeder.parentGss]);
    net.dts.forEach(d => allPoints.push(d)); 
    if(allPoints.length === 0) return alert(t('noDtGssToPlot'));
    
    allPoints.forEach(p => {
        if(p.lat < minLat) minLat = p.lat; if(p.lat > maxLat) maxLat = p.lat;
        if(p.lng < minLng) minLng = p.lng; if(p.lng > maxLng) maxLng = p.lng;
    });
    
    const margin = 50; const pdfW = 1189 - (margin * 2); const pdfH = 841 - (margin * 2);
    const latDiff = maxLat - minLat || 0.01; const lngDiff = maxLng - minLng || 0.01;
    const scaleX = pdfW / lngDiff; const scaleY = pdfH / latDiff; const scale = Math.min(scaleX, scaleY);
    const offsetX = margin + (pdfW - (lngDiff * scale)) / 2; const offsetY = margin + (pdfH - (latDiff * scale)) / 2;
    
    function getPt(lat, lng) { return { x: offsetX + (lng - minLng) * scale, y: 841 - (offsetY + (lat - minLat) * scale) }; }

    doc.setFontSize(10); doc.setDrawColor(37, 99, 235); doc.setLineWidth(1.5);
    
    // Draw Only HT Lines + Render precise distance directly over the lines
    net.lines.forEach(l => {
        if(l.type.includes('LT')) return; // Strictly skip rendering LT
        const c1 = getNodeCoords(l.fromNode), c2 = getNodeCoords(l.toNode);
        if(c1 && c2) {
            const pt1 = getPt(c1.lat, c1.lng), pt2 = getPt(c2.lat, c2.lng); doc.line(pt1.x, pt1.y, pt2.x, pt2.y);
            const dist = (l.distanceMeters || window.calcDistance(c1.lat, c1.lng, c2.lat, c2.lng)).toFixed(0);
            const midX = (pt1.x + pt2.x) / 2; const midY = (pt1.y + pt2.y) / 2;
            let angle = Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x) * (180 / Math.PI); if (angle > 90 || angle < -90) angle += 180;
            
            doc.setTextColor(0, 0, 0); doc.setFontSize(6); // Tiny font
            doc.text(`${dist} M`, midX, midY - 1, { angle: angle, align: 'center' });
        }
    });

    // Draw Exclusively Gathered Nodes
    allPoints.forEach(p => {
        const pt = getPt(p.lat, p.lng);
        if(p.code && p.name && p.name.includes("Substation")) { 
            doc.setFillColor(185, 28, 28); doc.rect(pt.x - 6, pt.y - 6, 12, 12, 'FD');
            doc.setTextColor(255, 255, 255); doc.setFontSize(6); doc.text("GSS", pt.x, pt.y + 2, {align:'center'});
        } else if(p.rating) { 
            // Scaled DT Icons natively downsized 
            doc.setFillColor(245, 158, 11); doc.rect(pt.x - 2, pt.y - 2, 4, 4, 'FD'); 
            doc.setTextColor(0, 0, 0); doc.setFontSize(5); 
            const numOnly = String(p.rating).replace(/[^0-9]/g, ''); doc.text(numOnly, pt.x, pt.y + 1, {align:'center'});
        }
    });

    let t11 = 0, dt1ph = 0, dt3ph = 0;
    net.lines.forEach(l => { if(!l.type.includes('LT')) t11 += (l.distanceMeters||0); });
    net.dts.forEach(d => { if(d.phase === 'Single Phase') dt1ph++; else dt3ph++; });
    
    // Standard Professional Bottom Right Plot Header
    doc.setFillColor(255, 255, 255); doc.setDrawColor(0,0,0); doc.setLineWidth(0.5); doc.rect(1189 - 160, 841 - 70, 150, 60, 'FD');
    doc.setTextColor(0, 0, 0); doc.setFontSize(16); doc.text("DISCOM SLD REPORT", 1189 - 155, 841 - 55);
    doc.setFontSize(12); doc.text(`Feeder: ${net.feeder.name} (${net.feeder.code})`, 1189 - 155, 841 - 45);
    doc.text(`Total HT Line: ${(t11/1000).toFixed(3)} KM`, 1189 - 155, 841 - 35);
    doc.text(`1-Phase DTs: ${dt1ph}`, 1189 - 155, 841 - 25); doc.text(`3-Phase DTs: ${dt3ph}`, 1189 - 155, 841 - 15);

    await smartExportFile(`${net.feeder.name.replace(/\s+/g, '_')}_SLD.pdf`, doc.output('blob'), "application/pdf");
}

window.openAboutModal = function() {
    window.toggleSidebar(false);
    openModal(`
    <div class="sheet-head">
        <div class="sheet-title"><i class="fa-solid fa-circle-info"></i> ${t('about')}</div>
        <button class="sheet-close-btn" onclick="window.closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div style="text-align:center; padding: 20px 0;">
        <div class="auth-logo" style="color:var(--accent); font-size:3rem; margin-bottom:10px;"><i class="fa-solid fa-bolt-lightning"></i></div>
        <h2 style="font-size:1.4rem; font-weight:800; margin-bottom:5px;">DISCOM Survey Pro</h2>
        <p style="color:var(--text-sub); font-size:0.9rem; margin-bottom:20px;">Enterprise Survey App for DISCOM</p>
        <div style="background:#f1f5f9; padding:15px; border-radius:12px; border:1px solid var(--border);">
            <p style="font-weight:700; font-size:1rem; color:var(--text-main);">Developed by</p>
            <p style="font-size:1.2rem; font-weight:900; color:var(--accent); margin-top:4px;">Suraj Singh Mehta</p>
        </div>
        <p style="font-size:0.75rem; color:var(--text-sub); margin-top:20px;">Version 1.0.0</p>
    </div>
    `);
}

async function initializeApplication() {
    try {
        let data = await localforage.getItem(DB_KEY); if (!data) { const lsData = localStorage.getItem(DB_KEY); if (lsData) data = JSON.parse(lsData); }
        if (data && data.feeders) appState = data; translateApp(); 
        if (appState.user && appState.user.isLoggedIn) { applyAuthUIVisuals(); renderEntireNetwork(); centerMapOnGSS(); } 
        else { document.getElementById('app-container').style.display = 'none'; document.getElementById('auth-screen').style.display = 'flex'; }
        
        supabaseClient.auth.getSession().then(({ data }) => {
            if (data && data.session && data.session.user) {
                appState.user.isLoggedIn = true; appState.user.email = data.session.user.email; appState.user.id = data.session.user.id;
                appState.user.name = data.session.user.user_metadata?.full_name || data.session.user.email.split('@')[0];
                applyAuthUIVisuals(); pullFromSupabase(); 
            }
        });
    } catch (e) { console.error("Initialization Error:", e); }
}
document.addEventListener('deviceready', initializeApplication, false); 
if (!window.cordova) { window.addEventListener('DOMContentLoaded', initializeApplication); }
