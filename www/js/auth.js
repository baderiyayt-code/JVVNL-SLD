// 1. GLOBAL ERROR CATCHER: अगर ऐप में कोई भी क्रैश होगा, तो स्क्रीन पर पॉपअप आ जाएगा
window.onerror = function(msg, url, line) {
    alert("System Error: " + msg + " (Line: " + line + ")");
    return false;
};

// 2. Supabase Configuration
const SUPABASE_URL = 'https://sxfyeublvtisndnzycib.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZnlldWJsdnRpc25kbnp5Y2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjkzOTEsImV4cCI6MjEwNDgwNTM5MX0.FENa8zOaDzlYZJI_HfWtallAkWukxSiM52-RGQ-CUmA';
let supabase = null;

try {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.warn("Supabase Init Error");
}

// 3. Auth Functions
window.Auth = {
    async signUp() {
        try {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) return alert("कृपया Email और Password दोनों डालें!");
            if (!supabase) return alert("Database से कनेक्शन नहीं हो पाया। इंटरनेट चेक करें।");
            
            alert("Account बन रहा है, कृपया प्रतीक्षा करें...");
            const { data, error } = await supabase.auth.signUp({ email, password });
            
            if (error) {
                alert("Sign Up Failed: " + error.message);
                return;
            }
            alert("✅ Account सफलता से बन गया! अब आप 'Secure Login' पर क्लिक कर सकते हैं।");
        } catch (err) {
            alert("SignUp Error: " + err.message);
        }
    },

    async login() {
        try {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) return alert("कृपया Email और Password दोनों डालें!");
            if (!supabase) return alert("Database से कनेक्शन नहीं हो पाया।");
            
            alert("लॉगिन हो रहा है...");
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            
            if (error) {
                alert("Login Failed: " + error.message);
                return;
            }
            this.showApp();
        } catch (err) {
            alert("Login Error: " + err.message);
        }
    },

    skipLogin() {
        this.showApp();
    },

    showApp() {
        try {
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('app-ui').classList.remove('hidden');
            
            // अगर App.js लोड हो गया है, तो Map चालू करें
            if (window.App && typeof window.App.initMap === 'function') {
                window.App.initMap();
            } else {
                console.warn("Map functionality is not fully loaded yet.");
            }
        } catch (e) {
            alert("App Load Error: " + e.message);
        }
    }
};

// 4. FORCE BUTTON ATTACHMENT (यह किसी भी हाल में बटनों को चालू कर देगा)
window.onload = function() {
    try {
        // सीधा HTML Elements पर क्लिक असाइन करें
        document.getElementById('login-btn').onclick = function() { window.Auth.login(); };
        document.getElementById('signup-btn').onclick = function() { window.Auth.signUp(); };
        document.getElementById('skip-btn').onclick = function() { window.Auth.skipLogin(); };
        
        // 1.5 सेकंड बाद Splash Screen छुपाएं और लॉगिन दिखाएं
        setTimeout(() => {
            const splash = document.getElementById('splash-screen');
            if (splash) splash.classList.add('hidden');
            
            const authScreen = document.getElementById('auth-screen');
            if (authScreen) authScreen.classList.remove('hidden');
        }, 1500);

    } catch (error) {
        alert("UI Setup Error: " + error.message);
    }
};
