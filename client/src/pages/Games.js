import React, { Component } from "react";
import DeleteBtn from "../components/DeleteBtn";
import Jumbotron from "../components/Jumbotron";
import API from "../utils/API";
import { Link } from "react-router-dom";
import { Col, Row, Container } from "../components/Grid";
import { List, ListItem } from "../components/List";
import { Input, TextArea, FormBtn } from "../components/Form";
import { get } from "http";
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';


let gameDescription = "";
class Games extends Component {
  
  state = {
    search: [],
    games: [],
    reviews: [],
    gameReview: "",
    isComingFromSearch: false,
    gameVideo: "",
    isComingFromVideo: false,
    description: "",
    
  };

  componentDidMount() {
    this.loadGames();
  }
// Calls on API to get the list of Games
  loadGames = () => {
    API.getGames()
      .then(res => {
        // console.log('res.data.results >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',res.data.results[0].guid);
        this.setState({ 
          games: res.data.results,
          isComingFromVideo: false,
          isComingFromSearch: false,
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
        .then(res => this.setState({ games: res.data.results, isComingFromSearch: true }))
        .catch(err => console.log(err));
    }
  };


  // Calls on API to get the description of one game from the search results
  setDescription = id => {
    if (id) {
      API.getGame(id)
        .then(res => {
          this.setState({ description: res.data.results.description });
          gameDescription = res.data.results.description;
        })
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
    this.setState({ games: res.data.results, isComingFromVideo: true, isComingFromSearch: false, gameVideo: "" })
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


  render() {
    let html=""; 
    
    let html_video= "";

    
    if(this.state.games.length && !this.state.isComingFromSearch && !this.state.isComingFromVideo)  { 
      html=<div className="results">
      <List>
        {this.state.games.map(game => (
              <strong>
                <li key={game.id} data-id={game.id} onClick={() => this.getGameRatings(game.id)}>{game.name} </li>
              </strong>
        ))}
      </List></div>;
    } else if(this.state.isComingFromSearch) {
      html=<div className="results">
      <List>
        {this.state.games.map(game => (
              <strong>
                <li key={game.id} data-id={game.id} onClick={() => this.setDescription(game.id)}>{game.name} </li>
              </strong>
        ))}
      </List></div>;
    } else if(this.state.isComingFromVideo) {
      html=<div className="results">
      <List>
        {this.state.games.map(game => (
              <strong>
                <li key={game.id} data-id={game.id} onClick={() => this.getGameVideo(game.id)}>{game.name} </li>
              </strong>
        ))}
      </List></div>;
      
      if (this.state.gameVideo === "none") {
        html_video = <h2>No trailer available for this game.</h2>;
      } else if (this.state.gameVideo.source === "youtube") {
        html_video=
        <iframe key={this.state.gameVideo.youtubeId} width="560" height="315" src={`https://www.youtube.com/embed/${this.state.gameVideo.youtubeId}`} title={this.state.gameVideo.name} frameBorder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
      } else if (this.state.gameVideo) {
        html_video=
        <video key={this.state.gameVideo.url} width="560" src={this.state.gameVideo.url} controls autoPlay></video>
       }

    }
// Returns Search, Videos and Description of Game
    return (
      <Container fluid>
        <div className="d-flex justify-content-center">
          <div className="col-md-6">
            <Jumbotron>
              <h1>What Games Should I Search? Type it below.</h1>
            </Jumbotron>
            <form>
              <Input
                value={this.state.title}
                onChange={this.handleInputChange}
                name="title"
                placeholder="Game Title (required)"
              />
              
              <FormBtn
                onClick={this.handleFormSubmit}
              >
                Search
              </FormBtn>

            </form>
            <div className="description">
            <h2>Description: { ReactHtmlParser(this.state.description) }</h2>
            {html_video}
            </div>
          </div>
          <div className="col-md-6 col-sm-12">
            <Jumbotron>
              <h1>Game Rating 1-5</h1>
              
              <h2>Rating: {this.state.gameReview}</h2>
            
            </Jumbotron>
            
            <FormBtn
                onClick={this.getGameVideos}
              >
                Videos
              </FormBtn>

            <FormBtn
                onClick={this.loadGames}
              >
                Ratings
              </FormBtn>

{html}
            <p className="attribution">Game data from <a href="https://rawg.io" target="_blank" rel="noopener noreferrer">RAWG</a></p>
          </div>
        </div>
      </Container>
    );
  }
}

export default Games;
