const router = require("express").Router();
const axios = require("axios");

// Server-side proxy for the RAWG game database (https://rawg.io/apidocs).
// The client only sees the simplified shapes returned below, so switching
// providers means changing this file only.
const BASE_URL = process.env.GAME_API_BASE_URL || "https://api.rawg.io/api";
const API_KEY = process.env.GAME_API_KEY;
const PAGE_SIZE = 20;

// Trailers come from YouTube (Data API v3) when a key is set, falling back to RAWG's own movies.
// Each YouTube search costs 100 of the default 10,000 daily quota units, so results are cached.
const YOUTUBE_BASE_URL = process.env.YOUTUBE_API_BASE_URL || "https://www.googleapis.com/youtube/v3";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const TRAILER_CACHE_MS = 24 * 60 * 60 * 1000;
const TRAILER_CACHE_MAX = 500;
const trailerCache = new Map();

function rawg(path, params) {
  return axios.get(BASE_URL + path, {
    params: Object.assign({ key: API_KEY }, params),
    headers: { "User-Agent": "GamerFeed2" }
  });
}

// List item shape shared by the popular and search endpoints
function toListItem(game) {
  return {
    id: game.id,
    name: game.name,
    rating: game.rating,
    image: game.background_image
  };
}

function sendError(res) {
  return function(err) {
    const status = err.response ? err.response.status : 502;
    res.status(status).json({ error: "Game API request failed", status: status });
  };
}

// Matches with "/api/games/popular"
router.get("/popular", function(req, res) {
  rawg("/games", { ordering: "-added", page_size: PAGE_SIZE })
    .then(apiRes => res.json({ results: apiRes.data.results.map(toListItem) }))
    .catch(sendError(res));
});

// Matches with "/api/games/search?q=title"
router.get("/search", function(req, res) {
  rawg("/games", { search: req.query.q, page_size: PAGE_SIZE })
    .then(apiRes => res.json({ results: apiRes.data.results.map(toListItem) }))
    .catch(sendError(res));
});

// Matches with "/api/games/:id"
router.get("/:id", function(req, res) {
  rawg("/games/" + encodeURIComponent(req.params.id))
    .then(apiRes => {
      const game = apiRes.data;
      res.json({
        results: {
          id: game.id,
          name: game.name,
          description: game.description,
          rating: game.rating,
          metacritic: game.metacritic,
          image: game.background_image
        }
      });
    })
    .catch(sendError(res));
});

// Resolves to { source: "youtube", name, youtubeId } or null
function youtubeTrailer(gameId) {
  if (!YOUTUBE_API_KEY) return Promise.resolve(null);
  return rawg("/games/" + encodeURIComponent(gameId))
    .then(apiRes => axios.get(YOUTUBE_BASE_URL + "/search", {
      params: {
        key: YOUTUBE_API_KEY,
        part: "snippet",
        q: apiRes.data.name + " official trailer",
        type: "video",
        videoEmbeddable: "true",
        maxResults: 1
      }
    }))
    .then(ytRes => {
      const video = ytRes.data.items[0];
      return video ? { source: "youtube", name: video.snippet.title, youtubeId: video.id.videoId } : null;
    })
    .catch(err => {
      // Quota exhausted or bad key: log it and let RAWG's trailer take over
      console.error("YouTube trailer lookup failed:", err.response ? err.response.status : err.message);
      return null;
    });
}

// Resolves to { source: "rawg", name, preview, url } or null
function rawgTrailer(gameId) {
  return rawg("/games/" + encodeURIComponent(gameId) + "/movies")
    .then(apiRes => {
      const movie = apiRes.data.results[0];
      return movie
        ? { source: "rawg", name: movie.name, preview: movie.preview, url: movie.data.max || movie.data["480"] }
        : null;
    });
}

// Matches with "/api/games/:id/trailer"; results is null when no trailer was found
router.get("/:id/trailer", function(req, res) {
  const id = req.params.id;
  const cached = trailerCache.get(id);
  if (cached && Date.now() - cached.at < TRAILER_CACHE_MS) {
    return res.json({ results: cached.trailer });
  }

  youtubeTrailer(id)
    .then(trailer => trailer || rawgTrailer(id))
    .then(trailer => {
      if (trailerCache.size >= TRAILER_CACHE_MAX) {
        trailerCache.delete(trailerCache.keys().next().value);
      }
      trailerCache.set(id, { trailer: trailer, at: Date.now() });
      res.json({ results: trailer });
    })
    .catch(sendError(res));
});

module.exports = router;
