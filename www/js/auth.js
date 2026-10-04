// Initialize Supabase with your actual URL and Anon Key
const SUPABASE_URL = 'https://sxfyeublvtisndnzycib.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZnlldWJsdnRpc25kbnp5Y2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjkzOTEsImV4cCI6MjEwNDgwNTM5MX0.FENa8zOaDzlYZJI_HfWtallAkWukxSiM52-RGQ-CUmA';
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
        
        if (!email || !password) {
            alert("Please enter both email and password.");
            return;
        }

        try {
            // Supabase Authentication Call
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            
            if (error) {
                alert("Login Failed: " + error.message);
                return;
            }
            // लॉगिन सफल होने पर ऐप UI दिखाएं
            this.showApp();
        } catch (e) {
            alert("Database Connection Failed. Check your internet connection.");
        }
    },

    // बिना लॉगिन किए ऐप टेस्ट करने के लिए (Offline Mode Testing)
    skipLogin() {
        this.showApp();
    },

    showApp() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-ui').classList.remove('hidden');
        App.initMap(); // मैप इनिशियलाइज़ करें
    },

    async checkSession() {
        // 2 सेकंड का टाइमर, ताकि Splash Screen की एनीमेशन पूरी दिखे
        setTimeout(async () => {
            let sessionActive = false;
            
            try {
                // चेक करें कि यूज़र पहले से लॉगिन है या नहीं
                const { data } = await supabase.auth.getSession();
                if (data && data.session) sessionActive = true;
            } catch (error) {
                console.warn("Offline or Supabase error. Showing login screen.");
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
        } catch (e) {
            console.error("Logout error", e);
        }
        // पेज रीलोड करके यूज़र को वापस लॉगिन स्क्रीन पर भेजें
        window.location.reload();
    }
};

// जैसे ही ऐप लोड हो, सेशन चेक करें
document.addEventListener("DOMContentLoaded", () => {
    Auth.checkSession();
});
