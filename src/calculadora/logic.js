/** @param {string} expression */
export function evaluate(expression) {
  const text = expression.trim();
  const number = /(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/y;
  let offset = 0;

  function skipSpace() {
    while (/\s/.test(text.charAt(offset))) offset++;
  }

  function operand() {
    skipSpace();
    let sign = 1;
    while (text[offset] === "-") {
      sign *= -1;
      offset++;
      skipSpace();
    }
    number.lastIndex = offset;
    const match = number.exec(text);
    if (!match) return NaN;
    offset = number.lastIndex;
    return sign * Number(match[0]);
  }

  let total = 0;
  let term = operand();
  while (Number.isFinite(term)) {
    skipSpace();
    if (offset === text.length) {
      const result = total + term;
      if (!Number.isFinite(result)) return "Erro";
      const rounded = Number(result.toPrecision(15));
      return String(Number.isFinite(rounded) ? rounded : result);
    }

    const operator = text[offset++];
    const next = operand();
    if (!Number.isFinite(next)) break;

    switch (operator) {
      case "+":
      case "-":
        total += term;
        term = operator === "+" ? next : -next;
        break;
      case "*":
        term *= next;
        break;
      case "/":
        if (next === 0) return "Erro";
        term /= next;
        break;
      default:
        return "Erro";
    }
  }
  return "Erro";
}
