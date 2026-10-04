const SUPABASE_URL = 'https://sxfyeublvtisndnzycib.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZnlldWJsdnRpc25kbnp5Y2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjkzOTEsImV4cCI6MjEwNDgwNTM5MX0.FENa8zOaDzlYZJI_HfWtallAkWukxSiM52-RGQ-CUmA';

let supabase = null;
let db = { nodes: null, lines: null, photos: null };

try {
    if (window.localforage) {
        db.nodes = localforage.createInstance({ name: "GIS", storeName: "nodes" });
        db.lines = localforage.createInstance({ name: "GIS", storeName: "lines" });
        db.photos = localforage.createInstance({ name: "GIS", storeName: "photos" });
    }
} catch (e) {
    console.error("LocalForage Error:", e);
}

try {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.error("Supabase init error:", e);
}

// FIX: window.Auth सेट किया ताकि HTML onclick काम करे
window.Auth = {
    
    // 1. New User Registration
    async signUp() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) return alert("Please enter email and password to create an account.");
        if (!supabase) return alert("Database offline. Cannot create account right now.");

        try {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) {
                alert("Sign Up Failed: " + error.message);
                return;
            }
            alert("Account Created Successfully! You can now click 'Secure Login' to enter.");
        } catch (e) {
            alert("Network Error during Sign Up.");
        }
    },

    // 2. Existing User Login
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
            this.showApp();
        }
    },

    // 3. Skip Login for testing
    skipLogin() {
        this.showApp();
    },

    showApp() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-ui').classList.remove('hidden');
        
        // सुरक्षित तरीके से मैप लोड करें
        if (window.App && typeof window.App.initMap === 'function') {
            window.App.initMap();
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
                this.showApp();
            } else {
                document.getElementById('auth-screen').classList.remove('hidden');
            }
        }, 1500); 
    },

    async logout() {
        if (supabase) {
            try { await supabase.auth.signOut(); } catch (e) {}
        }
        window.location.reload();
    }
};

// एप लोड होने पर सेशन चेक करें
document.addEventListener("DOMContentLoaded", () => {
    window.Auth.checkSession();
});
// App load hone par events aur session check karein
document.addEventListener("DOMContentLoaded", () => {
    
    // Buttons ko secure tarike se JavaScript se connect karna
    document.getElementById('login-btn').addEventListener('click', () => {
        window.Auth.login();
    });
    
    document.getElementById('signup-btn').addEventListener('click', () => {
        window.Auth.signUp();
    });
    
    document.getElementById('skip-btn').addEventListener('click', () => {
        window.Auth.skipLogin();
    });

    // Session check karein
    window.Auth.checkSession();
});
