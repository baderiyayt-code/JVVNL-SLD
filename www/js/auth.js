// Supabase Setup
const SUPABASE_URL = 'https://sxfyeublvtisndnzycib.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZnlldWJsdnRpc25kbnp5Y2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjkzOTEsImV4cCI6MjEwNDgwNTM5MX0.FENa8zOaDzlYZJI_HfWtallAkWukxSiM52-RGQ-CUmA';
let supabase = null;

// App shuru hote hi UI aur buttons ko active karna
document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Supabase ko safely load karna
    try {
        if (window.supabase) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log("Supabase connected.");
        }
    } catch (e) {
        console.warn("Supabase init failed. App offline chalegi.");
    }

    // 2. Splash Screen hatana (1.5 sec baad)
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        const auth = document.getElementById('auth-screen');
        if(splash) splash.classList.add('hidden');
        if(auth) auth.classList.remove('hidden');
    }, 1500);

    // 3. Skip Button
    document.getElementById('btn-skip').addEventListener('click', function() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-ui').classList.remove('hidden');
        alert("Aap Test Mode mein aagaye hain!");
    });

    // 4. Login Button
    document.getElementById('btn-login').addEventListener('click', async function() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if(!email || !password) return alert("Email aur Password dono daalein!");
        if(!supabase) return alert("Database connect nahi hua hai, internet check karein ya 'Skip' use karein.");

        try {
            alert("Login check kar rahe hain...");
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            
            if (error) {
                alert("Login Failed: " + error.message);
            } else {
                alert("Login Success!");
                document.getElementById('auth-screen').classList.add('hidden');
                document.getElementById('app-ui').classList.remove('hidden');
            }
        } catch (err) {
            alert("Error: " + err.message);
        }
    });

    // 5. Signup Button
    document.getElementById('btn-signup').addEventListener('click', async function() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if(!email || !password) return alert("Account banane ke liye Email aur Password daalein!");
        if(!supabase) return alert("Database connect nahi hua hai.");

        try {
            alert("Account banaya jaa raha hai...");
            const { data, error } = await supabase.auth.signUp({ email, password });
            
            if (error) {
                alert("Signup Failed: " + error.message);
            } else {
                alert("✅ Account ban gaya! Ab 'Secure Login' par click karke andar jayein.");
            }
        } catch (err) {
            alert("Error: " + err.message);
        }
    });
});
