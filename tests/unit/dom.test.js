// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import { element } from "../../src/shared/dom.js";

/** @param {string} page */
function load(page) {
  const html = readFileSync(`${page}.html`, "utf8");
  const parsed = new DOMParser().parseFromString(html, "text/html");
  document.body.replaceChildren(...parsed.body.childNodes);
}

/** @param {string} selector */
const find = (selector) => document.querySelector(selector);

/** @param {string} key @param {KeyboardEventInit} [options] */
function press(key, options = {}) {
  const event = new KeyboardEvent("keydown", {
    key,
    cancelable: true,
    bubbles: true,
    ...options,
  });
  (document.activeElement ?? document).dispatchEvent(event);
  return event;
}

/** @param {string} text */
function submitTask(text) {
  find("#nova-tarefa").value = text;
  find("#form-tarefa").dispatchEvent(new Event("submit", { cancelable: true }));
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.resetModules();
  localStorage.clear();
  document.body.replaceChildren();
});

it("rejeita IDs ausentes e elementos do tipo errado", () => {
  load("01_calculadora_simples");
  expect(() => element("ausente", HTMLInputElement)).toThrow(
    "Elemento inválido",
  );
  expect(() => element("display", HTMLButtonElement)).toThrow(
    "Elemento inválido",
  );
});

it("opera a calculadora pelo teclado e pelos botões e permite recuperar de erro", async () => {
  load("01_calculadora_simples");
  await import("../../src/calculadora/main.js");
  expect(find("#display").readOnly).toBe(true);
  find('button[value="8"]').click();
  expect(press("4", { ctrlKey: true }).defaultPrevented).toBe(false);
  expect(press("b").defaultPrevented).toBe(false);
  expect(press("9", { isComposing: true }).defaultPrevented).toBe(false);
  press("/");
  press("0");
  press("Enter");
  expect(find("#resultado").textContent).toBe("Erro");
  press("Backspace");
  expect(find("#display").value).toBe("");
  press("=");
  press("3");
  press("+");
  press("2");
  press("Enter");
  expect(find("#display").value).toBe("5");
  press("*");
  press("2");
  press("Enter");
  expect(find("#display").value).toBe("10");
  press("4");
  press("7");
  press("Backspace");
  expect(find("#display").value).toBe("4");
  find('button[value="Escape"]').click();
  expect(find("#display").value).toBe("");

  const two = find('button[value="2"]');
  two.focus();
  two.click();
  expect(document.activeElement).toBe(two);
  expect(press("+").defaultPrevented).toBe(true);
  expect(press("3").defaultPrevented).toBe(true);
  const enter = press("Enter");
  // jsdom does not activate the focused button for a synthetic keydown.
  if (!enter.defaultPrevented) two.click();
  expect(find("#display").value).toBe("5");
  expect(enter.defaultPrevented).toBe(true);
  expect(press("Backspace").defaultPrevented).toBe(true);
  expect(press("Escape").defaultPrevented).toBe(true);
});

it("renderiza tarefas existentes, salva edições e mantém botões acessíveis", async () => {
  load("02_lista_de_tarefas");
  localStorage.setItem(
    "projetos.tarefas.v1",
    JSON.stringify([{ text: "Ler", done: true }]),
  );
  await import("../../src/tarefas/main.js");
  submitTask(" ");
  expect(document.querySelectorAll("li")).toHaveLength(1);
  submitTask("<b>Estudar</b>");
  expect(find("li b")).toBeNull();
  const toggle = find(".btn-task");
  expect(toggle.getAttribute("aria-pressed")).toBe("true");
  toggle.click();
  expect(toggle.getAttribute("aria-pressed")).toBe("false");
  expect(JSON.parse(localStorage.getItem("projetos.tarefas.v1"))[0].done).toBe(
    false,
  );
  find(".btn-delete").click();
  expect(document.activeElement.textContent).toBe("<b>Estudar</b>");
  find(".btn-delete").click();
  expect(document.activeElement.id).toBe("nova-tarefa");
  expect(JSON.parse(localStorage.getItem("projetos.tarefas.v1"))).toEqual([]);
});

it("mantém a lista utilizável quando o armazenamento é bloqueado", async () => {
  load("02_lista_de_tarefas");
  const fail = () => {
    throw new Error("storage blocked");
  };
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(fail);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(fail);
  await import("../../src/tarefas/main.js");
  expect(find("#status").textContent).toMatch(/indisponível/);
  submitTask("Estudar");
  expect(find("#status").textContent).toMatch(/Não foi possível salvar/);
  expect(find("li").textContent).toContain("Estudar");
});

it("atualiza o relógio na próxima virada, mesmo que abra no meio do segundo", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2024, 0, 2, 3, 4, 5, 750));
  load("03_rel_gio_digital");
  await import("../../src/relogio/main.js");
  expect(find("#tempo").textContent).toBe("03:04:05");
  expect(find("#data").textContent).toMatch(/2 de janeiro/);
  vi.advanceTimersByTime(250);
  expect(find("#tempo").textContent).toBe("03:04:06");
});

it("gera, copia e relata falhas sem bloquear a interface", async () => {
  load("04_gerador_de_senhas");
  const writeText = vi
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error("denied"));
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  await import("../../src/senhas/main.js");
  expect(find("#senha").textContent).toHaveLength(12);
  const slider = find("#slider");
  slider.value = "16";
  slider.dispatchEvent(new Event("input"));
  expect(find("#valor-tamanho").textContent).toBe("16");
  const options = document.querySelectorAll("input[type=checkbox]");
  options.forEach((option) => option.click());
  expect(find("#gerar").disabled).toBe(true);
  expect(find("#status").textContent).toMatch(/pelo menos um/);
  options[2].click();
  find("#gerar").click();
  expect(find("#senha").textContent).toMatch(/^\d{16}$/);
  find("#copiar").click();
  await Promise.resolve();
  expect(writeText).toHaveBeenCalledWith(find("#senha").textContent);
  expect(find("#status").textContent).toBe("Senha copiada.");
  find("#copiar").click();
  await Promise.resolve();
  expect(find("#status").textContent).toMatch(/Não foi possível copiar/);

  let finishCopy;
  writeText.mockImplementationOnce(
    () => new Promise((resolve) => (finishCopy = resolve)),
  );
  find("#copiar").click();
  find("#gerar").click();
  finishCopy();
  await Promise.resolve();
  expect(find("#status").textContent).toBe("");

  writeText.mockImplementationOnce(
    () => new Promise((_, reject) => (finishCopy = reject)),
  );
  find("#copiar").click();
  find("#gerar").click();
  finishCopy(new Error("denied"));
  await Promise.resolve();
  expect(find("#status").textContent).toBe("");

  vi.spyOn(crypto, "getRandomValues").mockImplementation(() => {
    throw new Error("no rng");
  });
  find("#gerar").click();
  expect(find("#copiar").disabled).toBe(true);
  expect(find("#status").textContent).toMatch(/Não foi possível gerar/);
});

it("avisa quando nenhuma classe padrão está disponível", async () => {
  load("04_gerador_de_senhas");
  document
    .querySelectorAll("input[type=checkbox]")
    .forEach((input) => (input.checked = false));
  await import("../../src/senhas/main.js");
  expect(find("#senha").textContent).toBe("…");
  expect(find("#gerar").disabled).toBe(true);
});

it("marca a vitória, ignora jogadas inválidas e reinicia com foco no tabuleiro", async () => {
  load("05_jogo_da_velha");
  await import("../../src/jogo-da-velha/main.js");
  const cells = document.querySelectorAll(".celula");
  expect(cells).toHaveLength(9);
  [0, 0, 3, 1, 4, 2, 8].forEach((index) => cells[index].click());
  expect(cells[8].textContent).toBe("");
  expect(find("#status").textContent).toBe("Jogador X venceu!");
  expect(document.querySelectorAll(".vencedora")).toHaveLength(3);
  find("#reiniciar").click();
  expect(document.activeElement).toBe(cells[0]);
  [0, 1, 2, 4, 3, 5, 7, 6, 8].forEach((index) => cells[index].click());
  expect(find("#status").textContent).toBe("Deu velha!");
});

it("pausa, continua de onde parou e zera o cronômetro", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  load("06_cronometro");
  await import("../../src/cronometro/main.js");
  expect(find("#pausar").disabled).toBe(true);
  expect(find("#zerar").disabled).toBe(true);
  find("#iniciar").click();
  expect(find("#iniciar").disabled).toBe(true);
  vi.advanceTimersByTime(2250);
  find("#pausar").click();
  vi.advanceTimersByTime(5000);
  expect(find("#display").textContent).toBe("00:00:02");
  expect(find("#zerar").disabled).toBe(false);
  find("#iniciar").click();
  vi.advanceTimersByTime(750);
  expect(find("#display").textContent).toBe("00:00:03");
  find("#zerar").click();
  expect(find("#display").textContent).toBe("00:00:00");
  expect(find("#pausar").disabled).toBe(true);
});
