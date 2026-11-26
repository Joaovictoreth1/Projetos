const classes = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()_+",
};

/** @typedef {keyof typeof classes} CharacterClass */
/** @typedef {(buffer: Uint32Array) => void} FillRandom */
const maxValue = 2 ** 32;

/** @param {number} size @param {FillRandom} fill @param {Uint32Array} buffer */
function randomIndex(size, fill, buffer) {
  const limit = maxValue - (maxValue % size);
  do {
    fill(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % size;
}

/**
 * @param {number} length
 * @param {CharacterClass[]} selected
 * @param {FillRandom} [fill]
 */
export function generatePassword(
  length,
  selected,
  fill = (buffer) => crypto.getRandomValues(buffer),
) {
  if (
    !Number.isInteger(length) ||
    length < 6 ||
    length > 30 ||
    !selected.length ||
    selected.some((name) => !Object.hasOwn(classes, name))
  ) {
    throw new RangeError(
      "Escolha um tamanho e pelo menos um tipo de caractere válidos.",
    );
  }

  const groups = [...new Set(selected)].map((name) => classes[name]);
  const buffer = new Uint32Array(1);
  const combined = groups.join("");
  const password = groups.map(
    (group) => group[randomIndex(group.length, fill, buffer)],
  );
  while (password.length < length) {
    password.push(combined[randomIndex(combined.length, fill, buffer)]);
  }
  for (let i = password.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1, fill, buffer);
    [password[i], password[j]] = [password[j], password[i]];
  }
  return password.join("");
}
