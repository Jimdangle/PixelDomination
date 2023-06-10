let app = {};

function getLastPart(url) {
  const parts = url.split("/");
  return parts.at(-1);
}

var getUrlParameter = function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1),
    sURLVariables = sPageURL.split("&"),
    sParameterName,
    i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split("=");

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined
        ? true
        : decodeURIComponent(sParameterName[1]);
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
    totalRows: 200,
    totalCols: 200,
    initialRows: 40,
    initialCols: 40,
    cells: Array(200).fill(Array(200).fill("white")),
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
    game_id: getUrlParameter("game_id"),
    chatOpen: false,
    chatMessages: [],
    chatMessage: "",
    updateInterval: 5000,
    add_scores: [],
    game_info: {},
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

    // Calculate the total grid size
    let totalGridWidth = app.data.totalCols * app.data.cellSize;
    let totalGridHeight = app.data.totalRows * app.data.cellSize;

    // Calculate the "bounding box" size, adding a margin which is half of the canvas size
    let boundingBoxWidth =
      Math.max(app.data.canvas.width / app.data.cameraZoom, totalGridWidth) +
      200; // add 200 as margin
    let boundingBoxHeight =
      Math.max(app.data.canvas.height / app.data.cameraZoom, totalGridHeight) +
      200; // add 200 as margin

    // The maximum offset is half of the bounding box size
    let maxOffsetX = boundingBoxWidth / 2;
    let maxOffsetY = boundingBoxHeight / 2;

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
        -app.data.totalCols * app.data.cellSize * 0.5 + app.data.cameraOffset.x,
        -app.data.totalRows * app.data.cellSize * 0.5 + app.data.cameraOffset.y
      );

      // Calculate the visible range of cells
      let cellSize = app.data.cellSize;
      let zoom = app.data.cameraZoom;
      let visibleRows = Math.ceil(app.data.canvas.height / (cellSize * zoom));
      let visibleCols = Math.ceil(app.data.canvas.width / (cellSize * zoom));
      let startRow = Math.max(
        Math.floor(-ctx.getTransform().f / (cellSize * zoom)),
        0
      );
      let startCol = Math.max(
        Math.floor(-ctx.getTransform().e / (cellSize * zoom)),
        0
      );
      let endRow = Math.min(startRow + visibleRows + 1, app.data.totalRows);
      let endCol = Math.min(startCol + visibleCols + 1, app.data.totalCols);

      // The actual grid drawing
      for (let i = startRow; i < endRow; i++) {
        for (let j = startCol; j < endCol; j++) {
          let x = j * cellSize;
          let y = i * cellSize;

          // If cell is set to 1, fill it
          if (app.data.cells[i][j] == null) {
            app.data.cells[i][j] = "#ffffff";
          } else {
            ctx.fillStyle = app.data.cells[i][j];
          }
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

    const oldZoom = app.data.cameraZoom;

    if (event.deltaY < 0) {
      app.data.cameraZoom *= 1.02;
    } else {
      app.data.cameraZoom /= 1.02;
    }

    app.data.cameraZoom = Math.min(app.data.cameraZoom, app.data.MAX_ZOOM);
    app.data.cameraZoom = Math.max(app.data.cameraZoom, app.data.MIN_ZOOM);

    const newZoom = app.data.cameraZoom;

    const totalGridWidth = app.data.totalCols * app.data.cellSize;
    const totalGridHeight = app.data.totalRows * app.data.cellSize;

    const boundingBoxWidth =
      Math.max(app.data.canvas.width / newZoom, totalGridWidth) +
      app.data.canvas.width / newZoom;
    const boundingBoxHeight =
      Math.max(app.data.canvas.height / newZoom, totalGridHeight) +
      app.data.canvas.height / newZoom;

    let maxOffsetX = boundingBoxWidth / 2;
    let maxOffsetY = boundingBoxHeight / 2;

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
      console.log(
        "x: " + gridX + " y: " + gridY + " color: " + app.data.selectedColor
      );
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
          if (r.data.can_move) {
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
          let [x, y] = key.split(",").map(Number);
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

  app.count_score = function () {
    axios({
      method: "get",
      url: count_score_url,
    })
      .then((r) => {
        console.log("Got score");
        app.data.add_scores = [
          { name: "Black", count: r.data.black },
          { name: "Red", count: r.data.red },
          { name: "Green", count: r.data.green },
          { name: "Blue", count: r.data.blue },
          { name: "Yellow", count: r.data.yellow },
        ];
        app.data.add_scores.sort((a, b) => b.count - a.count);
      })
      .catch((e) => {
        console.log("Failed to get score");
        console.log(e);
      });
  };

  app.updateTimer = function () {
    var now = new Date(Date.now());
    // Print out the time left
    var diff = app.data.game_info.end_time - now;
    // Get values for each amount
    var days = Math.floor(
      (diff % (1000 * 60 * 60 * 24 * 7)) / (1000 * 60 * 60 * 24)
    );
    var hh = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var mm = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    var ss = Math.floor((diff % (1000 * 60)) / 1000);
    // Add padding 0s if necesary
    if (ss < 10) ss = "0" + ss;
    if (mm < 10) mm = "0" + mm;
    if (hh < 10) hh = "0" + hh;
    if (days > 0)
      app.data.game_info.ttl = days + " Days " + hh + ":" + mm + ":" + ss;
    else app.data.game_info.ttl = hh + ":" + mm + ":" + ss;
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
    count_score: app.count_score,
  };

  app.vue = new Vue({
    el: "#vue-target",
    data: app.data,
    methods: app.methods,
  });

  app.init = function () {
    current_game_id = getLastPart(window.location.href);
    axios({
      method: "get",
      url: game_grid_url,
      params: {
        game_id: current_game_id,
      },
    })
      .then((r) => {
        //app.data.cells[gridY][gridX] = app.data.selectedColor;
        console.log(
          "game id: " +
            r.data.game_id +
            " x_size: " +
            r.data.grid_x +
            " y_size: " +
            r.data.grid_y
        );
        app.data.totalRows = r.data.grid_x;
        app.data.totalCols = r.data.grid_y;

        // Let's get the end_time and parse it
        app.data.game_info = r.data.game_info;
        // Parse the end_time to a time in milliseconds
        app.data.game_info.end_time = new Date(
          app.data.game_info.end_time + "Z"
        ).getTime();
        // update timer
        app.updateTimer();
        // Set interval to update timer every second
        setInterval(() => {
          app.updateTimer();
        }, 1000);
        console.log(app.data.game_info);
      })
      .catch((e) => {
        console.log(e);
      });

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
    app.count_score();
    // TODO - fix race condition where pixel is posted before the get_pixels request is finished
    setInterval(app.update, app.data.updateInterval); // Get Pixels every 10 seconds
    setInterval(app.count_score, app.data.updateInterval);

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
