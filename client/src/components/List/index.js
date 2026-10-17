import React from "react";

// This file exports the List, ListItem and GameRow components

export function List({ children }) {
  return (
    <div className="list-overflow-container">
      <ul className="list-group">{children}</ul>
    </div>
  );
}

export function ListItem({ children }) {
  return <li className="list-group-item">{children}</li>;
}

// One game in a results list: thumbnail, name and RAWG rating
export function GameRow({ game, selected, onClick }) {
  return (
    <li
      className={"game-row" + (selected ? " selected" : "")}
      data-id={game.id}
      onClick={onClick}
    >
      <span
        className="game-thumb"
        style={game.image ? { backgroundImage: `url("${game.image}")` } : null}
      />
      <span className="game-name">{game.name}</span>
      {game.rating ? <span className="rating-chip">★ {game.rating.toFixed(1)}</span> : null}
    </li>
  );
}
