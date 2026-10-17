import React, { Component } from "react";
import Jumbotron from "../components/Jumbotron";
import API from "../utils/API";
import { List, GameRow } from "../components/List";
import { Input, FormBtn } from "../components/Form";
import ReactHtmlParser from 'react-html-parser';


class Games extends Component {

  state = {
    games: [],
    gameReview: "",
    isComingFromSearch: false,
    gameVideo: "",
    isComingFromVideo: false,
    description: "",
    selectedId: null,
    selectedName: "",
  };

  componentDidMount() {
    this.loadGames();
  }
// Calls on API to get the list of Games
  loadGames = () => {
    API.getGames()
      .then(res => {
        this.setState({
          games: res.data.results,
          isComingFromVideo: false,
          isComingFromSearch: false,
          selectedId: null,
         })
      }
    )
    .catch(err => console.log(err));

    };

  handleInputChange = event => {
    const { name, value } = event.target;
    this.setState({
      [name]: value
    });
  };

// Calls on API to search any game on the database
  handleFormSubmit = event => {
    event.preventDefault();
    if (this.state.title) {
      API.getSearch(this.state.title)
        .then(res => this.setState({ games: res.data.results, isComingFromSearch: true, isComingFromVideo: false, selectedId: null }))
        .catch(err => console.log(err));
    }
  };

  selectGame = game => {
    this.setState({ selectedId: game.id, selectedName: game.name });
  };

  // Calls on API to get the description of one game from the search results
  setDescription = id => {
    if (id) {
      API.getGame(id)
        .then(res => this.setState({ description: res.data.results.description }))
        .catch(err => console.log(err));
    }
  };

// Calls on API to get a game's Rating from 1-5
getGameRatings = id => {
  if (id) {
    API.getGame(id)
      .then(res => this.setState({ gameReview: res.data.results.rating || "Not rated" }))
      .catch(err => console.log(err));
  }
};

// Calls on API to get a list of games to pick a trailer from
getGameVideos = () => {
  API.getGames()
  .then(res => {
    this.setState({ games: res.data.results, isComingFromVideo: true, isComingFromSearch: false, gameVideo: "", selectedId: null })
  }
)
.catch(err => console.log(err));

};

// Calls on API to pull the trailer for one game ("none" when RAWG has no trailer)
getGameVideo = (id) => {
  if (id) {
  API.getTrailer(id)
  .then(res => {
    this.setState({ gameVideo: res.data.results || "none", isComingFromVideo: true })
  }
)
.catch(err => console.log(err));
  }
};

  // What clicking a game does depends on how the list was loaded
  handleGameClick = game => {
    this.selectGame(game);
    if (this.state.isComingFromVideo) {
      this.getGameVideo(game.id);
    } else if (this.state.isComingFromSearch) {
      this.setDescription(game.id);
    } else {
      this.getGameRatings(game.id);
    }
  };

  renderVideo() {
    const video = this.state.gameVideo;
    if (!video) return null;
    if (video === "none") {
      return <p className="hint">No trailer available for this game.</p>;
    }
    return (
      <div className="video-frame">
        {video.source === "youtube" ? (
          <iframe key={video.youtubeId} src={`https://www.youtube.com/embed/${video.youtubeId}`} title={video.name} frameBorder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
        ) : (
          <video key={video.url} src={video.url} controls autoPlay></video>
        )}
      </div>
    );
  }

  render() {
    const { games, isComingFromSearch, isComingFromVideo, selectedId, selectedName } = this.state;

    let listTitle = "Popular games";
    if (isComingFromSearch) listTitle = "Search results";
    else if (isComingFromVideo) listTitle = "Pick a game to watch its trailer";

// Returns Search, Videos and Description of Game
    return (
      <div className="page">
        <div className="games-layout">
          <section className="panel">
            <Jumbotron>
              <h1>What games should I search?</h1>
            </Jumbotron>
            <form className="search-form" onSubmit={this.handleFormSubmit}>
              <Input
                value={this.state.title || ""}
                onChange={this.handleInputChange}
                name="title"
                placeholder="Game title"
              />
              <FormBtn type="submit">Search</FormBtn>
            </form>

            {isComingFromVideo ? (
              <div className="description">
                <h2 className="panel-title" style={{ marginTop: "1.5rem" }}>
                  {selectedId ? selectedName : "Trailer"}
                </h2>
                {this.renderVideo() || <p className="hint">Pick a game from the list to watch its trailer.</p>}
              </div>
            ) : (
              <div className="description">
                <h2 className="panel-title" style={{ marginTop: "1.5rem" }}>
                  {selectedId && isComingFromSearch ? selectedName : "Description"}
                </h2>
                {this.state.description
                  ? ReactHtmlParser(this.state.description)
                  : <p className="hint">Search for a game, then pick a result to read about it.</p>}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="mode-toggle" role="tablist">
              <button
                type="button"
                className={!isComingFromVideo ? "active" : ""}
                onClick={this.loadGames}
              >
                Ratings
              </button>
              <button
                type="button"
                className={isComingFromVideo ? "active" : ""}
                onClick={this.getGameVideos}
              >
                Videos
              </button>
            </div>

            {!isComingFromVideo && !isComingFromSearch && (
              <div className="rating-display">
                <span className="rating-value">{this.state.gameReview || "–"}</span>
                <span className="rating-scale">
                  {this.state.gameReview && selectedName ? `/ 5 · ${selectedName}` : "/ 5 · pick a game"}
                </span>
              </div>
            )}

            <h2 className="panel-title">{listTitle}</h2>
            {games.length ? (
              <div className="results">
                <List>
                  {games.map(game => (
                    <GameRow
                      key={game.id}
                      game={game}
                      selected={game.id === selectedId}
                      onClick={() => this.handleGameClick(game)}
                    />
                  ))}
                </List>
              </div>
            ) : null}
            <p className="attribution">Game data from <a href="https://rawg.io" target="_blank" rel="noopener noreferrer">RAWG</a></p>
          </section>
        </div>
      </div>
    );
  }
}

export default Games;
