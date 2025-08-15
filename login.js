// >>>>> TROQUE AQUI COM OS DADOS DO SEU SUPABASE <<<<<
const SUPABASE_URL = "https://bgophlququlizkwioveu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnb3BobHF1cXVsaXprd2lvdmV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjM3NDgsImV4cCI6MjA3MDc5OTc0OH0.eJQkx1FDhjeNkKRsRuP2qSEMLvj_u_S_tRevmATJECc";
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const els = {
  loginCard: document.getElementById('login-card'),
  loggedCard: document.getElementById('logged-card'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  btnLogin: document.getElementById('btn-login'),
  btnSignup: document.getElementById('btn-signup'),
  btnRecover: document.getElementById('btn-recover'),
  btnLogout: document.getElementById('btn-logout'),
  btnGo: document.getElementById('btn-go'),
  authMsg: document.getElementById('auth-msg'),
  userEmail: document.getElementById('user-email'),
};

function setView(logged, email=null){
  els.loginCard.classList.toggle('hidden', logged);
  els.loggedCard.classList.toggle('hidden', !logged);
  if (logged) {
    els.userEmail.textContent = `Logado como: ${email ?? ''}`;
    els.btnGo.disabled = true; // habilitaremos quando o painel existir
  } else {
    els.authMsg.textContent = '';
    els.email.value = '';
    els.password.value = '';
  }
}

function showErr(msg){
  els.authMsg.textContent = msg;
  els.authMsg.style.color = '#fca5a5';
}

els.btnLogin.addEventListener('click', async () => {
  const email = els.email.value.trim();
  const password = els.password.value;
  if (!email || !password) return showErr('Preencha e-mail e senha.');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return showErr(error.message);
  // sessão será capturada no onAuthStateChange
});

els.btnSignup.addEventListener('click', async () => {
  const email = els.email.value.trim();
  const password = els.password.value;
  if (!email || !password) return showErr('Defina um e-mail e uma senha.');
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return showErr(error.message);
  els.authMsg.style.color = '#a7f3d0';
  els.authMsg.textContent = 'Conta criada! Se a confirmação por e-mail estiver habilitada, verifique sua caixa de entrada.';
});

els.btnRecover.addEventListener('click', async () => {
  const email = els.email.value.trim();
  if (!email) return showErr('Digite seu e-mail para recuperação.');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin, // ou URL específica de redefinição
  });
  if (error) return showErr(error.message);
  els.authMsg.style.color = '#a7f3d0';
  els.authMsg.textContent = 'Se o e-mail existir, enviaremos um link de redefinição.';
});

els.btnLogout?.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// Inicialização e listener
(async function init(){
  const { data: { session } } = await supabase.auth.getSession();
  setView(!!session, session?.user?.email ?? null);

  supabase.auth.onAuthStateChange((_event, session) => {
    setView(!!session, session?.user?.email ?? null);
  });
})();
