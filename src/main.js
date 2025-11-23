import loginUser from "./login.js";
import registerUser from "./register.js";
import initApp from "./mvp.js";
import initAdmin from "./admin.js";

// Detectar qué página estamos y ejecutar el código apropiado
const currentPath = window.location.pathname;

// Login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", loginUser);
}

// Register
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", registerUser);
}

// Dashboard - solo ejecutar si estamos en dashboard.html
if (currentPath.includes("dashboard.html")) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
}

// Admin - solo ejecutar si estamos en admin.html
if (currentPath.includes("admin.html")) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAdmin);
  } else {
    initAdmin();
  }
}