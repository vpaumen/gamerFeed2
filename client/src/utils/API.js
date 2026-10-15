import axios from "axios";

// All game data goes through the Express server (routes/api/games.js),
// which holds the API key and talks to RAWG.
export default {
  // Get all search results
  getSearch: function(title) {
    return axios.get("/api/games/search", { params: { q: title } });
  },
  // Gets a list of popular games
  getGames: function() {
    return axios.get("/api/games/popular");
  },
  // Gets one game's details (description, rating)
  getGame: function(id) {
    return axios.get("/api/games/" + id);
  },
  // Gets a trailer for a game
  getTrailer: function(id) {
    return axios.get("/api/games/" + id + "/trailer");
  },

};
