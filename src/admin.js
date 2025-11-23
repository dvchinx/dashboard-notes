import { supabase } from "./supabase.js";
import logoutUser from "./logout.js";

let currentUser = null;
let allNotes = [];
let allUsers = [];
let selectedUser = null;

// Inicializar panel de administración
async function initAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    window.location.href = "/index.html";
    return;
  }

  currentUser = user;
  console.log("Admin autenticado:", currentUser);

  // Verificar si es admin
  const isAdmin = user.email === "admin@admin.com"; // Cambia esto según tu lógica
  
  if (!isAdmin) {
    window.location.href = "/dashboard.html";
    return;
  }

  renderUI();
  await loadUsers();
  await loadAllNotes();
}

// Renderizar interfaz de admin
function renderUI() {
  const app = document.getElementById("app");
  
  app.innerHTML = `
    <div class="container admin-container">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <h1>👨‍💼 Panel de Administración</h1>
        </div>
        <div class="header-right">
          <span class="user-email">Admin: ${currentUser.email}</span>
          <button id="logoutBtn" class="btn-logout">Cerrar sesión</button>
        </div>
      </header>

      <!-- Sidebar con usuarios -->
      <aside class="sidebar">
        <h3>Usuarios</h3>
        <div id="usersList"></div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Estadísticas -->
        <div class="admin-stats">
          <div class="stat-card">
            <h3 id="totalUsers">0</h3>
            <p>Usuarios totales</p>
          </div>
          <div class="stat-card">
            <h3 id="totalNotes">0</h3>
            <p>Notas totales</p>
          </div>
          <div class="stat-card">
            <h3 id="totalPinned">0</h3>
            <p>Notas fijadas</p>
          </div>
        </div>

        <!-- Búsqueda -->
        <div class="search-section">
          <input type="text" id="searchInput" placeholder="🔍 Buscar notas..." />
        </div>

        <!-- Notas -->
        <div class="notes-section">
          <h2 id="notesTitle">📋 Todas las notas</h2>
          <div id="notesGrid" class="notes-grid"></div>
        </div>
      </main>
    </div>

    <!-- Modal para ver detalles de nota -->
    <div id="viewModal" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <div id="noteDetails"></div>
        <div class="modal-controls">
          <button id="deleteNoteBtn" class="btn-danger">Eliminar nota</button>
          <button id="closeModalBtn" class="btn-secondary">Cerrar</button>
        </div>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById("logoutBtn").addEventListener("click", logoutUser);
  document.getElementById("searchInput").addEventListener("input", handleSearch);
  
  // Modal
  const modal = document.getElementById("viewModal");
  const closeModal = modal.querySelector(".close");
  closeModal.addEventListener("click", () => modal.style.display = "none");
  document.getElementById("closeModalBtn").addEventListener("click", () => modal.style.display = "none");
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
}

// Cargar todos los usuarios
async function loadUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name")
    .order("email", { ascending: true });

  if (error) {
    console.error("Error al cargar usuarios:", error);
    return;
  }

  allUsers = data || [];
  renderUsers();
  updateStats();
}

// Renderizar lista de usuarios
function renderUsers() {
  const usersList = document.getElementById("usersList");
  
  usersList.innerHTML = `
    <div class="user-item ${!selectedUser ? 'active' : ''}" data-id="all">
      👥 Todos los usuarios
    </div>
    ${allUsers.map(user => `
      <div class="user-item ${selectedUser === user.id ? 'active' : ''}" data-id="${user.id}">
        👤 ${user.email}
      </div>
    `).join('')}
  `;

  // Event listeners
  document.querySelectorAll(".user-item").forEach(item => {
    item.addEventListener("click", () => {
      const id = item.dataset.id;
      selectedUser = id === "all" ? null : id;
      renderUsers();
      filterAndRenderNotes();
    });
  });
}

// Cargar todas las notas
async function loadAllNotes() {
  const { data, error } = await supabase
    .from("notes")
    .select(`
      *,
      users (email, name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al cargar notas:", error);
    return;
  }

  allNotes = data || [];
  filterAndRenderNotes();
  updateStats();
}

// Actualizar estadísticas
function updateStats() {
  document.getElementById("totalUsers").textContent = allUsers.length;
  document.getElementById("totalNotes").textContent = allNotes.length;
  document.getElementById("totalPinned").textContent = allNotes.filter(n => n.pinned).length;
}

// Filtrar y renderizar notas
function filterAndRenderNotes() {
  let filtered = allNotes;

  // Filtrar por usuario si está seleccionado
  if (selectedUser) {
    filtered = filtered.filter(note => note.user_id === selectedUser);
  }

  const title = document.getElementById("notesTitle");
  if (selectedUser) {
    const user = allUsers.find(u => u.id === selectedUser);
    title.textContent = `📋 Notas de ${user?.email || 'Usuario'}`;
  } else {
    title.textContent = "📋 Todas las notas";
  }

  renderNotes(filtered);
}

// Renderizar notas
function renderNotes(notes) {
  const grid = document.getElementById("notesGrid");
  
  if (!notes.length) {
    grid.innerHTML = '<p class="no-notes">No hay notas para mostrar</p>';
    return;
  }

  grid.innerHTML = notes.map(note => `
    <div class="note-card color-${note.color}" data-id="${note.id}">
      <div class="note-header">
        <h3>${note.title || "Sin título"}</h3>
        ${note.pinned ? '<span class="pin-icon">📌</span>' : ''}
      </div>
      <p class="note-content">${note.content || ""}</p>
      <div class="note-footer">
        <small>👤 ${note.users?.email || 'Usuario desconocido'}</small>
      </div>
    </div>
  `).join('');

  // Event listeners para abrir modal
  grid.querySelectorAll(".note-card").forEach(card => {
    card.addEventListener("click", () => openViewModal(parseInt(card.dataset.id)));
  });
}

// Abrir modal de vista
function openViewModal(noteId) {
  const note = allNotes.find(n => n.id === noteId);
  if (!note) return;

  const modal = document.getElementById("viewModal");
  const details = document.getElementById("noteDetails");
  
  details.innerHTML = `
    <div class="note-view">
      <h2>${note.title || "Sin título"}</h2>
      <p class="note-view-content">${note.content || "Sin contenido"}</p>
      <div class="note-view-meta">
        <p><strong>Usuario:</strong> ${note.users?.email || 'Desconocido'}</p>
        <p><strong>Color:</strong> ${note.color}</p>
        <p><strong>Fijada:</strong> ${note.pinned ? 'Sí' : 'No'}</p>
        <p><strong>Creada:</strong> ${new Date(note.created_at).toLocaleString()}</p>
        <p><strong>Actualizada:</strong> ${new Date(note.updated_at).toLocaleString()}</p>
      </div>
    </div>
  `;

  modal.style.display = "flex";
  modal.dataset.noteId = noteId;

  // Actualizar listener del botón eliminar
  document.getElementById("deleteNoteBtn").onclick = () => deleteNote(noteId);
}

// Eliminar nota (admin)
async function deleteNote(noteId) {
  if (!confirm("¿Eliminar esta nota? Esta acción no se puede deshacer.")) return;

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId);

  if (error) {
    console.error("Error al eliminar nota:", error);
    alert("Error al eliminar nota");
    return;
  }

  document.getElementById("viewModal").style.display = "none";
  await loadAllNotes();
}

// Búsqueda
function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  
  let filtered = allNotes;

  // Filtrar por usuario si está seleccionado
  if (selectedUser) {
    filtered = filtered.filter(note => note.user_id === selectedUser);
  }

  // Aplicar búsqueda
  if (query) {
    filtered = filtered.filter(note => 
      (note.title?.toLowerCase().includes(query)) ||
      (note.content?.toLowerCase().includes(query)) ||
      (note.users?.email?.toLowerCase().includes(query))
    );
  }

  renderNotes(filtered);
}

export default initAdmin;
