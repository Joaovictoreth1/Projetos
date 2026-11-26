import { element } from "../shared/dom.js";
import { move, newGame } from "./logic.js";

const board = element("tabuleiro", HTMLElement);
const status = element("status", HTMLElement);
const reset = element("reiniciar", HTMLButtonElement);
let game = newGame();

const buttons = game.board.map((_, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "celula";
  button.addEventListener("click", () => {
    const next = move(game, index);
    if (next !== game) {
      game = next;
      render();
    }
  });
  board.append(button);
  return button;
});

function render() {
  buttons.forEach((button, index) => {
    const value = game.board[index];
    button.textContent = value;
    button.setAttribute("aria-label", `Casa ${index + 1}: ${value || "vazia"}`);
    button.setAttribute(
      "aria-disabled",
      String(!!(value || game.winner || game.draw)),
    );
    button.classList.toggle("vencedora", game.line.includes(index));
  });
  status.textContent = game.winner
    ? `Jogador ${game.winner} venceu!`
    : game.draw
      ? "Deu Velha!"
      : `Vez do ${game.turn}`;
}

reset.addEventListener("click", () => {
  game = newGame();
  render();
  buttons[0].focus();
});

render();
