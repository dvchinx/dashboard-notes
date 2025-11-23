import { supabase } from "./supabase.js";
import logoutUser from "./logout.js";

let currentUser = null;
let allNotes = [];
let allCategories = [];
let selectedCategory = null;

// Inicializar la aplicación
async function initApp() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    window.location.href = "/index.html";
    return;
  }

  currentUser = user;
  console.log("Usuario autenticado:", currentUser);

  // Verificar si es admin (puedes ajustar la lógica)
  const isAdmin = user.email === "admin@admin.com"; // Cambia esto según tu lógica
  
  if (isAdmin) {
    window.location.href = "/admin.html";
    return;
  }

  renderUI();
  await loadCategories();
  await loadNotes();
}

// Renderizar la interfaz principal
function renderUI() {
  const app = document.getElementById("app");
  
  app.innerHTML = `
    <div class="container">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <h1>📝 Keep Clone</h1>
        </div>
        <div class="header-right">
          <span class="user-email">${currentUser.email}</span>
          <button id="logoutBtn" class="btn-logout">Cerrar sesión</button>
        </div>
      </header>

      <!-- Sidebar -->
      <aside class="sidebar">
        <h3>Categorías</h3>
        <div id="categoriesList"></div>
        <button id="addCategoryBtn" class="btn-add-category">+ Nueva categoría</button>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Nueva nota -->
        <div class="new-note-section">
          <input type="text" id="newNoteTitle" placeholder="Título..." />
          <textarea id="newNoteContent" placeholder="Crear una nota..." rows="3"></textarea>
          <div class="new-note-controls">
            <select id="newNoteCategory">
              <option value="">Sin categoría</option>
            </select>
            <select id="newNoteColor">
              <option value="yellow">🟡 Amarillo</option>
              <option value="green">🟢 Verde</option>
              <option value="blue">🔵 Azul</option>
              <option value="pink">🩷 Rosa</option>
              <option value="gray">⚫ Gris</option>
            </select>
            <button id="createNoteBtn" class="btn-primary">Crear nota</button>
          </div>
        </div>

        <!-- Búsqueda -->
        <div class="search-section">
          <input type="text" id="searchInput" placeholder="🔍 Buscar notas..." />
        </div>

        <!-- Notas fijadas -->
        <div id="pinnedNotesSection" class="notes-section">
          <h2>📌 Fijadas</h2>
          <div id="pinnedNotesGrid" class="notes-grid"></div>
        </div>

        <!-- Otras notas -->
        <div id="otherNotesSection" class="notes-section">
          <h2>📄 Otras notas</h2>
          <div id="otherNotesGrid" class="notes-grid"></div>
        </div>
      </main>
    </div>

    <!-- Modal para editar nota -->
    <div id="editModal" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <input type="text" id="editNoteTitle" placeholder="Título" />
        <textarea id="editNoteContent" placeholder="Contenido..." rows="8"></textarea>
        <div class="modal-controls">
          <select id="editNoteCategory">
            <option value="">Sin categoría</option>
          </select>
          <select id="editNoteColor">
            <option value="yellow">🟡 Amarillo</option>
            <option value="green">🟢 Verde</option>
            <option value="blue">🔵 Azul</option>
            <option value="pink">🩷 Rosa</option>
            <option value="gray">⚫ Gris</option>
          </select>
          <button id="saveEditBtn" class="btn-primary">Guardar</button>
          <button id="deleteNoteBtn" class="btn-danger">Eliminar</button>
          <button id="togglePinBtn" class="btn-secondary">📌 Fijar/Desfijar</button>
        </div>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById("logoutBtn").addEventListener("click", logoutUser);
  document.getElementById("createNoteBtn").addEventListener("click", createNote);
  document.getElementById("addCategoryBtn").addEventListener("click", addCategory);
  document.getElementById("searchInput").addEventListener("input", handleSearch);
  
  // Modal
  const modal = document.getElementById("editModal");
  const closeModal = modal.querySelector(".close");
  closeModal.addEventListener("click", () => modal.style.display = "none");
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
}

// Cargar categorías
async function loadCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error al cargar categorías:", error);
    return;
  }

  allCategories = data || [];
  renderCategories();
}

// Renderizar categorías
function renderCategories() {
  const categoriesList = document.getElementById("categoriesList");
  const newNoteCategory = document.getElementById("newNoteCategory");
  const editNoteCategory = document.getElementById("editNoteCategory");

  // Sidebar
  categoriesList.innerHTML = `
    <div class="category-item ${!selectedCategory ? 'active' : ''}" data-id="all">
      📋 Todas las notas
    </div>
    ${allCategories.map(cat => `
      <div class="category-item ${selectedCategory === cat.id ? 'active' : ''}" data-id="${cat.id}">
        🏷️ ${cat.name}
        <button class="btn-delete-category" data-id="${cat.id}">×</button>
      </div>
    `).join('')}
  `;

  // Select de nueva nota
  newNoteCategory.innerHTML = `
    <option value="">Sin categoría</option>
    ${allCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
  `;

  // Select de edición
  editNoteCategory.innerHTML = `
    <option value="">Sin categoría</option>
    ${allCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
  `;

  // Event listeners para categorías
  document.querySelectorAll(".category-item").forEach(item => {
    item.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-delete-category")) return;
      const id = item.dataset.id;
      selectedCategory = id === "all" ? null : parseInt(id);
      renderCategories();
      filterAndRenderNotes();
    });
  });

  document.querySelectorAll(".btn-delete-category").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteCategory(parseInt(btn.dataset.id));
    });
  });
}

// Agregar categoría
async function addCategory() {
  const name = prompt("Nombre de la nueva categoría:");
  if (!name) return;

  const { error } = await supabase
    .from("categories")
    .insert([{ user_id: currentUser.id, name }]);

  if (error) {
    console.error("Error al crear categoría:", error);
    alert("Error al crear categoría");
    return;
  }

  await loadCategories();
}

// Eliminar categoría
async function deleteCategory(categoryId) {
  if (!confirm("¿Eliminar esta categoría? Las notas no se eliminarán.")) return;

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    console.error("Error al eliminar categoría:", error);
    alert("Error al eliminar categoría");
    return;
  }

  await loadCategories();
  await loadNotes();
}

// Cargar notas
async function loadNotes() {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error al cargar notas:", error);
    return;
  }

  allNotes = data || [];
  filterAndRenderNotes();
}

// Filtrar y renderizar notas
function filterAndRenderNotes() {
  let filtered = allNotes;

  // Filtrar por categoría
  if (selectedCategory) {
    filtered = filtered.filter(note => note.category_id === selectedCategory);
  }

  // Separar fijadas y otras
  const pinned = filtered.filter(note => note.pinned);
  const others = filtered.filter(note => !note.pinned);

  renderNotes(pinned, "pinnedNotesGrid");
  renderNotes(others, "otherNotesGrid");

  // Mostrar/ocultar secciones
  document.getElementById("pinnedNotesSection").style.display = pinned.length ? "block" : "none";
}

// Renderizar notas en un grid
function renderNotes(notes, gridId) {
  const grid = document.getElementById(gridId);
  
  if (!notes.length) {
    grid.innerHTML = '<p class="no-notes">No hay notas aquí</p>';
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
        <small>${getCategoryName(note.category_id)}</small>
      </div>
    </div>
  `).join('');

  // Event listeners para abrir modal
  grid.querySelectorAll(".note-card").forEach(card => {
    card.addEventListener("click", () => openEditModal(parseInt(card.dataset.id)));
  });
}

// Obtener nombre de categoría
function getCategoryName(categoryId) {
  if (!categoryId) return "Sin categoría";
  const cat = allCategories.find(c => c.id === categoryId);
  return cat ? `🏷️ ${cat.name}` : "Sin categoría";
}

// Crear nota
async function createNote() {
  const title = document.getElementById("newNoteTitle").value.trim();
  const content = document.getElementById("newNoteContent").value.trim();
  const category_id = document.getElementById("newNoteCategory").value || null;
  const color = document.getElementById("newNoteColor").value;

  if (!title && !content) {
    alert("Escribe al menos un título o contenido");
    return;
  }

  const { error } = await supabase
    .from("notes")
    .insert([{
      user_id: currentUser.id,
      title,
      content,
      category_id,
      color,
      pinned: false
    }]);

  if (error) {
    console.error("Error al crear nota:", error);
    alert("Error al crear nota");
    return;
  }

  // Limpiar campos
  document.getElementById("newNoteTitle").value = "";
  document.getElementById("newNoteContent").value = "";
  document.getElementById("newNoteCategory").value = "";
  document.getElementById("newNoteColor").value = "yellow";

  await loadNotes();
}

// Abrir modal de edición
function openEditModal(noteId) {
  const note = allNotes.find(n => n.id === noteId);
  if (!note) return;

  const modal = document.getElementById("editModal");
  document.getElementById("editNoteTitle").value = note.title || "";
  document.getElementById("editNoteContent").value = note.content || "";
  document.getElementById("editNoteCategory").value = note.category_id || "";
  document.getElementById("editNoteColor").value = note.color || "yellow";

  modal.style.display = "flex";
  modal.dataset.noteId = noteId;

  // Actualizar listeners
  document.getElementById("saveEditBtn").onclick = () => saveNote(noteId);
  document.getElementById("deleteNoteBtn").onclick = () => deleteNote(noteId);
  document.getElementById("togglePinBtn").onclick = () => togglePin(noteId);
}

// Guardar nota editada
async function saveNote(noteId) {
  const title = document.getElementById("editNoteTitle").value.trim();
  const content = document.getElementById("editNoteContent").value.trim();
  const category_id = document.getElementById("editNoteCategory").value || null;
  const color = document.getElementById("editNoteColor").value;

  const { error } = await supabase
    .from("notes")
    .update({ title, content, category_id, color, updated_at: new Date() })
    .eq("id", noteId);

  if (error) {
    console.error("Error al actualizar nota:", error);
    alert("Error al actualizar nota");
    return;
  }

  document.getElementById("editModal").style.display = "none";
  await loadNotes();
}

// Eliminar nota
async function deleteNote(noteId) {
  if (!confirm("¿Eliminar esta nota?")) return;

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId);

  if (error) {
    console.error("Error al eliminar nota:", error);
    alert("Error al eliminar nota");
    return;
  }

  document.getElementById("editModal").style.display = "none";
  await loadNotes();
}

// Fijar/Desfijar nota
async function togglePin(noteId) {
  const note = allNotes.find(n => n.id === noteId);
  if (!note) return;

  const { error } = await supabase
    .from("notes")
    .update({ pinned: !note.pinned, updated_at: new Date() })
    .eq("id", noteId);

  if (error) {
    console.error("Error al actualizar nota:", error);
    alert("Error al actualizar nota");
    return;
  }

  document.getElementById("editModal").style.display = "none";
  await loadNotes();
}

// Búsqueda
function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  
  if (!query) {
    filterAndRenderNotes();
    return;
  }

  const filtered = allNotes.filter(note => 
    (note.title?.toLowerCase().includes(query)) ||
    (note.content?.toLowerCase().includes(query))
  );

  const pinned = filtered.filter(note => note.pinned);
  const others = filtered.filter(note => !note.pinned);

  renderNotes(pinned, "pinnedNotesGrid");
  renderNotes(others, "otherNotesGrid");

  document.getElementById("pinnedNotesSection").style.display = pinned.length ? "block" : "none";
}

export default initApp;
