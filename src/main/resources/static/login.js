const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const errorEl = document.getElementById("error");

checkAlreadyLoggedIn();

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.style.color = "#c63a3a";
    errorEl.textContent = "";

    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) {
            throw new Error("Invalid username or password.");
        }
        location.href = "/";
    } catch (err) {
        errorEl.textContent = err.message || "Login failed.";
    }
});

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.style.color = "#c63a3a";
    errorEl.textContent = "";

    const username = document.getElementById("register-username").value.trim();
    const password = document.getElementById("register-password").value;
    const email = document.getElementById("register-email").value.trim();

    try {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, email: email || null })
        });
        if (response.status === 409) {
            throw new Error("Username already exists.");
        }
        if (!response.ok) {
            throw new Error("Registration failed.");
        }
        errorEl.style.color = "#1c8f75";
        errorEl.textContent = "Registration complete. Please login.";
        registerForm.reset();
    } catch (err) {
        errorEl.style.color = "#c63a3a";
        errorEl.textContent = err.message || "Registration failed.";
    }
});

async function checkAlreadyLoggedIn() {
    const response = await fetch("/api/me");
    if (response.ok) {
        location.href = "/";
    }
}
