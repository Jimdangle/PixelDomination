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
        pos_x: 0,
        pos_y: 0,
        color: 'black',
        canv: this.$refs.canvas,
        ctx:  canv.getContext('2d')

    };

    app.enumerate = (a) => {
        // This adds an _idx field to each element of the array.
        let k = 0;
        a.map((e) => {e._idx = k++;});
        return a;
    };


    app.draw_grid = (gridSize) => {
        for (let i = 0; i < app.canvas.width / gridSize; i++) {
          for (let j = 0; j < app.canvas.height / gridSize; j++) {
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.strokeRect(i * gridSize, j * gridSize, gridSize, gridSize);
          }
        }
      }
    

    // 

    app.draw = (e) => {
        time_diff = Math.floor((Date.now() - app.last_draw) / 1000)
        if (time_diff > 300){ // its been 5 min? 
            let rect = app.canv.getBoundingClientRect();
            let x = Math.floor(( e.clientX - rect.left))
        }
    }

    app.load_pixels() = () => {


    }

    // This contains all the methods.
    app.methods = {
        // Complete as you see fit.
        draw_grid: app.draw_grid(),


    };

    // This creates the Vue instance.
    app.vue = new Vue({
        el: "#vue-target",
        data: app.data,
        methods: app.methods
    });

    // And this initializes it.
    app.init = () => {

        // Put here any initialization code.
        // Typically this is a server GET call to load the data.
    };

    // Call to the initializer.
    app.init();
};

// This takes the (empty) app object, and initializes it,
// putting all the code i
init(app);
