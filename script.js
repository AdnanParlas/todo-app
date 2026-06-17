import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Elementler ---
const authView = document.getElementById("auth-view");
const appView = document.getElementById("app-view");
const authForm = document.getElementById("auth-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupBtn = document.getElementById("signup-btn");
const authMsg = document.getElementById("auth-msg");
const userEmail = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");

const form = document.getElementById("form");
const input = document.getElementById("input");
const list = document.getElementById("list");
const count = document.getElementById("count");
const clearBtn = document.getElementById("clear");
const filterBtns = document.querySelectorAll(".filter");

let todos = [];
let filter = "all";
let user = null;

// --- Kimlik doğrulama ---

function setAuthMsg(text, isError = true) {
  authMsg.textContent = text;
  authMsg.style.color = isError ? "#d33" : "#2a9d3f";
}

authForm.addEventListener("submit", async e => {
  e.preventDefault();
  await signIn();
});

signupBtn.addEventListener("click", signUp);

async function signIn() {
  setAuthMsg("");
  const { error } = await supabase.auth.signInWithPassword({
    email: emailInput.value.trim(),
    password: passwordInput.value,
  });
  if (error) setAuthMsg("Giriş başarısız: " + cevir(error.message));
}

async function signUp() {
  setAuthMsg("");
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || password.length < 6) {
    setAuthMsg("Lütfen geçerli bir e-posta ve en az 6 karakterli şifre gir.");
    return;
  }
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    setAuthMsg("Kayıt başarısız: " + cevir(error.message));
    return;
  }
  // E-posta onayı kapalı olduğu için kullanıcı doğrudan giriş yapmış olur.
  setAuthMsg("Kayıt başarılı! Giriş yapılıyor...", false);
}

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
});

// Oturum durumunu izle: giriş/çıkışta ekranı otomatik değiştir.
supabase.auth.onAuthStateChange((_event, session) => {
  user = session?.user ?? null;
  if (user) {
    showApp();
  } else {
    showAuth();
  }
});

function showAuth() {
  appView.hidden = true;
  authView.hidden = false;
  todos = [];
  authForm.reset();
}

function showApp() {
  authView.hidden = true;
  appView.hidden = false;
  userEmail.textContent = user.email;
  loadTodos();
}

// Hata mesajlarını Türkçeleştir (sık görülenler).
function cevir(msg) {
  if (/Invalid login credentials/i.test(msg)) return "E-posta veya şifre hatalı.";
  if (/User already registered/i.test(msg)) return "Bu e-posta zaten kayıtlı. Giriş yapmayı dene.";
  if (/Password should be/i.test(msg)) return "Şifre en az 6 karakter olmalı.";
  return msg;
}

// --- Veri katmanı (Supabase) ---

async function loadTodos() {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return showError("Görevler yüklenemedi: " + error.message);
  todos = data;
  render();
}

async function addTodo(text) {
  const { data, error } = await supabase
    .from("todos")
    .insert({ text, user_id: user.id })
    .select()
    .single();
  if (error) return showError("Görev eklenemedi: " + error.message);
  todos.push(data);
  render();
}

async function toggleTodo(todo, done) {
  const { error } = await supabase.from("todos").update({ done }).eq("id", todo.id);
  if (error) return showError("Güncellenemedi: " + error.message);
  todo.done = done;
  render();
}

async function deleteTodo(id) {
  const { error } = await supabase.from("todos").delete().eq("id", id);
  if (error) return showError("Silinemedi: " + error.message);
  todos = todos.filter(t => t.id !== id);
  render();
}

async function clearDone() {
  const doneIds = todos.filter(t => t.done).map(t => t.id);
  if (doneIds.length === 0) return;
  const { error } = await supabase.from("todos").delete().in("id", doneIds);
  if (error) return showError("Temizlenemedi: " + error.message);
  todos = todos.filter(t => !t.done);
  render();
}

// --- Arayüz ---

function showError(msg) {
  list.innerHTML = "";
  const li = document.createElement("li");
  li.className = "empty";
  li.style.color = "#d33";
  li.textContent = "⚠ " + msg;
  list.appendChild(li);
}

function render() {
  list.innerHTML = "";

  const filtered = todos.filter(t => {
    if (filter === "active") return !t.done;
    if (filter === "done") return t.done;
    return true;
  });

  if (filtered.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Görev yok 🎉";
    list.appendChild(li);
  }

  filtered.forEach(todo => {
    const li = document.createElement("li");
    li.className = "item" + (todo.done ? " done" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", () => toggleTodo(todo, checkbox.checked));

    const span = document.createElement("span");
    span.className = "text";
    span.textContent = todo.text;

    const del = document.createElement("button");
    del.className = "del";
    del.textContent = "✕";
    del.addEventListener("click", () => deleteTodo(todo.id));

    li.append(checkbox, span, del);
    list.appendChild(li);
  });

  const remaining = todos.filter(t => !t.done).length;
  count.textContent = `${remaining} görev kaldı`;
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  addTodo(text);
});

clearBtn.addEventListener("click", clearDone);

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.dataset.filter;
    render();
  });
});
