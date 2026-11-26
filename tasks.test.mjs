import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addTask, filterTasks, readTasks, taskStorageKey, toggleTask, writeTasks } from './tasks.mjs';

test('restores valid tasks and ignores duplicate IDs and malformed values', () => {
    const raw = [
        { id: '1', title: ' Estudar ', done: false },
        { id: '1', title: 'Duplicada', done: true },
        { id: '2', title: '  ', done: false },
        { id: '3', title: 'Revisar', done: 'sim' },
        { id: '4', title: 'Organizar', done: true },
        null,
    ];
    assert.deepEqual(readTasks({ getItem: () => JSON.stringify(raw) }), {
        tasks: [
            { id: '1', title: 'Estudar', done: false },
            { id: '4', title: 'Organizar', done: true },
        ],
        readable: false,
    });
});

test('round-trips state and reports inaccessible or malformed storage', () => {
    const values = new Map();
    const storage = {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
    };
    assert.deepEqual(readTasks(storage), { tasks: [], readable: true });
    const tasks = addTask([], 'Usar o teclado', '1');
    assert.equal(writeTasks(storage, tasks), true);
    assert.deepEqual(readTasks(storage), { tasks, readable: true });
    values.set(taskStorageKey, '{"malformed":true}');
    assert.deepEqual(readTasks(storage), { tasks: [], readable: false });
    const unavailable = () => { throw new Error('unavailable'); };
    assert.deepEqual(readTasks({ getItem: unavailable }), { tasks: [], readable: false });
    assert.equal(writeTasks({ setItem: unavailable }, tasks), false);
});

test('trims new titles, bounds their length and filters explicit completion changes', () => {
    const initial = [];
    assert.equal(addTask(initial, '   ', '1'), initial);
    assert.equal(addTask(initial, 'a'.repeat(121), '1'), initial);
    const first = addTask(initial, '  Primeiro  ', '1');
    const second = addTask(first, 'Segundo', '2');
    const updated = toggleTask(second, '1', true);
    assert.deepEqual(filterTasks(updated, 'active'), [{ id: '2', title: 'Segundo', done: false }]);
    assert.deepEqual(filterTasks(updated, 'done'), [{ id: '1', title: 'Primeiro', done: true }]);
    assert.deepEqual(filterTasks(updated, 'all'), updated);
    assert.equal(second[0].done, false);
    assert.deepEqual(filterTasks(toggleTask(updated, '1', false), 'done'), []);
});
