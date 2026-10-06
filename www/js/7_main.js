/* --- js/7_main.js --- */
DiscomApp.Main.requestAppPermissions = function() {
    if(window.cordova && cordova.plugins && cordova.plugins.permissions) {
        var permissions = cordova.plugins.permissions;
        var list = [ permissions.ACCESS_FINE_LOCATION, permissions.CAMERA, permissions.READ_EXTERNAL_STORAGE, 'android.permission.READ_MEDIA_IMAGES' ];
        permissions.requestPermissions(list, function(status) {
            permissions.checkPermission(permissions.ACCESS_FINE_LOCATION, function(locStatus) {
                if (locStatus.hasPermission) { document.getElementById('permission-overlay').style.display = 'none'; DiscomApp.Main.initializeAppPostPermissions(); } 
                else { document.getElementById('permission-overlay').style.display = 'flex'; DiscomApp.UI.showToast("Location strictly required!"); }
            }, null);
        }, function() { document.getElementById('permission-overlay').style.display = 'flex'; });
    } else { document.getElementById('permission-overlay').style.display = 'none'; DiscomApp.Main.initializeAppPostPermissions(); }
}

DiscomApp.Main.initializeAppPostPermissions = async function() {
    try {
        DiscomApp.Map.initMapLayers();
        if (typeof supabase !== 'undefined') supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        let data = null; 
        if (typeof localforage !== 'undefined') data = await localforage.getItem(DB_KEY); 
        if (!data) { const lsData = localStorage.getItem(DB_KEY); if (lsData) data = JSON.parse(lsData); }
        
        // FIX: SAFE DATA MERGING (Prevents Object.assign from destroying functions)
        if (data) { 
            if(data.feeders) DiscomApp.State.feeders = data.feeders;
            if(data.gssNodes) DiscomApp.State.gssNodes = data.gssNodes;
            if(data.settings) DiscomApp.State.settings = { ...DiscomApp.State.settings, ...data.settings };
            if(data.user) DiscomApp.State.user = { ...DiscomApp.State.user, ...data.user };
            if(data.filters) DiscomApp.State.filters = { ...DiscomApp.State.filters, ...data.filters };
            if(data.currentFeederCode) DiscomApp.State.currentFeederCode = data.currentFeederCode;
            if(data.photos) DiscomApp.State.photos = data.photos;
            if(data.deletedObjectIds) DiscomApp.State.deletedObjectIds = data.deletedObjectIds;
            if(data.deletedFeederCodes) DiscomApp.State.deletedFeederCodes = data.deletedFeederCodes;
            
            DiscomApp.State.orphanPoleIds = new Set();
            if(DiscomApp.UI.updateFeederDropdown) DiscomApp.UI.updateFeederDropdown(); 
        } 
        
        if(DiscomApp.UI.applyTranslations) DiscomApp.UI.applyTranslations(); 
        if(DiscomApp.UI.applyTheme) DiscomApp.UI.applyTheme();
        
        if (DiscomApp.State.user && DiscomApp.State.user.isLoggedIn) { 
            if(DiscomApp.UI.applyAuthUIVisuals) DiscomApp.UI.applyAuthUIVisuals(); 
            
            setTimeout(() => { 
                if(map) map.invalidateSize(); 
                if(DiscomApp.Map.renderEntireNetwork) DiscomApp.Map.renderEntireNetwork(); 
                if(DiscomApp.Map.centerMapOnLastObjectOrGSS) DiscomApp.Map.centerMapOnLastObjectOrGSS();
                if(DiscomApp.UI.checkOnboardingFlow) DiscomApp.UI.checkOnboardingFlow(); 
                if(DiscomApp.DB.updateUnsyncedBadge) DiscomApp.DB.updateUnsyncedBadge(); 
            }, 300); 
        } else { 
            document.getElementById('app-container').style.display = 'none'; 
            document.getElementById('auth-screen').style.display = 'flex'; 
        }
        
        if (supabaseClient) {
            supabaseClient.auth.getSession().then(({ data }) => {
                if (data && data.session && data.session.user) {
                    DiscomApp.State.user.isLoggedIn = true; DiscomApp.State.user.email = data.session.user.email; DiscomApp.State.user.id = data.session.user.id;
                    DiscomApp.State.user.name = data.session.user.user_metadata?.full_name || data.session.user.email.split('@')[0];
                    if(DiscomApp.UI.applyAuthUIVisuals) DiscomApp.UI.applyAuthUIVisuals(); 
                    if(DiscomApp.DB.pullFromSupabase) DiscomApp.DB.pullFromSupabase(); 
                }
            }).catch(err => console.log("Offline mode"));
        }
    } catch (e) { 
        console.error("Init Error:", e); 
        document.getElementById('app-container').style.display = 'none'; 
        document.getElementById('auth-screen').style.display = 'flex'; 
        if(DiscomApp.UI.showToast) DiscomApp.UI.showToast("Offline Mode / Load Error"); 
    }
}

DiscomApp.Main.startAppStartupSequence = function() {
    setTimeout(() => {
        const loader = document.getElementById('erection-loader'); if(loader) loader.style.display = 'none';
        if(typeof navigator !== 'undefined' && navigator.splashscreen) navigator.splashscreen.hide();
        if(window.cordova && cordova.plugins && cordova.plugins.permissions) { DiscomApp.Main.requestAppPermissions(); } else DiscomApp.Main.initializeAppPostPermissions();
    }, 2000);
}

document.addEventListener('deviceready', DiscomApp.Main.startAppStartupSequence, false); 
if (!window.cordova) { window.addEventListener('DOMContentLoaded', DiscomApp.Main.startAppStartupSequence); }

DiscomApp.Main.toggleLiveTracking = function() {
    const btn = document.getElementById('liveTrackBtn');
    if (liveTrackWatchId) {
        navigator.geolocation.clearWatch(liveTrackWatchId); liveTrackWatchId = null;
        if (liveTrackMarker && typeof map !== 'undefined') map.removeLayer(liveTrackMarker);
        if (liveTrackCircle && typeof map !== 'undefined') map.removeLayer(liveTrackCircle);
        liveTrackMarker = null; liveTrackCircle = null; btn.style.color = ''; DiscomApp.UI.showToast("Live Tracking Disabled");
    } else {
        btn.style.color = '#3b82f6'; DiscomApp.UI.showToast("Live Tracking Enabled");
        liveTrackWatchId = navigator.geolocation.watchPosition((pos) => {
            const lat = pos.coords.latitude, lng = pos.coords.longitude, acc = pos.coords.accuracy; 
            if(!liveTrackMarker && typeof map !== 'undefined') {
                liveTrackMarker = L.marker([lat, lng], { icon: L.divIcon({ className: 'live-gps-dot', html: '<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,0.5);"></div>', iconSize: [16,16], iconAnchor: [8,8] }), zIndexOffset: 9999 }).addTo(map);
                liveTrackCircle = L.circle([lat, lng], { radius: acc, color: '#3b82f6', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.15 }).addTo(map);
                map.setView([lat, lng], 19);
            } else if(liveTrackMarker && liveTrackCircle) {
                liveTrackMarker.setLatLng([lat, lng]); liveTrackCircle.setLatLng([lat, lng]); liveTrackCircle.setRadius(acc); 
            }
        }, (err) => { btn.style.color = ''; liveTrackWatchId = null; }, { enableHighAccuracy: true, maximumAge: 0 });
    }
};
