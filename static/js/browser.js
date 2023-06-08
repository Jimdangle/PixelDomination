// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = (app) => {
  // This is the Vue data.
  app.data = {
    // Complete as you see fit.
    games: [],
    search_query: "",
  };

  app.enumerate = (a) => {
    // This adds an _idx field to each element of the array.
    let k = 0;
    a.map((e) => {
      e._idx = k++;
    });
    return a;
  };

  app.get_games = function () {
    // Get the games from py4web
    axios({
      method: "get",
      url: get_games_url,
      //params: {query: app.vue.search_query},
    }).then((r) => {
      app.data.games = r.data.results;
      console.log(app.data.games);
    }).catch((e) => { console.log(e) });
  }

  app.search_games = function () {
    axios({
      method: "get",
      url: get_games_url,
      params: {query: app.vue.search_query},
    }).then((r) => {
      app.data.games = r.data.results;
    }).catch((e) => { console.log(e) });
  }

  app.clear_search = function() {
    // Clear the search query
    app.vue.search_query = "";
    // get the games list again
    app.get_games();
  }

  app.play = function(id) {
    current = window.location
    console.log(current)
    console.log(id)

    redir = current.origin + "/PixelDomination/play/"+id
    window.location = redir
  }

  // This contains all the methods.
  app.methods = {
    // Complete as you see fit.
    get_games: app.get_games,
    search_games: app.search_games,
    clear_search: app.clear_search,
    play: app.play
  };

  // This creates the Vue instance.
  app.vue = new Vue({
    el: "#vue-target",
    data: app.data,
    methods: app.methods,
    /*
    mounted() {
      app.data.canvas = this.$refs.canvas;
      app.data.ctx = app.data.canvas.getContext("2d");
      app.drawGrid();

      app.data.canvas.addEventListener("mousedown", app.startDrawing);
      app.data.canvas.addEventListener("mouseup", app.stopDrawing);
      app.data.canvas.addEventListener("mousemove", app.draw);
    },
    */
  });

  // And this initializes it.
  app.init = () => {
    app.get_games();
  };

  // Call to the initializer.
  app.init();

};

// This takes the (empty) app object, and initializes it,
// putting all the code in
init(app);
