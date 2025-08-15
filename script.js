// === 1) CONFIGURE AQUI ===
const SUPABASE_URL = "https://SEU-PROJECT-URL.supabase.co"; // troque
const SUPABASE_ANON_KEY = "SEU-ANON-PUBLIC-KEY"; // troque
// =========================

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const els = {
  authCard: document.getElementById('auth-card'),
  appCard: document.getElementById('app-card'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  btnLogin: document.getElementById('btn-login'),
  btnSignup: document.getElementById('btn-signup'),
  btnLogout: document.getElementById('btn-logout'),
  userEmail: document.getElementById('user-email'),
  form: document.getElementById('form-tarefa'),
  inputTitulo: document.getElementById('input-titulo'),
  lista: document.getElementById('lista'),
  empty: document.getElementById('empty'),
};

function setLoggedUI(session) {
  const logged = !!session;
  els.authCard.classList.toggle('hidden', logged);
  els.appCard.classList.toggle('hidden', !logged);
  els.btnLogout.classList.toggle('hidden', !logged);
  els.userEmail.textContent = logged ? session.user.email : 'Deslogado';
}

async function loadList() {
  const { data, error } = await supabase.from('tarefas').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return; }
  renderList(data || []);
}

function renderList(items) {
  els.lista.innerHTML = '';
  if (!items.length) { els.empty.classList.remove('hidden'); return; }
  els.empty.classList.add('hidden');

  for (const t of items) {
    const li = document.createElement('li');
    li.className = 'item';
    li.dataset.id = t.id;

    const left = document.createElement('div');
    left.className = 'item-left';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!t.feito;
    cb.addEventListener('change', () => toggleFeito(t.id, cb.checked));

    const title = document.createElement('div');
    title.innerHTML = `<div>${escapeHtml(t.titulo)}</div><div class="small">${new Date(t.created_at).toLocaleString()}</div>`;

    left.appendChild(cb);
    left.appendChild(title);

    const del = document.createElement('button');
    del.className = 'secondary';
    del.textContent = 'Excluir';
    del.addEventListener('click', () => removeItem(t.id));

    li.appendChild(left);
    li.appendChild(del);
    els.lista.appendChild(li);
  }
}

function escapeHtml(s){return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

async function toggleFeito(id, feito) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  // marca o user_id do dono (a primeira vez que alguém mexe)
  await supabase.from('tarefas').update({ feito, user_id: user?.id ?? null }).eq('id', id);
}

async function removeItem(id) {
  await supabase.from('tarefas').delete().eq('id', id);
}

els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const titulo = els.inputTitulo.value.trim();
  if (!titulo) return;
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  const { error } = await supabase.from('tarefas').insert({ titulo, user_id: user?.id ?? null });
  if (!error) els.inputTitulo.value = '';
});

// Login/Signup/Logout
els.btnLogin.addEventListener('click', async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: els.email.value.trim(),
    password: els.password.value,
  });
  if (error) return alert(error.message);
});

els.btnSignup.addEventListener('click', async () => {
  const { data, error } = await supabase.auth.signUp({
    email: els.email.value.trim(),
    password: els.password.value,
  });
  if (error) return alert(error.message);
  alert('Conta criada! Verifique seu e‑mail se a confirmação estiver habilitada.');
});

els.btnLogout.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// Sessão + Realtime
(async function init(){
  const { data: { session } } = await supabase.auth.getSession();
  setLoggedUI(session);
  if (session) await loadList();

  supabase.auth.onAuthStateChange((_event, session) => {
    setLoggedUI(session);
    if (session) loadList();
  });

  // Assinatura realtime: cria/atualiza/remove
  supabase
    .channel('tarefas-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tarefas' }, payload => {
      // Recarrega rápido — simples e eficaz para começo
      loadList();
    })
    .subscribe();
})();
