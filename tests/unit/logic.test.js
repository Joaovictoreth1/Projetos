import { describe, expect, it, vi } from "vitest";
import { evaluate } from "../../src/calculadora/logic.js";
import {
  elapsed,
  formatElapsed,
  newStopwatch,
  pause,
  start,
} from "../../src/cronometro/logic.js";
import { move, newGame } from "../../src/jogo-da-velha/logic.js";
import { delayToNextSecond, formatClock } from "../../src/relogio/logic.js";
import { generatePassword } from "../../src/senhas/logic.js";
import { newTask, parseTasks } from "../../src/tarefas/logic.js";

describe("calculadora", () => {
  it.each([
    ["2 + 3 * 4 - 6 / 2", "11"],
    ["8/4/2", "1"],
    ["10 - 4 - 2", "4"],
    [" - .5 * -2. + --3 ", "4"],
    ["0.1+0.2", "0.3"],
    ["1e-16 * 2", "2e-16"],
    ["1.7976931348623157e308", "1.7976931348623157e+308"],
  ])("calcula %s", (expression, result) =>
    expect(evaluate(expression)).toBe(result),
  );

  it.each([
    "",
    "-",
    "9 +",
    "1.2.3",
    "1 / -0",
    "2 ^ 3",
    "1e309",
    "1e308 * 10",
    "1e308 + 1e308",
    "alert(1)",
  ])("rejeita %j", (expression) => expect(evaluate(expression)).toBe("Erro"));
});

describe("tarefas", () => {
  it("remove espaços das novas tarefas e não cria tarefas vazias", () => {
    expect(newTask("  Comprar leite  ")).toEqual({
      text: "Comprar leite",
      done: false,
    });
    expect(newTask(" \n ")).toBeNull();
  });

  it("recupera tarefas válidas de uma lista com registros corrompidos", () => {
    const task = { text: "Ler", done: true };
    expect(
      parseTasks(
        JSON.stringify([
          null,
          1,
          {},
          { text: 2 },
          { text: " " },
          { text: "Ler" },
          { text: "Ler", done: 1 },
          task,
        ]),
      ),
    ).toEqual([task]);
  });

  it.each([null, "", "{}", "[]", "null"])(
    "ignora armazenamento vazio ou inválido (%j)",
    (value) => {
      expect(parseTasks(value)).toEqual([]);
    },
  );
});

describe("relógio", () => {
  it("formata data e hora locais em português", () => {
    expect(formatClock(new Date(2024, 0, 2, 3, 4, 5))).toEqual({
      time: "03:04:05",
      date: "terça-feira, 2 de janeiro de 2024",
    });
  });

  it("agenda a próxima virada de segundo", () => {
    expect(delayToNextSecond(74250)).toBe(750);
    expect(delayToNextSecond(75000)).toBe(1000);
  });

  it("rejeita datas inválidas", () => {
    expect(() => formatClock(new Date(NaN))).toThrow(RangeError);
  });
});

describe("senhas", () => {
  it("inclui todas as classes distintas solicitadas", () => {
    const password = generatePassword(30, [
      "upper",
      "lower",
      "digits",
      "symbols",
      "upper",
    ]);
    expect(password).toHaveLength(30);
    for (const pattern of [/[A-Z]/, /[a-z]/, /[0-9]/, /[!@#$%^&*()_+]/]) {
      expect(password).toMatch(pattern);
    }
  });

  it("descarta valores fora do intervalo antes de reduzir ao alfabeto", () => {
    const fill = vi.fn((buffer) => (buffer[0] = 0));
    fill.mockImplementationOnce((buffer) => (buffer[0] = 0xffffffff));
    expect(generatePassword(6, ["digits"], fill)).toBe("000000");
    expect(fill).toHaveBeenCalledTimes(12);
  });

  it.each([
    [6, []],
    [5, ["upper"]],
    [31, ["upper"]],
    [6.5, ["lower"]],
    [6, ["toString"]],
  ])("rejeita tamanho ou classes inválidos (%d, %j)", (length, selected) =>
    expect(() => generatePassword(length, selected)).toThrow(RangeError),
  );
});

describe("jogo da velha", () => {
  it("alterna os jogadores sem modificar o jogo anterior", () => {
    const initial = newGame();
    expect(initial.board).toEqual(Array(9).fill(""));
    const game = move(initial, 4);
    expect(initial.board[4]).toBe("");
    expect(game.board[4]).toBe("X");
    expect(game.turn).toBe("O");
    expect(move(game, 4)).toBe(game);
    expect(move(game, 9)).toBe(game);
  });

  it.each([
    [[0, 3, 1, 4, 2], "X", [0, 1, 2]],
    [[2, 0, 3, 4, 7, 8], "O", [0, 4, 8]],
  ])("identifica a vitória no tabuleiro %j", (moves, winner, line) => {
    const game = moves.reduce(move, newGame());
    expect(game).toMatchObject({ winner, line, draw: false });
    expect(move(game, 6)).toBe(game);
  });

  it("trava o tabuleiro ao empatar", () => {
    const game = [0, 1, 2, 4, 3, 5, 7, 6, 8].reduce(move, newGame());
    expect(game).toMatchObject({ draw: true, winner: "", line: [] });
    expect(move(game, 0)).toBe(game);
  });
});

describe("cronômetro", () => {
  it("mede o tempo acumulado sem depender dos disparos do temporizador", () => {
    const initial = newStopwatch();
    const running = start(initial, 1000);
    expect(elapsed(initial, 1000)).toBe(0);
    expect(elapsed(running, 7000)).toBe(6000);
    const paused = pause(running, 7500);
    expect(elapsed(paused, 9000)).toBe(6500);
    expect(elapsed(start(paused, 10000), 10500)).toBe(7000);
  });

  it("ignora transições redundantes", () => {
    const initial = newStopwatch();
    expect(pause(initial, 0)).toBe(initial);
    const running = start(initial, 0);
    expect(start(running, 100)).toBe(running);
  });

  it("formata segundos inteiros e horas acima de 99", () => {
    expect(formatElapsed(999)).toBe("00:00:00");
    expect(formatElapsed(3661999)).toBe("01:01:01");
    expect(formatElapsed(360000000)).toBe("100:00:00");
  });
});
