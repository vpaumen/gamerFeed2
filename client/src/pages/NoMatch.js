import React from "react";
import { Link } from "react-router-dom";

function NoMatch() {
  return (
    <div className="page">
      <div className="panel not-found">
        <h1>404 Page Not Found</h1>
        <h1>
          <span role="img" aria-label="Face With Rolling Eyes Emoji">
            🙄
          </span>
        </h1>
        <Link to="/games">← Back to games</Link>
      </div>
    </div>
  );
}

export default NoMatch;
