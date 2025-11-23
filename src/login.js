import { supabase } from "./supabase.js";

async function loginUser(e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  console.log("➡️ Iniciando login con:", email);

  // 1. Intentar login con Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("Error en login: " + error.message);
    console.error(error);
    return;
  }

  console.log("Login correcto:", data);

  alert("Inicio de sesión exitoso!");

  // 2. Redirigir al dashboard o página principal
  window.location.href = "/dashboard.html";
}

export default loginUser;
