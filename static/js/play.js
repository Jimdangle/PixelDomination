let app = {};


var getUrlParameter = function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1),
      sURLVariables = sPageURL.split('&'),
      sParameterName,
      i;

  for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');

      if (sParameterName[0] === sParam) {
          return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
      }
  }
  return false;
};

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
    MIN_ZOOM: 0.8,
    SCROLL_SENSITIVITY: 0.001,
    colors: ["black", "red", "green", "blue", "yellow"],
    selectedColor: "black",
    animationFrameId: null,
    lastDragPoint: { x: 0, y: 0 },
    isDragging: false,
    colorSelectorShown: false,
    leaderBoardExpanded: false,
    game_id: getUrlParameter('game_id'),
    chatOpen: false,
    chatMessages: [],
    chatMessage: "",
    updateInterval: 5000,
  };

  app.toggleLeaderBoard = () => {
    app.data.leaderBoardExpanded = !app.data.leaderBoardExpanded;
  };

  app.toggleColorSelector = () => {
    app.data.colorSelectorShown = !app.data.colorSelectorShown;
  };

  app.get_chat_messages = () => {
    axios
      .get(get_chat_messages_url, { params: { game_id: app.data.game_id } })
      .then((response) => {
        app.data.chatMessages = response.data.chat;
        app.data.chatMessages.forEach((msg) => {
          // convert unix timestamp to time
          msg.time = Sugar.Date(msg.time + "Z").format("{hh}:{mm}");
        });
      })
      .catch((error) => {
        console.error(error);
      });
  };

  app.send_chat_message = () => {
    if (app.data.chatMessage.length == 0) return;
    axios
      .post(send_chat_message_url, {
        game_id: app.data.game_id,
        message: app.data.chatMessage,
      })
      .then((response) => {
        app.data.chatMessage = "";
        app.get_chat_messages();
      })
      .catch((error) => {
        console.error(error);
      });
  };

  app.selectColor = function (color) {
    app.data.selectedColor = color;
    let currentColorDiv = document.querySelector(".currentcolor");
    currentColorDiv.style.backgroundColor = color;
    app.toggleColorSelector();
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
      console.log("x: " + gridX + " y: " + gridY + " color: " + app.data.selectedColor);
      //console.log(this.$route.query.game_id) // outputs 'yay'
      axios({
        method: "post",
        url: draw_url,
        params: {
          x: gridX,
          y: gridY,
          color: app.data.selectedColor,
          click_time: Date.now(),
        },
      })
        .then((r) => {
          //app.data.cells[gridY][gridX] = app.data.selectedColor;
          console.log("can move: " + r.data.can_move);
          if (r.data.can_move){
            app.data.cells[gridY][gridX] = app.data.selectedColor;
            app.drawGrid();
          }
        })
        .catch((e) => {
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
        let boardDict = r.data.pixels;  
        // console.log(r.data.pixels)
        for (let key in boardDict) {
          let [x, y] = key.split(',').map(Number);
          let color = boardDict[key];
          app.data.cells[x][y] = color;
        }

        app.drawGrid();
      })
      .catch((e) => {
        console.log("Failed to get pixels");
        console.log(e);
      });
  };

  app.update = () => {
    app.get_pixels();
    app.get_chat_messages();
    // app.get_leaderboard();
  };

  app.methods = {
    drawGrid: app.drawGrid,
    mousedown: app.mousedown,
    mouseup: app.mouseup,
    mousemove: app.mousemove,
    wheel: app.wheel,
    dblclick: app.dblclick,
    toggleColorSelector: app.toggleColorSelector,
    get_pixels: app.get_pixels,
    selectColor: app.selectColor,
    toggleLeaderBoard: app.toggleLeaderBoard,
    get_chat_messages: app.get_chat_messages,
    send_chat_message: app.send_chat_message,
    update: app.update,
  };

  app.vue = new Vue({
    el: "#vue-target",
    data: app.data,
    methods: app.methods,
  });

  app.init = function () {
    const canvasContainer = document.querySelector(".canvas_container");
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

    // app.get_pixels();
    // app.get_chat_messages();
    app.update();
    // TODO - fix race condition where pixel is posted before the get_pixels request is finished
    setInterval(app.update, app.data.updateInterval); // Get Pixels every 10 seconds

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
