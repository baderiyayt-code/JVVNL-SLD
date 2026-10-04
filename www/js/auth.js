const SUPABASE_URL = 'https://sxfyeublvtisndnzycib.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZnlldWJsdnRpc25kbnp5Y2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjkzOTEsImV4cCI6MjEwNDgwNTM5MX0.FENa8zOaDzlYZJI_HfWtallAkWukxSiM52-RGQ-CUmA';

let supabase = null;
let db = { nodes: null, lines: null, photos: null };

// सुरक्षित तरीके से लोकल डेटाबेस इनिशियलाइज़ करें
try {
    if (window.localforage) {
        db.nodes = localforage.createInstance({ name: "GIS", storeName: "nodes" });
        db.lines = localforage.createInstance({ name: "GIS", storeName: "lines" });
        db.photos = localforage.createInstance({ name: "GIS", storeName: "photos" });
    }
} catch (e) {
    console.error("LocalForage Error:", e);
}

// सुरक्षित तरीके से Supabase इनिशियलाइज़ करें
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else {
        console.warn("Supabase library not found. App will run strictly offline.");
    }
} catch (e) {
    console.error("Supabase init error:", e);
}

const Auth = {
    async login() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) return alert("Please enter email and password.");
        if (!supabase) return alert("Database not connected. Please use 'Skip Login'.");

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                alert("Login Failed: " + error.message);
                return;
            }
            this.showApp();
        } catch (e) {
            alert("Database Connection Failed. Running offline.");
            this.showApp(); // क्रैश होने पर भी ऐप खुलने दें
        }
    },

    skipLogin() {
        this.showApp();
    },

    showApp() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-ui').classList.remove('hidden');
        
        // सुरक्षित तरीके से मैप लोड करें
        if (window.App && typeof window.App.initMap === 'function') {
            App.initMap();
        }
    },

    async checkSession() {
        setTimeout(async () => {
            let sessionActive = false;
            
            if (supabase) {
                try {
                    const { data } = await supabase.auth.getSession();
                    if (data && data.session) sessionActive = true;
                } catch (error) {
                    console.warn("Session check failed.");
                }
            }

            const splash = document.getElementById('splash-screen');
            if (splash) splash.classList.add('hidden');
            
            if (sessionActive) {
                Auth.showApp();
            } else {
                document.getElementById('auth-screen').classList.remove('hidden');
            }
        }, 1500); // 1.5 सेकंड बाद लॉगिन स्क्रीन लाएं
    },

    async logout() {
        if (supabase) {
            try { await supabase.auth.signOut(); } catch (e) {}
        }
        window.location.reload();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    Auth.checkSession();
});
