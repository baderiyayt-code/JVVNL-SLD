// Initialize Supabase (Replace with actual URL and Anon Key)
const SUPABASE_URL = 'https://YOUR_SUPABASE_URL.supabase.co';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Initialize LocalForage (Offline DB)
const db = {
    nodes: localforage.createInstance({ name: "GIS", storeName: "nodes" }), // GSS, Poles, DTs, Consumers
    lines: localforage.createInstance({ name: "GIS", storeName: "lines" }), // HT/LT Lines
    photos: localforage.createInstance({ name: "GIS", storeName: "photos" }) // Base64 Chunks
};

const Auth = {
    async login() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) return alert("Login Failed: " + error.message);
        
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-ui').classList.remove('hidden');
        App.initMap();
    },

    async checkSession() {
        const { data } = await supabase.auth.getSession();
        setTimeout(() => { // Simulate Splash
            document.getElementById('splash-screen').classList.add('hidden');
            if (data.session) {
                document.getElementById('app-ui').classList.remove('hidden');
                App.initMap();
            } else {
                document.getElementById('auth-screen').classList.remove('hidden');
            }
        }, 2000);
    },

    async logout() {
        await supabase.auth.signOut();
        window.location.reload();
    }
};

document.addEventListener("DOMContentLoaded", Auth.checkSession);
