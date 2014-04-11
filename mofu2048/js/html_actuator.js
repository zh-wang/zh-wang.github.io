function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");

  this.score = 0;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
        //self.getRanking(metadata);
      } else if (metadata.won) {
        self.message(true); // You win!
        //self.getRanking(metadata);
      }
    }

  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function () {
  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  if (tile.value > 2048) classes.push("tile-super");

  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");
  //inner.textContent = tile.value;
  inner.textContent = "";

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.getRanking = function (metadata) {
  var self = this;
  var score = metadata.score;
  var bestScore = metadata.bestScore;
  if (score > 0) {
          var url = "http://smj.io/2048/2048_rank.php?uid=anonymous&cur=" + score + "&best=" + bestScore;
          var request = new XMLHttpRequest();
          console.log(url);
          request.open("GET", url, true);
          request.send("");
          request.onreadystatechange = checkReadyState;

          function checkReadyState(){
              if ((request.readyState == 4) && (request.status == 200)){
                  console.log(request.responseText);
                  var t = JSON.parse(request.responseText);
                  var cur_rank = t['cur_rank'];
                  var best_rank = t['best_rank'];
                  self.showRanking(cur_rank, best_rank);
              } else {
                  self.hideRanking();
              }
          }
  }
}

HTMLActuator.prototype.showRanking = function (cur_rank, best_rank) {
  var cRank = "今回のランキング";
  var bRank = "自己ベストランキング";
  var type = "ranking";

  this.messageContainer.getElementsByTagName("p")[0].textContent = cRank;
  this.messageContainer.getElementsByTagName("p")[1].textContent = cur_rank;
  this.messageContainer.getElementsByTagName("p")[2].textContent = bRank;
  this.messageContainer.getElementsByTagName("p")[3].textContent = best_rank;
}

HTMLActuator.prototype.hideRanking = function () {
  var cRank = "今回のランキング";
  var bRank = "自己ベストランキング";
  var type = "ranking";

  this.messageContainer.getElementsByTagName("p")[0].textContent = cRank;
  this.messageContainer.getElementsByTagName("p")[1].textContent = "アクセスできません";
  this.messageContainer.getElementsByTagName("p")[2].textContent = bRank;
  this.messageContainer.getElementsByTagName("p")[3].textContent = "アクセスできません";
}

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "You Win !" : "Game Over!";

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("h1")[0].textContent = message;
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};
