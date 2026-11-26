export function evaluateExpression(expression) {
    const tokens = expression.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|[+\-*/]/g) ?? [];
    if (tokens.join('') !== expression || !tokens.length) throw new Error('Expressão inválida');
    let i = 0;
    const number = () => {
        const sign = tokens[i] === '-' ? -1 : 1;
        if (sign === -1) i++;
        const token = tokens[i++];
        if (!token || !/[\d.]/.test(token)) throw new Error('Esperava um número');
        return sign * Number(token);
    };

    let result = 0;
    let term = number();
    while (i < tokens.length) {
        const operator = tokens[i++];
        const value = number();
        if (operator === '*') term *= value;
        else if (operator === '/') term /= value;
        else if (operator === '+' || operator === '-') {
            result += term;
            term = operator === '-' ? -value : value;
        } else throw new Error('Esperava um operador');
    }

    result += term;
    if (!Number.isFinite(result)) throw new Error('Resultado inválido');
    return result;
}

export const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';

export function generatePassword(length, random = globalThis.crypto) {
    if (!Number.isInteger(length) || length < 6 || length > 30) throw new RangeError('Tamanho inválido');
    const limit = 256 - (256 % alphabet.length);
    const bytes = new Uint8Array(length);
    let result = '';
    while (result.length < length) {
        random.getRandomValues(bytes);
        for (const byte of bytes) {
            if (byte < limit) result += alphabet[byte % alphabet.length];
            if (result.length === length) break;
        }
    }
    return result;
}
