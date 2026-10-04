// 1. Sabse pehle buttons ko activate karein (Taaki app hang na ho)
document.addEventListener("DOMContentLoaded", function() {
    
    // Splash screen ko 1 second baad hatayein
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        const auth = document.getElementById('auth-screen');
        if (splash) splash.classList.add('hidden');
        if (auth) auth.classList.remove('hidden');
    }, 1000);

    // Skip Login Button Logic
    document.getElementById("btn-skip").addEventListener("click", function() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-ui').classList.remove('hidden');
        alert("Aap Test Mode mein hain!");
    });

    // Login Button Logic
    document.getElementById("btn-login").addEventListener("click", function() {
        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;
        if(!email || !pass) {
            alert("Email aur password dono zaruri hain!");
        } else {
            alert("Login button kaam kar raha hai! Email: " + email);
            // Supabase login logic yahan baad mein add karenge
        }
    });

    // Signup Button Logic
    document.getElementById("btn-signup").addEventListener("click", function() {
        alert("Account creation button active hai!");
    });
});
