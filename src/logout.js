import { supabase } from "./supabase.js";

async function logoutUser() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error al cerrar sesión:", error);
    alert("Error al cerrar sesión");
    return;
  }

  console.log("Sesión cerrada exitosamente");
  window.location.href = "/index.html";
}

export default logoutUser;
