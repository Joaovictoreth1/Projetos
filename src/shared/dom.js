/**
 * @template {HTMLElement} T
 * @param {string} id
 * @param {new () => T} kind
 * @returns {T}
 */
export function element(id, kind) {
  const node = document.getElementById(id);
  if (!(node instanceof kind)) throw new Error(`Elemento inválido: ${id}`);
  return node;
}
