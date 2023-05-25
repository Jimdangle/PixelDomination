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
        canv: document.getElementById('myCanvas'),
        ctx:  document.getElementById('myCanvas').getContext('2d'),
        draw_points: []

    };

    app.enumerate = (a) => {
        // This adds an _idx field to each element of the array.
        let k = 0;
        a.map((e) => {e._idx = k++;});
        return a;
    };


    app.get_pixels = function() {
        axios({
            method: "get",
            url: get_pixels_url
        })
        .then( (r) => {
            console.log(r.data);
        })
        .catch( (e) => {
            console.debug(e);
        })
    }
    

    
    app.add_pixel = function() {
        axios({
            method: "post",
            url: add_pixel_url,
            params: {
                pos_x: 1,
                pos_y: 1,
                color: 'green'
            }
        })
        .then( (r) => {
            console.log(r.data)
        })
        .catch( (e) => {
            console.debug(e)
        })
    }

    // This contains all the methods.
    app.methods = {
        // Complete as you see fit.
        add_pixel: app.add_pixel(),
        get_pixels: app.get_pixels()


    };

    // This creates the Vue instance.
    app.vue = new Vue({
        el: "#vue-target",
        data: app.data,
        methods: app.methods
    });

    // And this initializes it.
    app.init = () => {
        app.get_pixels()
        // Put here any initialization code.
        // Typically this is a server GET call to load the data.
    };

    // Call to the initializer.
    app.init();
};

// This takes the (empty) app object, and initializes it,
// putting all the code i
init(app);
