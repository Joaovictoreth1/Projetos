export const taskStorageKey = 'projetos.tasks.v1';
export const taskTitleLimit = 120;

export function readTasks(storage) {
    try {
        const raw = storage.getItem(taskStorageKey);
        const parsed = raw === null ? [] : JSON.parse(raw);
        if (!Array.isArray(parsed)) return { tasks: [], readable: false };
        const ids = new Set();
        let readable = true;
        const tasks = [];

        for (const task of parsed) {
            if (!task || typeof task.id !== 'string' || !task.id || ids.has(task.id)
                || typeof task.title !== 'string' || !task.title.trim()
                || task.title.length > taskTitleLimit || typeof task.done !== 'boolean') {
                readable = false;
                continue;
            }
            ids.add(task.id);
            tasks.push({ id: task.id, title: task.title.trim(), done: task.done });
        }
        return { tasks, readable };
    } catch {
        return { tasks: [], readable: false };
    }
}

export function writeTasks(storage, tasks) {
    try {
        storage.setItem(taskStorageKey, JSON.stringify(tasks));
        return true;
    } catch {
        return false;
    }
}

export function addTask(tasks, title, newId) {
    const normalized = title.trim();
    if (!normalized || normalized.length > taskTitleLimit) return tasks;
    return [...tasks, { id: newId, title: normalized, done: false }];
}

export function toggleTask(tasks, id, done) {
    return tasks.map(task => task.id === id ? { ...task, done } : task);
}

export function removeTask(tasks, id) {
    const index = tasks.findIndex(task => task.id === id);
    if (index === -1) return { remaining: tasks, removed: null };
    return {
        remaining: tasks.filter(task => task.id !== id),
        removed: { task: tasks[index], index },
    };
}

export function restoreTask(tasks, { task, index }) {
    if (tasks.some(candidate => candidate.id === task.id)) return tasks;
    return [...tasks.slice(0, index), task, ...tasks.slice(index)];
}

export function filterTasks(tasks, filter) {
    if (filter === 'active') return tasks.filter(task => !task.done);
    if (filter === 'done') return tasks.filter(task => task.done);
    return tasks;
}

function bindTaskList(document, storage) {
    const form = document.getElementById('task-form');
    const input = document.getElementById('new-task');
    const list = document.getElementById('task-list');
    const empty = document.getElementById('task-empty');
    const summary = document.getElementById('task-summary');
    const feedback = document.getElementById('task-feedback');
    const undo = document.getElementById('undo-task');
    const storageStatus = document.getElementById('task-storage');
    const filters = [...document.querySelectorAll('[data-filter]')];
    const initial = readTasks(storage);
    let tasks = initial.tasks;
    let filter = 'all';
    let lastRemoved = null;

    function indicateStorage(text) {
        storageStatus.hidden = !text;
        storageStatus.textContent = text;
    }

    function commit(next) {
        tasks = next;
        indicateStorage(writeTasks(storage, tasks) ? '' : 'Não foi possível salvar. As alterações ficam só nesta aba.');
    }

    function render() {
        const visible = filterTasks(tasks, filter);
        const done = tasks.filter(task => task.done).length;
        const focusTargets = [];
        list.replaceChildren();
        empty.hidden = visible.length > 0;
        empty.textContent = tasks.length ? 'Nenhuma tarefa neste filtro.' : 'Sua lista está vazia.';
        summary.textContent = `${done} de ${tasks.length} concluídas`;

        visible.forEach((task, index) => {
            const row = document.createElement('li');
            row.className = 'task-row';
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.done;
            const title = document.createElement('span');
            title.textContent = task.title;
            label.append(checkbox, title);

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'remove';
            remove.textContent = 'Excluir';
            remove.setAttribute('aria-label', `Excluir tarefa: ${task.title}`);
            checkbox.addEventListener('change', () => {
                commit(toggleTask(tasks, task.id, checkbox.checked));
                feedback.textContent = checkbox.checked ? 'Tarefa concluída.' : 'Tarefa reaberta.';
                moveFocus(render(), index, 'checkbox');
            });
            remove.addEventListener('click', () => {
                const { remaining, removed } = removeTask(tasks, task.id);
                if (!removed) return;
                lastRemoved = removed;
                commit(remaining);
                undo.hidden = false;
                feedback.textContent = 'Tarefa removida. Você pode desfazer a última exclusão.';
                moveFocus(render(), index, 'remove');
            });
            row.append(label, remove);
            list.append(row);
            focusTargets.push({ checkbox, remove });
        });
        return focusTargets;
    }

    function moveFocus(targets, index, control) {
        const target = targets[Math.min(index, targets.length - 1)];
        (target?.[control] ?? input).focus();
    }

    undo.addEventListener('click', () => {
        if (!lastRemoved) return;
        const { task } = lastRemoved;
        commit(restoreTask(tasks, lastRemoved));
        lastRemoved = null;
        const targets = filterTasks(tasks, filter).includes(task) ? render() : setFilter('all');
        moveFocus(targets, filterTasks(tasks, filter).indexOf(task), 'checkbox');
        undo.hidden = true;
        feedback.textContent = 'Tarefa restaurada.';
    });

    form.addEventListener('submit', event => {
        event.preventDefault();
        const used = new Set(tasks.map(task => task.id));
        if (lastRemoved) used.add(lastRemoved.task.id);
        let id = Date.now();
        while (used.has(String(id))) id++;
        const next = addTask(tasks, input.value, String(id));
        if (tasks === next) {
            feedback.textContent = 'Digite um título de até 120 caracteres.';
            return;
        }
        commit(next);
        if (filter === 'done') setFilter('active');
        else render();
        form.reset();
        input.focus();
        feedback.textContent = 'Tarefa adicionada.';
    });

    function setFilter(value) {
        filter = value;
        for (const button of filters) {
            button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
        }
        return render();
    }

    for (const button of filters) {
        button.addEventListener('click', () => {
            feedback.textContent = '';
            setFilter(button.dataset.filter);
        });
    }
    if (!initial.readable) indicateStorage('Não foi possível restaurar toda a lista salva.');
    render();
}

if (typeof document !== 'undefined') {
    const storage = {
        getItem: key => localStorage.getItem(key),
        setItem: (key, value) => localStorage.setItem(key, value),
    };
    bindTaskList(document, storage);
}
