/** @typedef {{ text: string, done: boolean }} Task */

/** @param {string} text */
export function newTask(text) {
  const trimmed = text.trim();
  return trimmed ? { text: trimmed, done: false } : null;
}

/** @param {unknown} entry @returns {entry is Task} */
function isTask(entry) {
  return (
    typeof entry === "object" &&
    entry !== null &&
    "text" in entry &&
    typeof entry.text === "string" &&
    entry.text.trim() !== "" &&
    "done" in entry &&
    typeof entry.done === "boolean"
  );
}

/** @param {string | null} stored @returns {Task[]} */
export function parseTasks(stored) {
  if (stored === null) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isTask) : [];
  } catch {
    return [];
  }
}
