// Initialize Supabase (अगर आपके पास URL नहीं है, तो कोई बात नहीं, ऐप क्रैश नहीं होगा)
const SUPABASE_URL = 'https://YOUR_SUPABASE_URL.supabase.co';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Initialize LocalForage (Offline DB)
const db = {
    nodes: localforage.createInstance({ name: "GIS", storeName: "nodes" }), 
    lines: localforage.createInstance({ name: "GIS", storeName: "lines" }),
    photos: localforage.createInstance({ name: "GIS", storeName: "photos" })
};

const Auth = {
    async login() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                alert("Login Failed: " + error.message);
                return;
            }
            this.showApp();
        } catch (e) {
            alert("Database Connection Failed. Check internet or Supabase keys.");
        }
    },

    // बिना लॉगिन किए ऐप टेस्ट करने के लिए (Offline Mode Testing)
    skipLogin() {
        this.showApp();
    },

    showApp() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-ui').classList.remove('hidden');
        App.initMap();
    },

    async checkSession() {
        // 2 सेकंड का टाइमर, ताकि Splash Screen की एनीमेशन पूरी दिखे
        setTimeout(async () => {
            let sessionActive = false;
            
            try {
                // कोशिश करें कि Supabase से सेशन चेक हो
                const { data } = await supabase.auth.getSession();
                if (data && data.session) sessionActive = true;
            } catch (error) {
                console.warn("Supabase not configured or offline. Showing login screen.");
            }

            // Splash Screen को छुपाएं
            document.getElementById('splash-screen').classList.add('hidden');
            
            // अगर पहले से लॉगिन है तो Map खोलें, वर्ना Login स्क्रीन
            if (sessionActive) {
                Auth.showApp();
            } else {
                document.getElementById('auth-screen').classList.remove('hidden');
            }
        }, 2000);
    },

    async logout() {
        try {
            await supabase.auth.signOut();
        } catch (e) {}
        window.location.reload();
    }
};

// जैसे ही ऐप लोड हो, सेशन चेक करें
document.addEventListener("DOMContentLoaded", () => {
    Auth.checkSession();
});
