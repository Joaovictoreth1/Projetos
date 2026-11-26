import { expect, test } from "@playwright/test";

let browserErrors;
test.beforeEach(async ({ page }) => {
  browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  await page.addInitScript(() => {
    window.cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      window.cspViolations.push(event.violatedDirective);
    });
  });
});

test.afterEach(async ({ page }) => {
  expect(browserErrors).toEqual([]);
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
});

async function open(page, path) {
  const response = await page.goto(path);
  expect(response.status()).toBe(200);
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(headers["content-security-policy"]).toContain("script-src 'self'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("no-referrer");
  expect(headers["permissions-policy"]).toBe(
    "camera=(), microphone=(), geolocation=()",
  );
  await expect(
    page.locator('link[rel="icon"][type="image/svg+xml"]'),
  ).toHaveAttribute("href", "favicon.svg");
}

test("a página inicial liga a todos os endereços originais", async ({
  page,
}) => {
  await open(page, "/");
  const icon = await page.request.get("/favicon.svg");
  expect(icon.status()).toBe(200);
  expect(icon.headers()["content-type"]).toBe("image/svg+xml");
  expect(browserErrors).toEqual([]);
  const links = page
    .getByRole("navigation", { name: "Aplicativos" })
    .getByRole("link");
  await expect(links).toHaveText([
    "Calculadora",
    "Lista de Tarefas",
    "Relógio Digital",
    "Gerador de Senhas",
    "Jogo da Velha",
    "Cronômetro",
  ]);
  const paths = await links.evaluateAll((items) =>
    items.map((item) => item.getAttribute("href")),
  );
  const results = await Promise.all(
    paths.map((path) => page.request.get(new URL(path, page.url()).href)),
  );
  expect(results.every((response) => response.ok())).toBe(true);
  await links.first().click();
  await expect(page).toHaveTitle("Calculadora");
});

test("a calculadora respeita precedência e se recupera após divisão por zero", async ({
  page,
}) => {
  await open(page, "/01_calculadora_simples.html");
  const display = page.getByRole("textbox", { name: "Visor da calculadora" });
  await page.keyboard.type("-2+3*4");
  await page.keyboard.press("Enter");
  await expect(display).toHaveValue("10");
  await page.getByRole("button", { name: "/", exact: true }).click();
  await page.getByRole("button", { name: "0", exact: true }).click();
  await page.getByRole("button", { name: "=", exact: true }).click();
  await expect(display).toHaveValue("Erro");
  await page.keyboard.press("Escape");
  await expect(display).toHaveValue("");
});

test("Enter calcula sem ativar o botão em foco", async ({ page }) => {
  await open(page, "/01_calculadora_simples.html");
  const two = page.getByRole("button", { name: "2", exact: true });
  await two.click();
  await expect(two).toBeFocused();
  await page.keyboard.type("+3");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("textbox", { name: "Visor da calculadora" }),
  ).toHaveValue("5");
});

test("a lista mantém texto literal e restaura estado após recarregar", async ({
  page,
}) => {
  await open(page, "/02_lista_de_tarefas.html");
  const text = "<b>Estudar</b>";
  const input = page.getByRole("textbox", { name: "Nova tarefa" });
  await input.fill(text);
  await input.press("Enter");
  const toggle = page.getByRole("button", {
    name: `Marcar conclusão: ${text}`,
  });
  await expect(toggle).toHaveText(text);
  await expect(page.locator("li b")).toHaveCount(0);
  await toggle.click();
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: `Excluir: ${text}` }).click();
  await page.reload();
  await expect(page.getByRole("listitem")).toHaveCount(0);
});

test("o relógio muda na virada de segundo", async ({ page }) => {
  const time = new Date(2024, 0, 2, 3, 4, 5, 750);
  await page.clock.install({ time: time.getTime() - 1000 });
  await page.clock.pauseAt(time);
  await open(page, "/03_rel_gio_digital.html");
  await expect(page.locator("#tempo")).toHaveText("03:04:05");
  await expect(page.locator("#data")).toContainText("2 de janeiro de 2024");
  await page.clock.runFor(250);
  await expect(page.locator("#tempo")).toHaveText("03:04:06");
});

test("o gerador usa as classes selecionadas e copia a senha", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, "/04_gerador_de_senhas.html");
  await expect(page.locator("#senha")).not.toHaveText("…");
  const slider = page.getByRole("slider");
  await slider.press("End");
  await expect(slider).toHaveValue("30");
  for (const name of ["Maiúsculas", "Minúsculas", "Símbolos", "Números"]) {
    await page.getByRole("checkbox", { name }).uncheck();
  }
  await expect(
    page.getByRole("button", { name: "Gerar Senha" }),
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: "Números" }).check();
  await page.getByRole("button", { name: "Gerar Senha" }).click();
  const password = page.locator("#senha");
  await expect(password).toHaveText(/^\d{30}$/);
  await page.getByRole("button", { name: "Copiar" }).click();
  await expect(page.getByRole("status")).toHaveText("Senha copiada.");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    await password.textContent(),
  );
});

test("o jogo destaca a linha vencedora e permite reiniciar", async ({
  page,
}) => {
  await open(page, "/05_jogo_da_velha.html");
  for (const index of [1, 4, 2, 5, 3]) {
    await page.getByRole("button", { name: `Casa ${index}: vazia` }).click();
  }
  await expect(page.locator("#status")).toHaveText("Jogador X venceu!");
  await expect(page.locator(".vencedora")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Casa 9: vazia" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Reiniciar Jogo" }).click();
  await expect(
    page.getByRole("button", { name: "Casa 1: vazia" }),
  ).toBeFocused();
});

test("o cronômetro não perde tempo entre atualizações e pausa sem zerar", async ({
  page,
}) => {
  const time = new Date(2024, 0, 2, 3);
  await page.clock.install({ time: time.getTime() - 1000 });
  await page.clock.pauseAt(time);
  await open(page, "/06_cronometro.html");
  const display = page.getByRole("timer");
  const start = page.getByRole("button", { name: "Iniciar" });
  const pause = page.getByRole("button", { name: "Pausar" });
  await expect(pause).toBeDisabled();
  await start.click();
  await page.clock.fastForward(5250);
  await expect(display).toHaveText("00:00:05");
  await pause.click();
  await page.clock.runFor(750);
  await expect(display).toHaveText("00:00:05");
  await start.click();
  await page.clock.runFor(750);
  await expect(display).toHaveText("00:00:06");
  await page.getByRole("button", { name: "Zerar" }).click();
  await expect(display).toHaveText("00:00:00");
});

test("as sete páginas cabem em uma tela de 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await open(page, "/");
  const paths = await page
    .getByRole("navigation")
    .getByRole("link")
    .evaluateAll((items) => [
      "/",
      ...items.map((item) => item.getAttribute("href")),
    ]);
  for (const path of paths) {
    await open(page, path);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth, path).toBeLessThanOrEqual(clientWidth);
  }
});
