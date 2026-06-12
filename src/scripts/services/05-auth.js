// ==========================================================================
// services/auth.js — Autenticación, registro y administración de usuarios
// ==========================================================================

// Perfil del usuario autenticado (no se guarda en localStorage).
let currentUser = null;

// ============================================================
// ESTADO DE AUTENTICACIÓN
// ============================================================
/**
 * Observa el estado de sesión de Firebase Auth. Si hay sesión, carga el
 * perfil desde Firestore y arranca la app (init()). Si no, muestra el
 * overlay de ingreso.
 */
function watchAuthState() {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const doc = await db.collection('usuarios').doc(user.uid).get();
        if (!doc.exists) {
          // El registro no terminó de guardar el perfil (ej. corte de conexión).
          await auth.signOut();
          showAuthError('login', 'Tu registro no se completó correctamente. Vuelve a crear tu cuenta o contacta al administrador.');
          return;
        }
        currentUser = { uid: user.uid, correo: user.email, ...doc.data() };
        hideAuthOverlay();
        renderUserBadge();
        init();
      } catch (err) {
        console.error('Error cargando perfil de usuario:', err);
        showAuthError('login', 'No se pudo cargar tu perfil. Verifica tu conexión e intenta de nuevo.');
        setAuthLoading(false);
        showAuthOverlay();
      }
    } else {
      currentUser = null;
      showAuthOverlay();
    }
  });
}

function hideAuthOverlay() {
  document.getElementById('auth-overlay').classList.remove('visible');
  document.body.classList.add('app-ready');
}

function showAuthOverlay() {
  document.getElementById('auth-overlay').classList.add('visible');
  document.body.classList.remove('app-ready');
  setAuthLoading(false);
  showAuthView('login');
}

// ============================================================
// NAVEGACIÓN ENTRE VISTAS DEL OVERLAY
// ============================================================
function showAuthView(view) {
  ['login', 'register', 'recover'].forEach(v => {
    document.getElementById('auth-view-' + v).style.display = (v === view) ? '' : 'none';
    hideAuthError(v);
  });
  if (view === 'register') onRegionChange();
}

function setAuthLoading(loading) {
  document.querySelectorAll('#auth-overlay .btn').forEach(b => b.disabled = loading);
  document.getElementById('auth-spinner').style.display = loading ? 'flex' : 'none';
}

function showAuthError(view, message) {
  const el = document.getElementById('auth-error-' + view);
  el.textContent = message;
  el.style.display = 'block';
}

function hideAuthError(view) {
  const el = document.getElementById('auth-error-' + view);
  el.style.display = 'none';
  el.textContent = '';
}

function authErrorMessage(err) {
  switch (err.code) {
    case 'auth/invalid-email': return 'El correo ingresado no es válido.';
    case 'auth/user-disabled': return 'Esta cuenta ha sido deshabilitada.';
    case 'auth/user-not-found': return 'No existe una cuenta con ese correo.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Correo o contraseña incorrectos.';
    case 'auth/email-already-in-use': return 'Ya existe una cuenta registrada con ese correo.';
    case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/network-request-failed': return 'No hay conexión a internet. Intenta nuevamente.';
    case 'auth/too-many-requests': return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    default: return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}

// ============================================================
// REGIÓN / COMUNA EN REGISTRO
// ============================================================
function onRegionChange() {
  const region = document.getElementById('reg-region').value;
  const selectEl = document.getElementById('reg-comuna-select');
  const textEl = document.getElementById('reg-comuna-text');
  if (region === 'Los Ríos') {
    selectEl.style.display = '';
    textEl.style.display = 'none';
    textEl.value = '';
  } else {
    selectEl.style.display = 'none';
    textEl.style.display = '';
    selectEl.value = '';
  }
}

// ============================================================
// LOGIN / REGISTRO / RECUPERACIÓN
// ============================================================
async function handleLogin(event) {
  event.preventDefault();
  hideAuthError('login');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  setAuthLoading(true);
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    showAuthError('login', authErrorMessage(err));
    setAuthLoading(false);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  hideAuthError('register');

  const nombres = document.getElementById('reg-nombres').value.trim();
  const apellidos = document.getElementById('reg-apellidos').value.trim();
  const rut = document.getElementById('reg-rut').value.trim();
  const correo = document.getElementById('reg-correo').value.trim();
  const password = document.getElementById('reg-password').value;
  const password2 = document.getElementById('reg-password2').value;
  const institucion = document.getElementById('reg-institucion').value.trim();
  const profesion = document.getElementById('reg-profesion').value.trim();
  const cargo = document.getElementById('reg-cargo').value.trim();
  const region = document.getElementById('reg-region').value;
  const comuna = region === 'Los Ríos'
    ? document.getElementById('reg-comuna-select').value
    : document.getElementById('reg-comuna-text').value.trim();
  const telefono = document.getElementById('reg-telefono').value.trim();

  if (!nombres || !apellidos || !rut || !correo || !institucion || !profesion || !cargo || !region || !comuna) {
    showAuthError('register', 'Completa todos los campos obligatorios.');
    return;
  }
  if (!validarRut(rut)) {
    showAuthError('register', 'El RUT ingresado no es válido. Verifica el dígito verificador.');
    return;
  }
  if (password.length < 6) {
    showAuthError('register', 'La contraseña debe tener al menos 6 caracteres.');
    return;
  }
  if (password !== password2) {
    showAuthError('register', 'Las contraseñas no coinciden.');
    return;
  }

  setAuthLoading(true);
  try {
    const cred = await auth.createUserWithEmailAndPassword(correo, password);
    const role = correo.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';
    await db.collection('usuarios').doc(cred.user.uid).set({
      nombres, apellidos,
      rut: formatearRut(rut),
      correo, institucion, profesion, cargo, region, comuna, telefono,
      role,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    showAuthError('register', authErrorMessage(err));
    setAuthLoading(false);
  }
}

async function handleRecover(event) {
  event.preventDefault();
  hideAuthError('recover');
  const email = document.getElementById('recover-email').value.trim();
  setAuthLoading(true);
  try {
    await auth.sendPasswordResetEmail(email);
    showAuthError('recover', 'Listo. Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.');
    document.getElementById('auth-error-recover').classList.add('success');
  } catch (err) {
    document.getElementById('auth-error-recover').classList.remove('success');
    showAuthError('recover', authErrorMessage(err));
  }
  setAuthLoading(false);
}

function logoutUser() {
  showModal({
    title: 'Cerrar sesión',
    message: '¿Seguro que deseas cerrar sesión? El reporte actual queda guardado en este dispositivo.',
    confirmText: 'Cerrar sesión',
    onConfirm: () => auth.signOut()
  });
}

// ============================================================
// BADGE DE USUARIO / ADMINISTRACIÓN
// ============================================================
function renderUserBadge() {
  const el = document.getElementById('user-badge');
  if (!el || !currentUser) return;
  el.textContent = `${currentUser.nombres || ''} ${currentUser.apellidos || ''}`.trim() || currentUser.correo;
  document.getElementById('admin-btn').style.display = currentUser.role === 'admin' ? '' : 'none';
}

function openAdminModal() {
  document.getElementById('admin-modal').classList.add('visible');
  loadUsersForAdmin();
}

function closeAdminModal() {
  document.getElementById('admin-modal').classList.remove('visible');
}

// Último listado de usuarios cargado en el panel de administración (para exportar a Excel).
let adminUsersCache = [];

async function loadUsersForAdmin() {
  if (!currentUser || currentUser.role !== 'admin') return;
  const tbody = document.getElementById('admin-users-rows');
  tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Cargando usuarios...</td></tr>`;
  try {
    const snapshot = await db.collection('usuarios').get();
    if (snapshot.empty) {
      adminUsersCache = [];
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No hay usuarios registrados</td></tr>`;
      return;
    }
    const rows = [];
    snapshot.forEach(doc => rows.push({ uid: doc.id, ...doc.data() }));
    rows.sort((a, b) => (a.nombres || '').localeCompare(b.nombres || '', 'es'));
    adminUsersCache = rows;
    tbody.innerHTML = rows.map(u => `
      <tr>
        <td>${escapeHtml((u.nombres || '') + ' ' + (u.apellidos || ''))}</td>
        <td>${escapeHtml(u.correo || '')}</td>
        <td>${escapeHtml(u.institucion || '')}</td>
        <td>${escapeHtml(u.profesion || '')}</td>
        <td>${escapeHtml((u.comuna || '') + (u.region ? ', ' + u.region : ''))}</td>
        <td>${u.role === 'admin' ? '<span class="badge" style="background: var(--accent-soft); color: var(--navy-deep);">Admin</span>' : 'Usuario'}</td>
        <td>${u.uid === currentUser.uid ? '' : `<button class="btn btn-ghost-light" title="Eliminar usuario" onclick="deleteAdminUser('${u.uid}', '${escapeHtml((u.nombres || '') + ' ' + (u.apellidos || '')).replace(/'/g, "\\'")}')">Eliminar</button>`}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error cargando usuarios:', err);
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Error al cargar usuarios. Verifica tu conexión.</td></tr>`;
  }
}

/**
 * Elimina el perfil de un usuario (colección `usuarios`) desde el panel de
 * administración. No elimina la cuenta de autenticación (Firebase Auth no
 * permite borrar cuentas de otros usuarios desde el cliente): la persona
 * deja de poder usar la app porque su perfil ya no existe.
 */
function deleteAdminUser(uid, nombre) {
  showModal({
    title: 'Eliminar usuario',
    message: `¿Eliminar a ${nombre || 'este usuario'} del sistema? Dejará de poder ingresar a la app.`,
    confirmText: 'Eliminar',
    onConfirm: async () => {
      try {
        await db.collection('usuarios').doc(uid).delete();
        showToast('Usuario eliminado', 'success');
        loadUsersForAdmin();
      } catch (err) {
        console.error('Error eliminando usuario:', err);
        showToast('No se pudo eliminar el usuario', 'error');
      }
    }
  });
}

/**
 * Exporta el listado de usuarios cargado en el panel de administración a un
 * archivo .csv (compatible con Excel), con BOM UTF-8 para que tildes y ñ se
 * muestren correctamente.
 */
function exportUsersExcel() {
  if (!adminUsersCache.length) {
    showToast('No hay usuarios para exportar', 'error');
    return;
  }
  const headers = ['Nombre', 'Apellido', 'RUT', 'Correo', 'Institución', 'Profesión', 'Cargo', 'Región', 'Comuna', 'Teléfono', 'Rol'];
  const csvEscape = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
  const lines = [headers.map(csvEscape).join(';')];
  adminUsersCache.forEach(u => {
    lines.push([
      u.nombres, u.apellidos, u.rut, u.correo, u.institucion, u.profesion,
      u.cargo, u.region, u.comuna, u.telefono,
      u.role === 'admin' ? 'Admin' : 'Usuario'
    ].map(csvEscape).join(';'));
  });
  const csv = '﻿' + lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `usuarios_sitrep_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================
// PUNTO 13 — USAR MIS DATOS COMO VALIDACIÓN
// ============================================================
function usarMisDatosValidacion() {
  if (!currentUser) return;
  const v = getCurrent().validacion;
  v.elabNombre = `${currentUser.nombres || ''} ${currentUser.apellidos || ''}`.trim();
  v.elabCargo = currentUser.cargo
    ? `${currentUser.cargo} — ${currentUser.institucion || ''}`
    : (currentUser.institucion || '');
  v.elabFecha = new Date().toISOString().slice(0, 16);
  v.elabUid = currentUser.uid;
  v.elabCorreo = currentUser.correo;
  saveSitrep();
  renderCurrentSitrep();
  scrollToSection('validacion');
  showToast('Datos completados', 'success');
}
