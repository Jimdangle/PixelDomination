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
    refreshTimers: function () {
  
    },
  };

  app.enumerate = (a) => {
    // This adds an _idx field to each element of the array.
    let k = 0;
    a.map((e) => {
      e._idx = k++;
    });
    return a;
  };

  app.updateTimers = function () {
    var now = new Date(Date.now())
    app.data.games.forEach(element => {
      // Print out the time left
      var diff = element.end_time - now;
      // Get values for each amount
      var days = Math.floor(diff % (1000 * 60 * 60 * 24 * 7) / (1000 * 60 * 60 * 24));
      var hh = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var mm = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      var ss = Math.floor((diff % (1000 * 60)) / 1000);
      // Add padding 0s if necesary
      if (ss < 10) ss = "0" + ss;
      if (mm < 10) mm = "0" + mm;
      if (hh < 10) hh = "0" + hh;
      if (days > 0) element.ttl = days + " Days " + hh + ":" + mm + ":" + ss;
      else element.ttl = hh + ":" + mm + ":" + ss;
    });
  }

  app.get_games = function () {
    // Get the games from py4web
    axios({
      method: "get",
      url: get_games_url,
      //params: {query: app.vue.search_query},
    }).then((r) => {
      app.data.games = app.enumerate(r.data.results);
      app.data.games.forEach(element => {
        console.log(element.end_time);
        element.end_time = new Date(element.end_time + "Z").getTime();
      });
      app.updateTimers();
      setInterval(() => {
        app.updateTimers();
      }, 1000);
    }).catch((e) => { console.log(e) });
  }

  app.search_games = function () {
    axios({
      method: "get",
      url: get_games_url,
      params: {query: app.vue.search_query},
    }).then((r) => {
      app.data.games = app.enumerate(r.data.results);
      app.data.games.forEach(element => {
        element.end_time = new Date(element.end_time + "Z").getTime();
      });
      app.updateTimers();
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

    redir = current.origin + "/play/"+id
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
