/** @typedef {"X" | "O"} Player */
/** @typedef {{ board: (Player | "")[], turn: Player, winner: Player | "", line: number[], draw: boolean }} Game */

const lines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/** @returns {Game} */
export function newGame() {
  return {
    board: Array(9).fill(""),
    turn: "X",
    winner: "",
    line: [],
    draw: false,
  };
}

/** @param {Game} game @param {number} index @returns {Game} */
export function move(game, index) {
  if (game.winner || game.draw || game.board[index] !== "") return game;

  const board = game.board.slice();
  board[index] = game.turn;
  const line = lines.find((cells) =>
    cells.every((cell) => board[cell] === game.turn),
  );
  if (line) return { ...game, board, winner: game.turn, line: [...line] };

  return {
    ...game,
    board,
    turn: game.turn === "X" ? "O" : "X",
    draw: !board.includes(""),
  };
}
