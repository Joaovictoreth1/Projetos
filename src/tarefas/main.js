import { element } from "../shared/dom.js";
import { newTask, parseTasks } from "./logic.js";

const input = element("nova-tarefa", HTMLInputElement);
const list = element("lista", HTMLUListElement);
const form = element("form-tarefa", HTMLFormElement);
const status = element("status", HTMLElement);
const key = "projetos.tarefas.v1";

function load() {
  try {
    return parseTasks(localStorage.getItem(key));
  } catch {
    status.textContent = "O armazenamento local está indisponível.";
    return [];
  }
}

const tasks = load();

function save() {
  try {
    localStorage.setItem(key, JSON.stringify(tasks));
    status.textContent = "";
  } catch {
    status.textContent =
      "Não foi possível salvar suas tarefas neste navegador.";
  }
}

/** @param {import("./logic.js").Task} task */
function addItem(task) {
  const row = document.createElement("li");
  const toggle = document.createElement("button");
  const remove = document.createElement("button");
  toggle.type = "button";
  toggle.className = "btn-task";
  toggle.textContent = task.text;
  toggle.setAttribute("aria-label", `Marcar conclusão: ${task.text}`);
  remove.type = "button";
  remove.className = "btn-delete";
  remove.textContent = "X";
  remove.setAttribute("aria-label", `Excluir: ${task.text}`);

  function update() {
    row.classList.toggle("concluida", task.done);
    toggle.setAttribute("aria-pressed", String(task.done));
  }

  toggle.addEventListener("click", () => {
    task.done = !task.done;
    update();
    save();
  });
  remove.addEventListener("click", () => {
    const adjacent = row.nextElementSibling ?? row.previousElementSibling;
    tasks.splice(tasks.indexOf(task), 1);
    row.remove();
    (adjacent?.querySelector("button") ?? input).focus();
    save();
  });
  row.append(toggle, remove);
  update();
  list.append(row);
}

tasks.forEach(addItem);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const task = newTask(input.value);
  if (!task) return;
  tasks.push(task);
  addItem(task);
  save();
  input.value = "";
  input.focus();
});
