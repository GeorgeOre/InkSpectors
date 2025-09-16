// Shared JS for simple static auth + state (NOT secure; demo only)
const WORK_EMAIL = "goreandcaro@yourdomain.com";

// Helpers
function $(sel, root=document) { return root.querySelector(sel); }
function on(el, evt, fn) { el && el.addEventListener(evt, fn); }
function save(k,v) { localStorage.setItem(k, JSON.stringify(v)); }
function load(k, def=null) { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } }
function isAuthed() { return !!load('user'); }
function requireAuth() {
  if (!isAuthed()) window.location.href = "../login/";
}
function logout() { localStorage.removeItem('user'); window.location.href = "../"; }
function formatDate(ts) { const d=new Date(ts); return d.toLocaleString(); }

// Documents store
function getDocs() { return load('documents', []); }
function setDocs(d) { save('documents', d); }

function addDoc(title, status='pending mentor review') {
  const docs = getDocs();
  docs.push({ id: Date.now(), title, status, updatedAt: Date.now() });
  setDocs(docs);
}

function updateDocStatus(id, status) {
  const docs = getDocs().map(d => d.id===id ? {...d, status, updatedAt: Date.now()} : d);
  setDocs(docs);
}

function renderDocsTable(root) {
  const docs = getDocs();
  const tbody = root.querySelector('tbody');
  if (!tbody) return;
  tbody.innerHTML = "";
  if (docs.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.innerHTML = "No documents yet. Use <span class='mono'>Add Sample Doc</span> to create one.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  for (const d of docs) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>{d.title}</td>
      <td><span class="badge">{d.status}</span></td>
      <td>{formatDate(d.updatedAt)}</td>
      <td>
        <select data-id="{d.id}">
          <option value="pending mentor review" {d.status==='pending mentor review'?'selected':''}>pending mentor review</option>
          <option value="pending mentee review" {d.status==='pending mentee review'?'selected':''}>pending mentee review</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  }
  // Bind status changes
  tbody.querySelectorAll('select').forEach(sel => {
    on(sel, 'change', (e) => updateDocStatus(parseInt(sel.dataset.id,10), sel.value));
  });
}

// Form submit -> draft email + set submitted flag
function handleFormSubmit(e, form) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  save('formSubmitted', true);
  // Compose mailto
  const subject = encodeURIComponent(`[New Intake] {data.fullname || 'Unknown'} — {data.service}`);
  const body = encodeURIComponent(
`New intake submission

Name: {data.fullname}
Email: {data.email}
School: {data.school}
Grade: {data.grade}
Service needed: {data.service}
Doc type: {data.docType}
Google Doc link: {data.docLink}
Deadlines: {data.deadlines}

Interests / Notes:
{data.notes}

Submitted via static site at: {new Date().toString()}`
  );
  const mailto = `mailto:goreandcaro@yourdomain.com?subject=${subject}&body=${body}`;
  // Open email client in a new tab/window where possible
  window.location.href = mailto;
  // Then go to confirmation
  setTimeout(() => window.location.href = "../form-complete/", 300);
}

// Page-specific initializers
function initAuthButtons() {
  const loginBtn = $('#loginBtn'); const logoutBtn = $('#logoutBtn'); const dashBtn = $('#dashBtn');
  if (isAuthed()) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    if (dashBtn) dashBtn.style.display = 'inline-flex';
  } else {
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (dashBtn) dashBtn.style.display = 'none';
  }
  on(logoutBtn, 'click', logout);
}

function initSignupPage() {
  const form = $('#signupForm');
  if (!form) return;
  on(form, 'submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.email || !data.password) { alert('Please provide email and password.'); return; }
    save('user', { email: data.email, name: data.name || 'Mentee' });
    save('formSubmitted', load('formSubmitted', false)); // preserve if existed
    window.location.href = "../dashboard/";
  });
}

function initLoginPage() {
  const form = $('#loginForm');
  if (!form) return;
  on(form, 'submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    // For demo, any email/password logs in if email matches signup (or accept any)
    save('user', { email: data.email, name: 'Mentee' });
    window.location.href = "../dashboard/";
  });
}

function initDashboardPage() {
  const gate = $('#submissionGate'); const docsCard = $('#docsCard'); const table = $('#docsTable');
  if (!gate) return;
  const submitted = !!load('formSubmitted', false);
  gate.style.display = submitted ? 'none' : 'block';
  docsCard.style.display = 'block';
  if (table) renderDocsTable(table);
  const addBtn = $('#addDocBtn');
  on(addBtn, 'click', () => {
    const title = prompt("Title for your document (e.g., 'UChicago Why Us v1')");
    if (!title) return;
    addDoc(title);
    renderDocsTable(table);
  });
}

function initFormPage() {
  const form = $('#intakeForm');
  if (!form) return;
  on(form, 'submit', (e) => handleFormSubmit(e, form));
  // Prefill email if logged in
  const user = load('user'); if (user) { const em = $('#email'); if (em) em.value = user.email; }
}

function initFormCompletePage() {
  const msg = $('#completeMsg');
  if (!msg) return;
  // Nothing else; just a friendly check
}

document.addEventListener('DOMContentLoaded', () => {
  initAuthButtons();
  initSignupPage();
  initLoginPage();
  initDashboardPage();
  initFormPage();
  initFormCompletePage();
});
