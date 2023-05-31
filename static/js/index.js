// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = (app) => {
  // This is the Vue data.
  // last_draw : utc time of last draw (int)
  // pos_x     : int for x coord to draw on
  // pos_y     : int for y coord to draw on
  // color     : color to draw pixel
  app.data = {
    // Complete as you see fit.
    last_draw: 0,
    canvas: null,
    ctx: null,
    isDrawing: false,
    gridSize: 20,
    gridWidth: 20,
    gridHeight: 20,
    selectedColor: "black",
    colorSelectorShown: false,
  };

  app.enumerate = (a) => {
    // This adds an _idx field to each element of the array.
    let k = 0;
    a.map((e) => {
      e._idx = k++;
    });
    return a;
  };

  app.drawGrid = () => {
    for (let i = 0; i < app.data.canvas.width / app.data.gridSize; i++) {
      for (let j = 0; j < app.data.canvas.height / app.data.gridSize; j++) {
        app.data.ctx.strokeStyle = "rgba(0,0,0,0.1)";
        app.data.ctx.strokeRect(
          i * app.data.gridSize,
          j * app.data.gridSize,
          app.data.gridSize,
          app.data.gridSize
        );
      }
    }
  };

  app.startDrawing = (e) => {
    app.data.isDrawing = true;
    app.draw(e);
  };

  app.stopDrawing = () => {
    app.data.isDrawing = false;
    app.data.ctx.beginPath();
  };



  /**
   * app.data.ctx.fillStyle = app.data.selectedColor;

  app.draw = (e) => {
    if (!app.data.isDrawing) return;
    let rect = app.data.canvas.getBoundingClientRect();
    let x = Math.floor((e.clientX - rect.left) / app.data.gridSize);
    let y = Math.floor((e.clientY - rect.top) / app.data.gridSize);
    app.data.ctx.fillStyle = app.data.selectedColor;


    app.data.ctx.fillRect(
      x * app.data.gridSize,
      y * app.data.gridSize,
      app.data.gridSize,
      app.data.gridSize
    );
   */


  app.draw = (e) => {

    if (!app.data.isDrawing) return;
    let rect = app.data.canvas.getBoundingClientRect();
    let x = Math.floor((e.clientX - rect.left) / app.data.gridSize);
    let y = Math.floor((e.clientY - rect.top) / app.data.gridSize);
    let color = app.data.selectedColor;
    axios({
      method: "post",
      url: draw_url,
      params: 
        {
          x:x,
          y:y,
          color:color
        }
      })
    .then(function (r) {
            console.debug(r.data) 

            for (let p in r.data.pixels){
              console.log (r.data.pixels[p]["pos_x"]);

              x = parseInt(r.data.pixels[p]["pos_x"]);
              y = parseInt(r.data.pixels[p]["pos_y"]);
              console.log("x: " + x + " y: " + y);
              color = r.data.pixels[p]["color"];

              app.data.ctx.fillStyle = color;
              app.data.ctx.fillRect(
                y * app.data.gridSize,
                x * app.data.gridSize,
                app.data.gridSize,
                app.data.gridSize
              );
                
            }


        
            


    })
    .catch( (e) => {console.log(e)})



  };

 

  app.selectColor = (color) => {
    app.data.selectedColor = color;
  };

  app.toggleColorSelector = () => {
    app.data.colorSelectorShown = !app.data.colorSelectorShown;
  };

  app.get_pixels = function() {
    console.log("Getting pixels")
    axios({
        method: "get",
        url: get_pixels_url
    })
    .then( (r) => {
        console.log(r.data)
        console.log(r.data.pixels)
    })
    .catch( (e) => {console.log(e)})
  }

  // This contains all the methods.
  app.methods = {
    // Complete as you see fit.
    drawGrid: app.drawGrid,
    selectColor: app.selectColor,
    draw: app.draw,
    startDrawing: app.startDrawing,
    stopDrawing: app.stopDrawing,
    get_pixels: app.get_pixels,
    toggleColorSelector: app.toggleColorSelector,
  };

  // This creates the Vue instance.
  app.vue = new Vue({
    el: "#vue-target",
    data: app.data,
    methods: app.methods,
    mounted() {
      app.data.canvas = this.$refs.canvas;
      app.data.ctx = app.data.canvas.getContext("2d");
      app.drawGrid();

      app.data.canvas.addEventListener("mousedown", app.startDrawing);
      app.data.canvas.addEventListener("mouseup", app.stopDrawing);
      app.data.canvas.addEventListener("mousemove", app.draw);
    },
  });

  // And this initializes it.
  app.init = () => {
    // Put here any initialization code.
    app.data.canvas = document.getElementById("canvas");
    app.data.ctx = app.data.canvas.getContext("2d");
    
    // Set the canvas size
    app.data.canvas.width = app.data.gridSize * app.data.gridWidth;
    app.data.canvas.height = app.data.gridSize * app.data.gridHeight;

    //grab all the pixels already drawn from the database
    axios({
      method: "post",
      url: draw_url,
      params: 
        {
          x:0,
          y:0,
          color:"init"
        }
      })
    .then(function (r) {
            console.debug(r.data) 

            for (let p in r.data.pixels){
              console.log (r.data.pixels[p]["pos_x"]);

              x = parseInt(r.data.pixels[p]["pos_x"]);
              y = parseInt(r.data.pixels[p]["pos_y"]);
              console.log("x: " + x + " y: " + y);
              color = r.data.pixels[p]["color"];

              app.data.ctx.fillStyle = color;
              app.data.ctx.fillRect(
                y * app.data.gridSize,
                x * app.data.gridSize,
                app.data.gridSize,
                app.data.gridSize
              );
                
            }
    })
    .catch( (e) => {console.log(e)})

  };

  // Call to the initializer.
  app.init();
};

// This takes the (empty) app object, and initializes it,
// putting all the code in
init(app);
