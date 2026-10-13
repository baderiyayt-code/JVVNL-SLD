/* --- js/7_main.js --- */
DiscomApp.Main.requestAppPermissions = function() {
    if(window.cordova && cordova.plugins && cordova.plugins.permissions) {
        var permissions = cordova.plugins.permissions;
        var list = [ permissions.ACCESS_FINE_LOCATION, permissions.CAMERA, permissions.READ_EXTERNAL_STORAGE, 'android.permission.READ_MEDIA_IMAGES' ];
        permissions.requestPermissions(list, function() {
            permissions.checkPermission(permissions.ACCESS_FINE_LOCATION, function(locStatus) {
                if (locStatus.hasPermission) { document.getElementById('permission-overlay').style.display = 'none'; DiscomApp.Main.initializeAppPostPermissions(); } 
                else { document.getElementById('permission-overlay').style.display = 'flex'; }
            }, null);
        }, function() { document.getElementById('permission-overlay').style.display = 'flex'; });
    } else { document.getElementById('permission-overlay').style.display = 'none'; DiscomApp.Main.initializeAppPostPermissions(); }
};

DiscomApp.Main.initializeAppPostPermissions = async function() {
    try {
        DiscomApp.Map.initMapLayers();
        if (typeof supabase !== 'undefined') supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        let data = null; 
        if (typeof localforage !== 'undefined') data = await localforage.getItem(DB_KEY); 
        if (!data) { const lsData = localStorage.getItem(DB_KEY); if (lsData) data = JSON.parse(lsData); }
        
        if (data) { 
            if(data.feeders) DiscomApp.State.feeders = data.feeders;
            if(data.gssNodes) DiscomApp.State.gssNodes = data.gssNodes;
            if(data.settings) DiscomApp.State.settings = { ...DiscomApp.State.settings, ...data.settings };
            if(data.user) DiscomApp.State.user = { ...DiscomApp.State.user, ...data.user };
            if(data.currentFeederCode) DiscomApp.State.currentFeederCode = data.currentFeederCode;
            if(data.lastSyncTime) DiscomApp.State.lastSyncTime = data.lastSyncTime;
            DiscomApp.State.orphanPoleIds = new Set();
            if(DiscomApp.UI.updateFeederDropdown) DiscomApp.UI.updateFeederDropdown(); 
        } 
        
        if(DiscomApp.UI.applyTranslations) DiscomApp.UI.applyTranslations(); 
        if(DiscomApp.UI.applyTheme) DiscomApp.UI.applyTheme();
        
        if (DiscomApp.State.user && DiscomApp.State.user.isLoggedIn) { 
            if(DiscomApp.UI.applyAuthUIVisuals) DiscomApp.UI.applyAuthUIVisuals(); 
            setTimeout(() => { 
                if(map) map.invalidateSize(); 
                
                DiscomApp.State.appMode = 'inspect';
                
                if(DiscomApp.Map.renderEntireNetwork) DiscomApp.Map.renderEntireNetwork(); 
                if(DiscomApp.Map.centerMapOnLastObjectOrGSS) DiscomApp.Map.centerMapOnLastObjectOrGSS(); 
                if(DiscomApp.UI.checkOnboardingFlow) DiscomApp.UI.checkOnboardingFlow(); 
                if(DiscomApp.DB.updateUnsyncedBadge) DiscomApp.DB.updateUnsyncedBadge(); 
                
                const btn = document.getElementById('modeToggleBtn');
                if(btn) { btn.innerHTML = '<i class="fa-solid fa-eye"></i>'; btn.style.color = '#10b981'; }
                
                const fabContainer = document.getElementById('bottom-single-action');
                if(fabContainer) fabContainer.style.display = 'none';
                
                // NAYA: KPI Bar mobile touch pan scroll injection
                if(!document.getElementById('kpi-scroll-fix')) {
                    const style = document.createElement('style');
                    style.id = 'kpi-scroll-fix';
                    style.innerHTML = `
                        .kpi-row { touch-action: pan-x !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; overscroll-behavior-x: contain; }
                    `;
                    document.head.appendChild(style);
                }
                
            }, 300); 
        } else { 
            document.getElementById('app-container').style.display = 'none'; document.getElementById('auth-screen').style.display = 'flex'; 
        }
    } catch (e) { console.error("Init Error:", e); }
};

DiscomApp.Main.startAppStartupSequence = function() {
    setTimeout(() => {
        const loader = document.getElementById('erection-loader'); if(loader) loader.style.display = 'none';
        if(window.cordova && cordova.plugins && cordova.plugins.permissions) { DiscomApp.Main.requestAppPermissions(); } else DiscomApp.Main.initializeAppPostPermissions();
    }, 2000);
};

document.addEventListener("backbutton", function(e) {
    const modal = document.getElementById('formModalOverlay');
    const sheet = document.getElementById('object-bottom-sheet');
    if(modal && modal.classList.contains('open')) { DiscomApp.UI.closeModal(); e.preventDefault(); }
    else if(sheet && sheet.classList.contains('open')) { DiscomApp.UI.closeObjectSheet(); e.preventDefault(); }
}, false);

document.addEventListener('deviceready', DiscomApp.Main.startAppStartupSequence, false); 
if (!window.cordova) { window.addEventListener('DOMContentLoaded', DiscomApp.Main.startAppStartupSequence); }

// FIX: Instant Locate Me + Watch Position (Crosshair)
DiscomApp.Main.toggleLiveTracking = function() {
    const btn = document.getElementById('liveTrackBtn');
    if (liveTrackWatchId) {
        navigator.geolocation.clearWatch(liveTrackWatchId); liveTrackWatchId = null;
        if (liveTrackMarker && typeof map !== 'undefined') map.removeLayer(liveTrackMarker);
        if (liveTrackCircle && typeof map !== 'undefined') map.removeLayer(liveTrackCircle);
        liveTrackMarker = null; liveTrackCircle = null; btn.style.color = 'var(--text-main)'; DiscomApp.UI.showToast("Live Tracking Disabled");
    } else {
        btn.style.color = '#3b82f6'; DiscomApp.UI.showToast("Fetching exact location...");
        
        // Instant FlyTo Current Location First
        navigator.geolocation.getCurrentPosition((pos) => {
            if(map) map.flyTo([pos.coords.latitude, pos.coords.longitude], 19, {animate:true, duration:1});
        }, (err) => console.warn(err), { enableHighAccuracy: true });

        // Start tracking
        liveTrackWatchId = navigator.geolocation.watchPosition((pos) => {
            const lat = pos.coords.latitude, lng = pos.coords.longitude, acc = pos.coords.accuracy; 
            if(!liveTrackMarker && typeof map !== 'undefined') {
                liveTrackMarker = L.marker([lat, lng], { icon: L.divIcon({ className: 'live-gps-dot', html: '<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;"></div>', iconSize: [16,16], iconAnchor: [8,8] }), zIndexOffset: 9999 }).addTo(map);
                liveTrackCircle = L.circle([lat, lng], { radius: acc, color: '#3b82f6', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.15 }).addTo(map);
            } else if(liveTrackMarker && liveTrackCircle) {
                liveTrackMarker.setLatLng([lat, lng]); liveTrackCircle.setLatLng([lat, lng]); liveTrackCircle.setRadius(acc); 
            }
        }, () => { btn.style.color = 'var(--text-main)'; liveTrackWatchId = null; }, { enableHighAccuracy: true, maximumAge: 0 });
    }
};
