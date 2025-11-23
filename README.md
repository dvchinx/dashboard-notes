# 📝 Google Keep Clone - Dashboard

Clon sencillo de Google Keep con funcionalidades completas de gestión de notas, categorías y panel de administración.

## 🚀 Características

### Usuario Normal
- ✅ **CRUD de Notas**: Crear, editar, eliminar y ver notas
- 📌 **Fijar notas**: Organiza las notas importantes en la parte superior
- 🎨 **5 Colores**: Amarillo, verde, azul, rosa y gris
- 🏷️ **Categorías**: Crea y gestiona categorías personalizadas
- 🔍 **Búsqueda**: Busca notas por título o contenido
- 📱 **Diseño responsive**: Funciona en móvil y escritorio

### Panel de Administración
- 👥 **Ver todos los usuarios**: Lista completa de usuarios registrados
- 📊 **Estadísticas**: Total de usuarios, notas y notas fijadas
- 👀 **Ver todas las notas**: Acceso de solo lectura a todas las notas
- 🗑️ **Eliminar notas**: Capacidad de eliminar notas de cualquier usuario
- 🔎 **Filtrar por usuario**: Ver notas de un usuario específico

## 📁 Estructura del Proyecto

```
dashboard/
├── index.html              # Página de login
├── register.html           # Página de registro
├── dashboard.html          # Dashboard de usuario
├── admin.html             # Panel de administración
├── supabase-setup.sql     # Script SQL de configuración
├── src/
│   ├── main.js           # Punto de entrada
│   ├── login.js          # Lógica de inicio de sesión
│   ├── register.js       # Lógica de registro
│   ├── logout.js         # Lógica de cierre de sesión
│   ├── mvp.js            # Vista principal de notas (usuario)
│   ├── admin.js          # Vista del panel de administración
│   ├── supabase.js       # Configuración de Supabase
│   └── style.css         # Estilos (Google Keep style)
└── package.json
```

## ⚙️ Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto
2. En el SQL Editor, ejecuta el contenido de `supabase-setup.sql`
3. Verifica que las tablas `users`, `categories` y `notes` se crearon correctamente
4. Asegúrate de que las políticas RLS (Row Level Security) estén habilitadas

### 3. Actualizar credenciales

En `src/supabase.js`, actualiza (si es necesario):
```javascript
const supabaseUrl = 'TU_URL_DE_SUPABASE';
const supabaseKey = 'TU_ANON_KEY_DE_SUPABASE';
```

### 4. Ejecutar el proyecto

```bash
npm run dev
```

## 👤 Usuarios

### Usuario Admin
- **Email**: `admin@admin.com`
- Debes crear este usuario manualmente en Supabase Auth
- Tiene acceso al panel de administración (`/admin.html`)
- Puede ver y eliminar notas de todos los usuarios

### Usuarios Normales
- Cualquier otro email registrado
- Accede al dashboard de notas (`/dashboard.html`)
- Solo puede ver y gestionar sus propias notas

## 🎨 Colores de Notas

- 🟡 Amarillo (default)
- 🟢 Verde
- 🔵 Azul
- 🩷 Rosa
- ⚫ Gris

## 📋 Base de Datos

### Tabla `users`
```sql
id UUID PRIMARY KEY
email TEXT
name TEXT
created_at TIMESTAMP
```

### Tabla `categories`
```sql
id BIGSERIAL PRIMARY KEY
user_id UUID
name TEXT
created_at TIMESTAMP
```

### Tabla `notes`
```sql
id BIGSERIAL PRIMARY KEY
user_id UUID
category_id BIGINT
title TEXT
content TEXT
color TEXT
pinned BOOLEAN
created_at TIMESTAMP
updated_at TIMESTAMP
```

## 🔐 Seguridad

- Las contraseñas se manejan con **Supabase Auth** (hash automático)
- **NO** se guarda la contraseña en texto plano en la tabla `users`
- Row Level Security (RLS) configurado para proteger los datos
- Cada usuario solo puede acceder a sus propias notas y categorías

## 🛠️ Tecnologías

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Bundler**: Vite
- **Estilo**: CSS personalizado inspirado en Google Keep

## 📝 Notas Importantes

1. El campo `password` debe ser eliminado de la tabla `users` (ejecuta el SQL proporcionado)
2. Supabase Auth maneja todas las contraseñas de forma segura
3. El admin se detecta por email (`admin@admin.com`), puedes cambiar esta lógica
4. Las notas sin categoría son válidas (`category_id` puede ser `NULL`)

## 🚨 Solución de Problemas

### Error: "No se pueden cargar las notas"
- Verifica que las políticas RLS estén configuradas correctamente
- Asegúrate de que el usuario esté autenticado

### Error: "Admin no puede ver notas de otros usuarios"
- Verifica que las políticas de admin estén creadas en Supabase
- Confirma que el email del admin es exactamente `admin@admin.com`

### Error: "Cannot read properties of undefined"
- Verifica que Supabase esté configurado correctamente
- Revisa la consola del navegador para más detalles

## 📄 Licencia

Este es un proyecto educativo de demostración.

---

¡Disfruta de tu clon de Google Keep! 📝✨
