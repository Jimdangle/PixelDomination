let app = {};

let init = (app) => {
  app.data = {
    last_draw: 0,
    canvas: null,
    context: null,
    drag: false,
    cellSize: 20,
    totalRows: 100,
    totalCols: 100,
    initialRows: 40,
    initialCols: 40,
    cells: Array(100).fill(Array(100).fill("white")),
    cameraOffset: { x: 0, y: 0 },
    cameraZoom: 1,
    MAX_ZOOM: 5,
    MIN_ZOOM: 0.99,
    SCROLL_SENSITIVITY: 0.001,
    color: "#000",
    animationFrameId: null,
    lastDragPoint: { x: 0, y: 0 },
    isDragging: false,
  };

  app.mousedown = function (event) {
    app.data.isDragging = true;
    app.data.lastDragPoint.x = event.clientX;
    app.data.lastDragPoint.y = event.clientY;
  };

  app.mouseup = function (event) {
    app.data.isDragging = false;
  };

  app.mouseout = function (event) {
    app.data.isDragging = false;
  };

  app.mousemove = function (event) {
    if (!app.data.isDragging) return;

    let dx = event.clientX - app.data.lastDragPoint.x;
    let dy = event.clientY - app.data.lastDragPoint.y;

    // Compute the new camera offset
    let newCameraOffsetX = app.data.cameraOffset.x + dx / app.data.cameraZoom;
    let newCameraOffsetY = app.data.cameraOffset.y + dy / app.data.cameraZoom;

    // Get the maximum allowed offsets based on the grid size and zoom level
    let maxOffsetX =
      (app.data.totalCols * app.data.cellSize - app.data.canvas.width) /
      (2 * app.data.cameraZoom);
    let maxOffsetY =
      (app.data.totalRows * app.data.cellSize - app.data.canvas.height) /
      (2 * app.data.cameraZoom);

    // Limit the offsets
    app.data.cameraOffset.x = Math.max(
      -maxOffsetX,
      Math.min(maxOffsetX, newCameraOffsetX)
    );
    app.data.cameraOffset.y = Math.max(
      -maxOffsetY,
      Math.min(maxOffsetY, newCameraOffsetY)
    );

    // Store the position for next time
    app.data.lastDragPoint.x = event.clientX;
    app.data.lastDragPoint.y = event.clientY;

    app.drawGrid();
  };

  app.drawGrid = function () {
    // console.log("Drawing grid")
    if (app.data.animationFrameId !== null) {
      cancelAnimationFrame(app.data.animationFrameId);
    }

    app.data.animationFrameId = requestAnimationFrame(() => {
      let ctx = app.data.context;
      ctx.clearRect(0, 0, app.data.canvas.width, app.data.canvas.height);
      ctx.save();

      // Update translation to account for camera offset and zoom
      ctx.translate(app.data.canvas.width / 2, app.data.canvas.height / 2);
      ctx.scale(app.data.cameraZoom, app.data.cameraZoom);
      ctx.translate(
        (-app.data.totalCols * app.data.cellSize) / 2 + app.data.cameraOffset.x,
        (-app.data.totalRows * app.data.cellSize) / 2 + app.data.cameraOffset.y
      );

      // The actual grid drawing
      let cellSize = app.data.cellSize;
      let totalRows = app.data.totalRows;
      let totalCols = app.data.totalCols;

      for (let i = 0; i < totalRows; i++) {
        for (let j = 0; j < totalCols; j++) {
          let x = j * cellSize;
          let y = i * cellSize;

          // If cell is set to 1, fill it
          if (app.data.cells[i][j] == null) {
            app.data.cells[i][j] = "#ffffff";
          } else {
            ctx.fillStyle = app.data.cells[i][j];
          }
          ctx.fillStyle = app.data.cells[i][j];
          ctx.fillRect(x, y, cellSize, cellSize);

          // Draw grid
          ctx.strokeStyle = "#ddd";
          ctx.strokeRect(x, y, cellSize, cellSize);
        }
      }

      ctx.restore();
    });
  };

  app.wheel = function (event) {
    event.preventDefault();

    const canvasBounds = app.data.canvas.getBoundingClientRect();
    const mouseX = event.clientX - canvasBounds.left;
    const mouseY = event.clientY - canvasBounds.top;

    const oldZoom = app.data.cameraZoom;

    if (event.deltaY < 0) {
      app.data.cameraZoom *= 1.1;
    } else {
      app.data.cameraZoom /= 1.1;
    }

    app.data.cameraZoom = Math.min(app.data.cameraZoom, app.data.MAX_ZOOM);
    app.data.cameraZoom = Math.max(app.data.cameraZoom, app.data.MIN_ZOOM);

    const newZoom = app.data.cameraZoom;

    // Adjust cameraOffset based on the new zoom level and the cursor position
    const scaleFactor = newZoom / oldZoom;
    const offsetX = mouseX - (mouseX - app.data.cameraOffset.x) * scaleFactor;
    const offsetY = mouseY - (mouseY - app.data.cameraOffset.y) * scaleFactor;

    app.data.cameraOffset.x = offsetX;
    app.data.cameraOffset.y = offsetY;

    // Calculate the maximum allowed camera offset based on the zoom level and canvas size
    const maxOffsetX =
      (app.data.totalCols * app.data.cellSize - app.data.canvas.width) /
      (2 * newZoom);
    const maxOffsetY =
      (app.data.totalRows * app.data.cellSize - app.data.canvas.height) /
      (2 * newZoom);

    // Clamp the camera offset within the maximum allowed range
    app.data.cameraOffset.x = Math.max(
      -maxOffsetX,
      Math.min(maxOffsetX, app.data.cameraOffset.x)
    );
    app.data.cameraOffset.y = Math.max(
      -maxOffsetY,
      Math.min(maxOffsetY, app.data.cameraOffset.y)
    );

    app.drawGrid();
  };

  app.dblclick = function (event) {
    const canvasBounds = app.data.canvas.getBoundingClientRect();
    const mouseX = event.clientX - canvasBounds.left;
    const mouseY = event.clientY - canvasBounds.top;

    // Convert mouse coordinates to world coordinates, taking into account the camera offset and zoom
    const worldX =
      (mouseX - app.data.canvas.width / 2) / app.data.cameraZoom -
      app.data.cameraOffset.x;
    const worldY =
      (mouseY - app.data.canvas.height / 2) / app.data.cameraZoom -
      app.data.cameraOffset.y;

    // Convert world coordinates to grid coordinates, rounding to the nearest integer
    const gridX = Math.floor(
      worldX / app.data.cellSize + app.data.totalCols / 2
    );
    const gridY = Math.floor(
      worldY / app.data.cellSize + app.data.totalRows / 2
    );

    // Check if the cell is within the grid bounds
    if (
      gridX >= 0 &&
      gridX < app.data.totalCols &&
      gridY >= 0 &&
      gridY < app.data.totalRows
    ) {
      // Call API to draw
      console.log("x: " + gridX + " y: " + gridY + " color: #000000");
      axios({
        method: "post",
        url: draw_url,
        params: {
          x: gridX,
          y: gridY,
          color: "#000000",
        },
      })
        .then((r) => {
          // On successful response, update cell color and redraw grid
          app.data.cells[gridY][gridX] = "#000000";
          app.drawGrid();
        })
        .catch((e) => {
          // On error, log it
          console.log(e);
        });
    }
  };

  app.get_pixels = function () {
    axios({
      method: "get",
      url: get_pixels_url,
    })
      .then((r) => {
        console.log("Got pixels");
        // set app.data.cells to r.data.cells
        // console.log(r.data.pixels)
        app.data.cells = r.data.pixels;
        app.drawGrid();
      })
      .catch((e) => {
        console.log("Failed to get pixels");
        console.log(e);
      });
  };

  app.methods = {
    drawGrid: app.drawGrid,
    mousedown: app.mousedown,
    mouseup: app.mouseup,
    mousemove: app.mousemove,
    wheel: app.wheel,
    dblclick: app.dblclick,
    // initCells: app.initCells,
    get_pixels: app.get_pixels,
  };

  app.init = function () {
    const canvasContainer = document.querySelector('.canvas_container');
    app.data.canvas = document.getElementById("canvas");
    app.data.context = app.data.canvas.getContext("2d");
    // app.data.canvas.width = window.innerWidth;
    // app.data.canvas.height = window.innerHeight;
    app.data.canvas.width = canvasContainer.offsetWidth;
    app.data.canvas.height = canvasContainer.offsetHeight;
    app.data.scale = Math.min(
      app.data.canvas.width / (app.data.cellSize * app.data.initialCols),
      app.data.canvas.height / (app.data.cellSize * app.data.initialRows)
    );

    // Initialize cells
    for (let i = 0; i < app.data.totalCols; i++) {
      app.data.cells[i] = [];
      for (let j = 0; j < app.data.totalRows; j++) {
        app.data.cells[i][j] = "#fff";

        // GENERATE RANDOM COLORS
        //   app.data.cells[i][j] =
        //     "#" + Math.floor(Math.random() * 16777215).toString(16);
      }
    }

    app.get_pixels();
    setInterval(app.get_pixels, 10000); // Get Pixels every 10 seconds

    // Add the event listeners
    app.data.canvas.addEventListener("mousedown", app.mousedown.bind(this));
    app.data.canvas.addEventListener("mouseup", app.mouseup.bind(this));
    app.data.canvas.addEventListener("mousemove", app.mousemove.bind(this));
    app.data.canvas.addEventListener("wheel", app.wheel.bind(this), {
      passive: false,
    });
    app.data.canvas.addEventListener("dblclick", app.dblclick.bind(this));
    app.data.canvas.addEventListener("mouseout", app.mouseout.bind(this));
  };

  app.init();
};

init(app);
