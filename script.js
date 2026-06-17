const form = document.getElementById("form");
const input = document.getElementById("input");
const list = document.getElementById("list");
const count = document.getElementById("count");
const clearBtn = document.getElementById("clear");
const filterBtns = document.querySelectorAll(".filter");

let todos = JSON.parse(localStorage.getItem("todos") || "[]");
let filter = "all";

function save() {
  localStorage.setItem("todos", JSON.stringify(todos));
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
    checkbox.addEventListener("change", () => {
      todo.done = checkbox.checked;
      save();
      render();
    });

    const span = document.createElement("span");
    span.className = "text";
    span.textContent = todo.text;

    const del = document.createElement("button");
    del.className = "del";
    del.textContent = "✕";
    del.addEventListener("click", () => {
      todos = todos.filter(t => t.id !== todo.id);
      save();
      render();
    });

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
  todos.push({ id: Date.now(), text, done: false });
  input.value = "";
  save();
  render();
});

clearBtn.addEventListener("click", () => {
  todos = todos.filter(t => !t.done);
  save();
  render();
});

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.dataset.filter;
    render();
  });
});

render();
