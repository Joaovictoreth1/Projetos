import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alphabet, evaluateExpression, generatePassword } from './exercises.mjs';

test('calculator applies precedence and supports decimal and negative operands', () => {
    assert.equal(evaluateExpression('2+3*4-1'), 13);
    assert.equal(evaluateExpression('-4/-2+.5'), 2.5);
    assert.equal(evaluateExpression('1e+21/1e+20'), 10);
});

test('calculator rejects incomplete, nonnumeric and nonfinite expressions', () => {
    for (const expression of ['', '1+', '1..2', '1.2.3-4', 'alert(1)', '5/0', '2**3']) {
        assert.throws(() => evaluateExpression(expression));
    }
});

test('password generation uses Web Crypto and discards out-of-range bytes', () => {
    let next = 0;
    const random = { getRandomValues(buffer) {
        for (let i = 0; i < buffer.length; i++) buffer[i] = [255, 0, 1, 2, 3, 4, 5][next++ % 7];
        return buffer;
    } };
    assert.equal(generatePassword(6, random), alphabet.slice(0, 6));
    assert.equal(generatePassword(30).length, 30);
    assert.throws(() => generatePassword(0), RangeError);
});
