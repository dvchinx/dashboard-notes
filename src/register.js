import { supabase } from "./supabase.js";

async function registerUser(e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // Registrar en Supabase Auth (ya maneja el hash de contraseña de forma segura)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Error en registro:", error);
    alert("Error al registrarse: " + error.message);
    return;
  }

  const user = data.user;

  // Guardar solo información adicional (NO la contraseña, ya está en Auth)
  const { error: insertError } = await supabase
    .from("users")
    .insert([{ id: user.id, email, name }]);

  if (insertError) {
    console.error("Error al guardar usuario:", insertError);
    alert("Error al guardar información del usuario");
    return;
  }

  alert("Registro exitoso. Por favor verifica tu correo electrónico.");
  window.location.href = "/index.html";
}

export default registerUser;