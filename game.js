(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // Constants (mirrors the original pygame globals in main.py)
  // ---------------------------------------------------------------------
  var SCREEN_WIDTH = 1100;
  var SCREEN_HEIGHT = 600;
  var Y_POS_BG = 375;
  var FIXED_STEP = 1000 / 30; // pygame ran clock.tick(30)
  var MAX_STEPS_PER_FRAME = 5; // avoid spiral-of-death after tab is backgrounded

  function randInt(min, max) {
    // inclusive of both ends, like Python's random.randint
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function rectsCollide(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  // ---------------------------------------------------------------------
  // Asset loading
  // ---------------------------------------------------------------------
  function loadImage(src) {
    var img = new Image();
    img.src = src;
    return img;
  }

  function loadAll(paths, cb) {
    var images = {};
    var remaining = 0;
    var failed = [];

    Object.keys(paths).forEach(function (key) {
      var val = paths[key];
      if (Array.isArray(val)) {
        images[key] = val.map(loadImage);
        remaining += val.length;
      } else {
        images[key] = loadImage(val);
        remaining += 1;
      }
    });

    function onOne(src, ok) {
      remaining -= 1;
      if (!ok) failed.push(src);
      if (remaining <= 0) cb(images, failed);
    }

    Object.keys(paths).forEach(function (key) {
      var imgs = Array.isArray(images[key]) ? images[key] : [images[key]];
      imgs.forEach(function (img) {
        img.addEventListener("load", function () {
          onOne(img.src, true);
        });
        img.addEventListener("error", function () {
          onOne(img.src, false);
        });
      });
    });
  }

  var ASSET_PATHS = {
    galloping: ["Assets/unicorn/unicorngalloping1.png", "Assets/unicorn/unicorngalloping2.png"],
    ducking: ["Assets/unicorn/unicornducking1.png", "Assets/unicorn/unicornducking2.png"],
    jumping: "Assets/unicorn/unicornjumping.png",
    smallRainbow: [
      "Assets/obstacles/smallrainbow1.png",
      "Assets/obstacles/smallrainbow2.png",
      "Assets/obstacles/smallrainbow3.png",
    ],
    largeRainbow: [
      "Assets/obstacles/largerainbow1.png",
      "Assets/obstacles/largerainbow2.png",
      "Assets/obstacles/largerainbow3.png",
    ],
    star: ["Assets/star/star1.png", "Assets/star/star2.png"],
    flyers: ["Assets/other/cloud1.png", "Assets/other/cloud2.png"],
    track: "Assets/other/track.png",
    backdrop: "Assets/other/para.jpg",
  };

  // ---------------------------------------------------------------------
  // Entities (ported 1:1 from the Python classes)
  // ---------------------------------------------------------------------
  function Unicorn(assets) {
    this.X_POS = 80;
    this.Y_POS = 310;
    this.Y_POS_DUCK = 350;
    this.JUMP_VEL = 8.5;

    this.duckImg = assets.ducking;
    this.gallopImg = assets.galloping;
    this.jumpImg = assets.jumping;

    this.ducking = false;
    this.galloping = true;
    this.jumping = false;

    this.stepIndex = 0;
    this.jumpVel = this.JUMP_VEL;

    this.image = this.gallopImg[0];
    this.x = this.X_POS;
    this.y = this.Y_POS;
    this.width = this.image.naturalWidth || this.image.width;
    this.height = this.image.naturalHeight || this.image.height;
  }

  Unicorn.prototype.update = function (input) {
    if (this.ducking) this.duck();
    if (this.galloping) this.gallop();
    if (this.jumping) this.jump();

    if (this.stepIndex >= 10) this.stepIndex = 0;

    if (input.up && !this.jumping) {
      this.ducking = false;
      this.galloping = false;
      this.jumping = true;
    } else if (input.down && !this.jumping) {
      this.ducking = true;
      this.galloping = false;
      this.jumping = false;
    } else if (!(this.jumping || input.down)) {
      this.ducking = false;
      this.galloping = true;
      this.jumping = false;
    }
  };

  Unicorn.prototype._setImage = function (img) {
    this.image = img;
    this.width = img.naturalWidth || img.width;
    this.height = img.naturalHeight || img.height;
  };

  Unicorn.prototype.duck = function () {
    this._setImage(this.duckImg[Math.floor(this.stepIndex / 5)]);
    this.x = this.X_POS;
    this.y = this.Y_POS_DUCK;
    this.stepIndex += 1;
  };

  Unicorn.prototype.gallop = function () {
    this._setImage(this.gallopImg[Math.floor(this.stepIndex / 5)]);
    this.x = this.X_POS;
    this.y = this.Y_POS;
    this.stepIndex += 1;
  };

  Unicorn.prototype.jump = function () {
    this._setImage(this.jumpImg);
    if (this.jumping) {
      this.y -= this.jumpVel * 4;
      this.jumpVel -= 0.8;
    }
    if (this.jumpVel < -this.JUMP_VEL) {
      this.jumping = false;
      this.jumpVel = this.JUMP_VEL;
    }
  };

  Unicorn.prototype.rect = function () {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  };

  Unicorn.prototype.draw = function (ctx) {
    ctx.drawImage(this.image, this.x, this.y);
  };

  // "Cloud" in the original code — the sprite is actually a flying pegasus
  // unicorn silhouette that drifts across the sky.
  function Cloud(assets) {
    this.images = assets.flyers;
    this.image = this.images[randInt(0, this.images.length - 1)];
    this.x = SCREEN_WIDTH + randInt(800, 1000);
    this.y = randInt(50, 100);
    this.width = this.image.naturalWidth || this.image.width;
  }

  Cloud.prototype.update = function (gameSpeed) {
    this.x -= gameSpeed;
    if (this.x < -this.width) {
      this.x = SCREEN_WIDTH + randInt(2500, 3000);
      this.y = randInt(50, 100);
      this.image = this.images[randInt(0, this.images.length - 1)];
    }
  };

  Cloud.prototype.draw = function (ctx) {
    ctx.drawImage(this.image, this.x, this.y);
  };

  function Obstacle(images, type) {
    this.images = images;
    this.type = type;
    this.image = images[type];
    this.x = SCREEN_WIDTH;
    this.y = 0;
    this.width = this.image.naturalWidth || this.image.width;
    this.height = this.image.naturalHeight || this.image.height;
  }

  Obstacle.prototype.update = function (gameSpeed) {
    this.x -= gameSpeed;
  };

  Obstacle.prototype.draw = function (ctx) {
    ctx.drawImage(this.image, this.x, this.y);
  };

  Obstacle.prototype.rect = function () {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  };

  function SmallRainbow(images) {
    Obstacle.call(this, images, randInt(0, 2));
    this.y = 325;
  }
  SmallRainbow.prototype = Object.create(Obstacle.prototype);

  function LargeRainbow(images) {
    Obstacle.call(this, images, randInt(0, 2));
    this.y = 325;
  }
  LargeRainbow.prototype = Object.create(Obstacle.prototype);

  function StarObstacle(images) {
    Obstacle.call(this, images, 0);
    this.y = 270;
    this.index = 0;
  }
  StarObstacle.prototype = Object.create(Obstacle.prototype);
  StarObstacle.prototype.draw = function (ctx) {
    if (this.index >= 9) this.index = 0;
    ctx.drawImage(this.images[Math.floor(this.index / 5)], this.x, this.y);
    this.index += 1;
  };

  // ---------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------
  var input = { up: false, down: false };

  var JUMP_KEYS = { ArrowUp: 1, Space: 1, KeyW: 1 };
  var DUCK_KEYS = { ArrowDown: 1, KeyS: 1 };

  // ---------------------------------------------------------------------
  // Game state / mode machine
  // ---------------------------------------------------------------------
  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var loadingEl = document.getElementById("loading");

  var assets = null;
  var mode = "loading"; // "loading" | "menu" | "playing" | "frozen"
  var player, cloud;
  var state = {
    gameSpeed: 15,
    xPosBg: 0,
    points: 0,
    obstacles: [],
    deathCount: 0,
  };

  function startGame() {
    if (mode !== "menu") return;
    state.gameSpeed = 15;
    state.xPosBg = 0;
    state.points = 0;
    state.obstacles = [];
    player = new Unicorn(assets);
    cloud = new Cloud(assets);
    mode = "playing";
  }

  function triggerDeath() {
    mode = "frozen";
    setTimeout(function () {
      state.deathCount += 1;
      mode = "menu";
    }, 2000);
  }

  function backgroundScroll() {
    var imageWidth = assets.track.naturalWidth || assets.track.width;
    ctx.drawImage(assets.track, state.xPosBg, Y_POS_BG);
    ctx.drawImage(assets.track, imageWidth + state.xPosBg, Y_POS_BG);
    if (state.xPosBg <= -imageWidth) {
      ctx.drawImage(assets.track, imageWidth + state.xPosBg, Y_POS_BG);
      state.xPosBg = 0;
    }
    state.xPosBg -= state.gameSpeed;
  }

  function drawScore() {
    state.points += 1;
    if (state.points % 100 === 0) state.gameSpeed += 1;

    ctx.fillStyle = "#000";
    ctx.font = "bold 20px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Points: " + state.points, 1000, 40);
  }

  function maybeSpawnObstacle() {
    if (state.obstacles.length !== 0) return;
    // Faithfully ported from the original elif chain in main.py, including
    // its quirk of re-rolling a fresh random number for each branch.
    if (randInt(0, 2) === 0) {
      state.obstacles.push(new SmallRainbow(assets.smallRainbow));
    } else if (randInt(0, 2) === 1) {
      state.obstacles.push(new LargeRainbow(assets.largeRainbow));
    } else if (randInt(0, 2) === 2) {
      state.obstacles.push(new StarObstacle(assets.star));
    }
  }

  function gameFrame() {
    ctx.drawImage(assets.backdrop, 0, 0);
    backgroundScroll();

    cloud.draw(ctx);
    cloud.update(state.gameSpeed);

    player.draw(ctx);
    player.update(input);

    maybeSpawnObstacle();

    for (var i = 0; i < state.obstacles.length; i++) {
      var obstacle = state.obstacles[i];
      obstacle.draw(ctx);
      obstacle.update(state.gameSpeed);
      if (obstacle.x < -obstacle.width) {
        state.obstacles.pop();
      }
      if (rectsCollide(player.rect(), obstacle.rect())) {
        triggerDeath();
        return;
      }
    }

    drawScore();
  }

  function menuFrame() {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 30px Arial, Helvetica, sans-serif";

    var msg = state.deathCount === 0 ? "Press any Key to Start" : "Press any Key to Restart";
    ctx.fillText(msg, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);

    if (state.deathCount > 0) {
      ctx.fillText("Your Score: " + state.points, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 50);
    }

    ctx.drawImage(assets.flyers[0], SCREEN_WIDTH / 2 - 60, SCREEN_HEIGHT / 2 - 140);

    if (document.body.classList.contains("touch")) {
      ctx.font = "16px Arial, Helvetica, sans-serif";
      ctx.fillText("(tap the screen)", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + (state.deathCount > 0 ? 90 : 50));
    }
  }

  function tick() {
    if (mode === "playing") gameFrame();
    else if (mode === "menu") menuFrame();
    // "frozen": intentionally left blank so the last frame stays on screen,
    // mirroring pygame.time.delay(2000) holding the display buffer still.
  }

  // ---------------------------------------------------------------------
  // Fixed-timestep loop (matches the original's clock.tick(30))
  // ---------------------------------------------------------------------
  var lastTime = null;
  var accumulator = 0;

  function frame(ts) {
    if (lastTime === null) lastTime = ts;
    var delta = ts - lastTime;
    lastTime = ts;
    if (delta > 250) delta = 250;
    accumulator += delta;

    var steps = 0;
    while (accumulator >= FIXED_STEP && steps < MAX_STEPS_PER_FRAME) {
      tick();
      accumulator -= FIXED_STEP;
      steps += 1;
    }

    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------------
  // Input wiring: keyboard, mouse, touch
  // ---------------------------------------------------------------------
  function onAnyStart() {
    if (mode === "menu") startGame();
  }

  window.addEventListener(
    "keydown",
    function (e) {
      if (JUMP_KEYS[e.code] || DUCK_KEYS[e.code]) e.preventDefault();
      if (mode === "menu") {
        startGame();
        return;
      }
      if (JUMP_KEYS[e.code]) input.up = true;
      if (DUCK_KEYS[e.code]) input.down = true;
    },
    { passive: false }
  );

  window.addEventListener("keyup", function (e) {
    if (JUMP_KEYS[e.code]) input.up = false;
    if (DUCK_KEYS[e.code]) input.down = false;
  });

  // Mouse: click anywhere on the canvas jumps (and starts/restarts from menu).
  canvas.addEventListener("mousedown", function (e) {
    e.preventDefault();
    if (mode === "menu") {
      startGame();
      return;
    }
    input.up = true;
  });
  window.addEventListener("mouseup", function () {
    input.up = false;
  });

  // Touch controls (shown only on coarse-pointer / touch devices).
  var isTouch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
  if (isTouch) document.body.classList.add("touch");

  var btnJump = document.getElementById("btn-jump");
  var btnDuck = document.getElementById("btn-duck");

  function bindHold(el, onDown, onUp) {
    el.addEventListener(
      "touchstart",
      function (e) {
        e.preventDefault();
        onDown();
      },
      { passive: false }
    );
    el.addEventListener("touchend", function (e) {
      e.preventDefault();
      onUp();
    });
    el.addEventListener("touchcancel", function () {
      onUp();
    });
    el.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      onDown();
    });
    el.addEventListener("pointerup", function () {
      onUp();
    });
    el.addEventListener("pointerleave", function () {
      onUp();
    });
  }

  bindHold(
    btnJump,
    function () {
      if (mode === "menu") {
        startGame();
        return;
      }
      input.up = true;
    },
    function () {
      input.up = false;
    }
  );

  bindHold(
    btnDuck,
    function () {
      if (mode === "menu") {
        startGame();
        return;
      }
      input.down = true;
    },
    function () {
      input.down = false;
    }
  );

  // Tapping anywhere else on the stage also starts/restarts from the menu.
  canvas.addEventListener(
    "touchstart",
    function (e) {
      e.preventDefault();
      onAnyStart();
    },
    { passive: false }
  );

  // ---------------------------------------------------------------------
  // Responsive scaling: fit the fixed 1100x600 playfield into whatever
  // viewport/orientation is available, crisp on high-DPI screens.
  // ---------------------------------------------------------------------
  function resize() {
    var dpr = window.devicePixelRatio || 1;
    var maxW = window.innerWidth;
    var maxH = window.innerHeight;
    var ratio = Math.min(maxW / SCREEN_WIDTH, maxH / SCREEN_HEIGHT);
    var cssW = Math.max(1, Math.floor(SCREEN_WIDTH * ratio));
    var cssH = Math.max(1, Math.floor(SCREEN_HEIGHT * ratio));

    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = SCREEN_WIDTH * dpr;
    canvas.height = SCREEN_HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------
  resize();
  loadAll(ASSET_PATHS, function (loaded, failed) {
    assets = loaded;
    loadingEl.classList.add("hidden");
    if (failed.length) {
      console.warn("Some assets failed to load:", failed);
    }
    mode = "menu";
    requestAnimationFrame(frame);
  });
})();
