import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById("form");
const input = document.getElementById("input");
const list = document.getElementById("list");
const count = document.getElementById("count");
const clearBtn = document.getElementById("clear");
const filterBtns = document.querySelectorAll(".filter");

let todos = [];
let filter = "all";

// --- Veri katmanı (Supabase) ---

async function loadTodos() {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    showError("Görevler yüklenemedi: " + error.message);
    return;
  }
  todos = data;
  render();
}

async function addTodo(text) {
  const { data, error } = await supabase
    .from("todos")
    .insert({ text })
    .select()
    .single();
  if (error) {
    showError("Görev eklenemedi: " + error.message);
    return;
  }
  todos.push(data);
  render();
}

async function toggleTodo(todo, done) {
  const { error } = await supabase
    .from("todos")
    .update({ done })
    .eq("id", todo.id);
  if (error) {
    showError("Güncellenemedi: " + error.message);
    return;
  }
  todo.done = done;
  render();
}

async function deleteTodo(id) {
  const { error } = await supabase.from("todos").delete().eq("id", id);
  if (error) {
    showError("Silinemedi: " + error.message);
    return;
  }
  todos = todos.filter(t => t.id !== id);
  render();
}

async function clearDone() {
  const doneIds = todos.filter(t => t.done).map(t => t.id);
  if (doneIds.length === 0) return;
  const { error } = await supabase.from("todos").delete().in("id", doneIds);
  if (error) {
    showError("Temizlenemedi: " + error.message);
    return;
  }
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

loadTodos();
