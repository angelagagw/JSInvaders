;(function () {
	// Globals
	var gameInstance = null,
		delta = 0,
		lastFrameTimeMs = 0,
		lastFpsUpdate = 0,
		framesThisSecond = 0;

    function Game() {
		this.config = {
			bombRate: 0.05 / 1000,
			bombMinVelocity: 25 / 1000,
			bombMaxVelocity: 50 / 1000,
			invaderInitialVelocity: 25 / 1000,
			invaderAcceleration: 0,
			invaderDropDistance: 20,
			rocketVelocity: 120 / 1000,
			rocketMaxFireRate: 4,
			gameWidth: 400,
			gameHeight: 300,
			fps: 60,
			maxFps: 60,
			debugMode: false,
			invaderRanks: 5,
			invaderFiles: 10,
			shipSpeed: 120 / 1000,
			levelDifficultyMultiplier: 0.2,
			pointsPerInvader: 5
		};


		//  All state is in the variables below.
		//

		this.frameId = null;
        this.lastTick =  0,
        this.lastRender = 0,
        this.tickLength = 1000 / this.config.fps;

		this.lives = 3;
		this.width = 0;
		this.height = 0;
		this.gameBounds = {left: 0, top: 0, right: 0, bottom: 0};
		this.intervalId = 0;
		this.score = 0;
		this.level = 1;

		//  The state stack.
		this.stateStack = [];

		//  Input/output
		this.pressedKeys = {};
		this.gameCanvas =  null;

		//  All sounds.
		this.sounds = null;

    }
	//  Initialis the Game with a canvas.
	Game.prototype.initialize = function(gameCanvas) {

        var me = this, 
            ctx = gameCanvas.getContext('2d'),
            image = new Image();


        image.onload = function() {
            Promise.all([
                createImageBitmap(this, 0, 30, 52, 30),
                createImageBitmap(this, 0, 0, 38, 30),
                createImageBitmap(this, 38, 0, 38, 30),
                createImageBitmap(this, 38 * 2, 0, 38, 30),
                createImageBitmap(this, 38 * 3, 0, 38, 30),
                createImageBitmap(this, 38 * 4, 0, 38, 30),
                createImageBitmap(this, 38 * 5, 0, 38, 30),
                //createImageBitmap(this, 32, 0, 32, 32)
            ]).then(function(sprites) {
                me.sprites = sprites;
            });
        }
        image.src = 'content/images/sprites.png';

		//  Set the game canvas.
		this.gameCanvas = gameCanvas;

		//  Set the game width and height.
		this.width = gameCanvas.width;
		this.height = gameCanvas.height;

		//  Set the state game bounds.
		this.gameBounds = {
            left: gameCanvas.width < this.config.gameWidth ? 18 : (gameCanvas.width / 2 - this.config.gameWidth / 2),
            right: gameCanvas.width < this.config.gameWidth ? gameCanvas.width - 18 : (gameCanvas.width / 2 + this.config.gameWidth / 2),
			top: gameCanvas.height / 2 - this.config.gameHeight / 2,
			bottom: gameCanvas.height / 2 + this.config.gameHeight / 2,
		};

	};

	Game.prototype.moveToState = function(state) {
	 
	   //  If we are in a state, leave it.
	   if(this.currentState() && this.currentState().leave) {
		 this.currentState().leave(game);
		 this.stateStack.pop();
	   }
	   
	   //  If there's an enter function for the new state, call it.
	   if(state.enter) {
		 state.enter(game);
	   }
	 
	   //  Set the current state.
	   this.stateStack.pop();
	   this.stateStack.push(state);
	 };

	//  Start the Game.
	Game.prototype.start = function() {

		//  Move into the 'welcome' state.
		this.moveToState(new WelcomeState());

		//  Set the game variables.
		this.lives = 3;
		this.config.debugMode = /debug=true/.test(window.location.href);

		//  Start the game loop.
		gameInstance = this;

        if (!gameInstance.started) {
            gameInstance.started = true;

            gameInstance.lastTick = performance.now();
            gameInstance.lastRender = gameInstance.lastTick;

            //setInitialState();
            main(performance.now());
        }
	};

	//  Returns the current state.
	Game.prototype.currentState = function() {
		return this.stateStack.length > 0 ? this.stateStack[this.stateStack.length - 1] : null;
	};

	//  Mutes or unmutes the game.
	Game.prototype.mute = function(mute) {

		//  If we've been told to mute, mute.
		//if(mute === true) {
		//	this.sounds.mute = true;
		//} else if (mute === false) {
		//	this.sounds.mute = false;
		//} else {
		//	// Toggle mute instead...
		//	this.sounds.mute = this.sounds.mute ? false : true;
		//}
	};
	//
	//  The main loop.
	function main(timestamp) {
        gameInstance.frameID = requestAnimationFrame(main);

        if (timestamp < lastFrameTimeMs + (1000 / gameInstance.config.maxFPS)) {
            return;
        }
        delta += timestamp - lastFrameTimeMs;
        lastFrameTimeMs = timestamp;

		var currentState = gameInstance.currentState();
		if(currentState) {

			//  Delta t is the time to update/draw.
			var delta = 1 / game.config.fps;

			//  Get the drawing context.
			var ctx = this.gameCanvas.getContext("2d");
			
			//  Update if we have an update function. Also draw
			//  if we have a draw function.
			if(currentState.update) {
				
				if (gameInstance.debug) {
					if (timestamp > lastFpsUpdate + 1000) {
						fps = 0.25 * framesThisSecond + 0.75 * fps;

						lastFpsUpdate = timestamp;
						framesThisSecond = 0;
					}
					framesThisSecond++;
				}

				var numTicks = 0,
					nextTick = gameInstance.lastTick + gameInstance.tickLength;

				if ( timestamp > nextTick) {
				  var timeSinceTick = timestamp - gameInstance.lastTick;
				  numTicks = Math.floor( timeSinceTick / gameInstance.tickLength );
				}

				queueUpdates( numTicks, game, currentState )

			}

			if(currentState.render) {
				currentState.render(game, ctx);
			}
		}
	}

    function queueUpdates( numTicks, game, currentState ) {
        for(var i=0; i < numTicks; ++i) {
            game.lastTick = game.lastTick + game.tickLength; //Now lastTick is this tick.
            currentState.update( game, game.tickLength )
        }
    }

	Game.prototype.pushState = function( state ) {

		//  If there's an enter function for the new state, call it.
		if( state.enter ) {
			state.enter( game );
		}
		//  Set the current state.
		this.stateStack.push( state );
	};

	Game.prototype.popState = function() {

		//  Leave and pop the state.
		if(this.currentState()) {
			if(this.currentState().leave) {
				this.currentState().leave( game );
			}

			//  Set the current state.
			this.stateStack.pop();
		}
	};

	//  The stop function stops the game.
	Game.prototype.stop = function Stop() {
		clearInterval( this.intervalId );
	};

	//  Inform the game a key is down.
	Game.prototype.keyDown = function( keyCode ) {
		this.pressedKeys[keyCode] = true;
		//  Delegate to the current state too.
		if(this.currentState() && this.currentState().keyDown) {
			this.currentState().keyDown(this, keyCode);
		}
	};

	//  Inform the game a key is up.
	Game.prototype.keyUp = function( keyCode ) {
		delete this.pressedKeys[keyCode];
		//  Delegate to the current state too.
		if(this.currentState() && this.currentState().keyUp) {
			this.currentState().keyUp( this, keyCode );
		}
	};

	function WelcomeState() {

	}

	WelcomeState.prototype.enter = function( game ) {

		// Create and load the sounds.
		//game.sounds = new Sounds();
		//game.sounds.init();
		//game.sounds.loadSound('shoot', 'sounds/shoot.wav');
		//game.sounds.loadSound('bang', 'sounds/bang.wav');
		//game.sounds.loadSound('explosion', 'sounds/explosion.wav');
	};

	WelcomeState.prototype.update = function ( game, delta ) {


	};

	WelcomeState.prototype.render = function( game,  ctx ) {

		//  Clear the background.
		ctx.clearRect( 0, 0, game.width, game.height );

		ctx.font="30px Arial";
		ctx.fillStyle = '#ffffff';
		ctx.textBaseline="center"; 
		ctx.textAlign="center"; 
		ctx.fillText("GP Invaders", game.width / 2, game.height/2 - 40); 
		ctx.font="16px Arial";

		ctx.fillText("Press 'Space' to start.", game.width / 2, game.height/2); 
	};

	WelcomeState.prototype.keyDown = function(game, keyCode) {
		if(keyCode == 32) /*space*/ {
			//  Space starts the game.F1EFE2
			game.level = 1;
			game.score = 0;
			game.lives = 3;
			game.moveToState(new LevelIntroState(game.level));
		}
	};


	function GameOverState() {

	}

	GameOverState.prototype.update = function( game, delta ) {

	};

	GameOverState.prototype.render = function( game, ctx ) {

		//  Clear the background.
		ctx.clearRect(0, 0, game.width, game.height);

		ctx.font="30px Arial";
		ctx.fillStyle = '#ffffff';
		ctx.textBaseline="center"; 
		ctx.textAlign="center"; 
		ctx.fillText("Game Over!", game.width / 2, game.height/2 - 40); 
		ctx.font="16px Arial";
		ctx.fillText("You scored " + game.score + " and got to level " + game.level, game.width / 2, game.height/2);
		ctx.font="16px Arial";
		ctx.fillText("Press 'Space' to play again.", game.width / 2, game.height/2 + 40);   
	};

	GameOverState.prototype.keyDown = function( game, keyCode ) {
		if(keyCode == 32) /*space*/ {
			//  Space restarts the game.
			game.lives = 3;
			game.score = 0;
			game.level = 1;
			game.moveToState(new LevelIntroState(1));
		}
	};

	//  Create a PlayState with the game config and the level you are on.
	function PlayState( config, level ) {
		this.config = config;
		this.level = level;

		//  Game state.
		this.invaderCurrentVelocity =  10;
		this.invaderCurrentDropDistance =  0;
		this.invadersAreDropping =  false;
		this.lastRocketTime = null;

		//  Game entities.
		this.ship = null;
		this.invaders = [];
		this.rockets = [];
		this.bombs = [];
	}

	PlayState.prototype.enter = function( game ) {

		//  Create the ship.
		this.ship = new Ship(game.width / 2, game.gameBounds.bottom, game.sprites[0]);

		//  Setup initial state.
		this.invaderCurrentVelocity =  10;
		this.invaderCurrentDropDistance =  0;
		this.invadersAreDropping =  false;

		//  Set the ship speed for this level, as well as invader params.
		var levelMultiplier = this.level * this.config.levelDifficultyMultiplier;
		this.shipSpeed = this.config.shipSpeed;
		this.invaderInitialVelocity = this.config.invaderInitialVelocity + (levelMultiplier * this.config.invaderInitialVelocity);
		this.bombRate = this.config.bombRate + (levelMultiplier * this.config.bombRate);
		this.bombMinVelocity = this.config.bombMinVelocity + (levelMultiplier * this.config.bombMinVelocity);
		this.bombMaxVelocity = this.config.bombMaxVelocity + (levelMultiplier * this.config.bombMaxVelocity);

		//  Create the invaders.
		var ranks = this.config.invaderRanks;
		var files = this.config.invaderFiles;
		var invaders = [];
		for(var rank = 0; rank < ranks; rank++){
			for(var file = 0; file < files; file++) {
				invaders.push(new Invader(
					(game.width / 2) + ((files/2 - file) * 200 / files),
					(game.gameBounds.top + rank * 20),
					rank, file, 'Invader', game.sprites[getRandomInt(1, 7)]));
			}
		}
		this.invaders = invaders;
		this.invaderCurrentVelocity = this.invaderInitialVelocity;
		this.invaderVelocity = {x: -this.invaderInitialVelocity, y:0};
		this.invaderNextVelocity = null;
	};

	PlayState.prototype.update = function( game, delta ) {
		
		//  If the left or right arrow keys are pressed, move
		//  the ship. Check this on ticks rather than via a keydown
		//  event for smooth movement, otherwise the ship would move
		//  more like a text editor caret.
		if(game.pressedKeys[37]) {
			this.ship.x -= this.shipSpeed * delta;
		}
		if(game.pressedKeys[39]) {
			this.ship.x += this.shipSpeed * delta;
		}
		if(game.pressedKeys[32]) {
			this.fireRocket(game);
		}

		//  Keep the ship in bounds.
		if((this.ship.x - this.ship.width / 2) < game.gameBounds.left) {
			this.ship.x = game.gameBounds.left + this.ship.width / 2;
		}
		if((this.ship.x + this.ship.width / 2) > game.gameBounds.right) {
			this.ship.x = game.gameBounds.right - this.ship.width / 2;
		}

		//  Move each bomb.
		for(var i=0; i<this.bombs.length; i++) {
			var bomb = this.bombs[i];
			bomb.y += delta * bomb.velocity;

			//  If the rocket has gone off the screen remove it.
			if(bomb.y > this.height) {
				this.bombs.splice(i--, 1);
			}
		}

		//  Move each rocket.
		for(i=0; i<this.rockets.length; i++) {
			var rocket = this.rockets[i];
			rocket.y -= delta * rocket.velocity;

			//  If the rocket has gone off the screen remove it.
			if(rocket.y < 0) {
				this.rockets.splice(i--, 1);
			}
		}

		//  Move the invaders.
		var hitLeft = false, hitRight = false, hitBottom = false;
		for(i=0; i<this.invaders.length; i++) {
			var invader = this.invaders[i];
			var newx = invader.x + this.invaderVelocity.x * delta;
			var newy = invader.y + this.invaderVelocity.y * delta;
			if(hitLeft == false && (newx - invader.width / 2) < game.gameBounds.left) {
				hitLeft = true;
			}
			else if(hitRight == false && (newx + invader.width / 2) > game.gameBounds.right) {
				hitRight = true;
			}
			else if(hitBottom == false && newy > game.gameBounds.bottom) {
				hitBottom = true;
			}

			if(!hitLeft && !hitRight && !hitBottom) {
				invader.x = newx;
				invader.y = newy;
			}
		}

		//  Update invader velocities.
		if(this.invadersAreDropping) {
			this.invaderCurrentDropDistance += this.invaderVelocity.y * delta;
			if(this.invaderCurrentDropDistance >= this.config.invaderDropDistance) {
				this.invadersAreDropping = false;
				this.invaderVelocity = this.invaderNextVelocity;
				this.invaderCurrentDropDistance = 0;
			}
		}
		//  If we've hit the left, move down then right.
		if(hitLeft) {
			this.invaderCurrentVelocity += this.config.invaderAcceleration;
			this.invaderVelocity = {x: 0, y:this.invaderCurrentVelocity };
			this.invadersAreDropping = true;
			this.invaderNextVelocity = {x: this.invaderCurrentVelocity , y:0};
		}
		//  If we've hit the right, move down then left.
		if(hitRight) {
			this.invaderCurrentVelocity += this.config.invaderAcceleration;
			this.invaderVelocity = {x: 0, y:this.invaderCurrentVelocity };
			this.invadersAreDropping = true;
			this.invaderNextVelocity = {x: -this.invaderCurrentVelocity , y:0};
		}
		//  If we've hit the bottom, it's game over.
		if(hitBottom) {
			this.lives = 0;
		}
		
		//  Check for rocket/invader collisions.
		for(i=0; i<this.invaders.length; i++) {
			var invader = this.invaders[i];
			var bang = false;

			for(var j=0; j<this.rockets.length; j++){
				var rocket = this.rockets[j];

				if(rocket.x >= (invader.x - invader.width/2) && rocket.x <= (invader.x + invader.width/2) &&
					rocket.y >= (invader.y - invader.height/2) && rocket.y <= (invader.y + invader.height/2)) {
					
					//  Remove the rocket, set 'bang' so we don't process
					//  this rocket again.
					this.rockets.splice(j--, 1);
					bang = true;
					game.score += this.config.pointsPerInvader;
					break;
				}
			}
			if(bang) {
				this.invaders.splice(i--, 1);
				//game.sounds.playSound('bang');
			}
		}

		//  Find all of the front rank invaders.
		var frontRankInvaders = {};
		for(var i=0; i<this.invaders.length; i++) {
			var invader = this.invaders[i];
			//  If we have no invader for game file, or the invader
			//  for game file is futher behind, set the front
			//  rank invader to game one.
			if(!frontRankInvaders[invader.file] || frontRankInvaders[invader.file].rank < invader.rank) {
				frontRankInvaders[invader.file] = invader;
			}
		}

		//  Give each front rank invader a chance to drop a bomb.
		for(var i=0; i<this.config.invaderFiles; i++) {
			var invader = frontRankInvaders[i];
			if(!invader) continue;
			var chance = this.bombRate * delta;
			if(chance > Math.random()) {
				//  Fire!
				this.bombs.push(new Bomb(invader.x, invader.y + invader.height / 2, 
					this.bombMinVelocity + Math.random()*(this.bombMaxVelocity - this.bombMinVelocity)));
			}
		}

		//  Check for bomb/ship collisions.
		for(var i=0; i<this.bombs.length; i++) {
			var bomb = this.bombs[i];
			if(bomb.x >= (this.ship.x - this.ship.width/2) && bomb.x <= (this.ship.x + this.ship.width/2) &&
					bomb.y >= (this.ship.y - this.ship.height/2) && bomb.y <= (this.ship.y + this.ship.height/2)) {
				this.bombs.splice(i--, 1);
				game.lives--;
				//game.sounds.playSound('explosion');
			}
					
		}

		//  Check for invader/ship collisions.
		for(var i=0; i<this.invaders.length; i++) {
			var invader = this.invaders[i];
			if((invader.x + invader.width/2) > (this.ship.x - this.ship.width/2) && 
				(invader.x - invader.width/2) < (this.ship.x + this.ship.width/2) &&
				(invader.y + invader.height/2) > (this.ship.y - this.ship.height/2) &&
				(invader.y - invader.height/2) < (this.ship.y + this.ship.height/2)) {
				//  Dead by collision!
				game.lives = 0;
				//game.sounds.playSound('explosion');
			}
		}

		//  Check for failure
		if(game.lives <= 0) {
			game.moveToState(new GameOverState());
		}

		//  Check for victory
		if(this.invaders.length === 0) {
			game.score += this.level * 50;
			game.level += 1;
			game.moveToState(new LevelIntroState(game.level));
		}
	};

	PlayState.prototype.render = function(game, ctx) {

		//  Clear the background.
		ctx.clearRect(0, 0, game.width, game.height);
		
        // Draw Ship
        this.ship.render(ctx);

		//  Draw invaders.
		for(var i=0; i<this.invaders.length; i++) {
			this.invaders[i].render(ctx);
		}

		//  Draw bombs.
		ctx.fillStyle = '#ff5555';
		for(var i=0; i<this.bombs.length; i++) {
			var bomb = this.bombs[i];
			ctx.fillRect(bomb.x - 2, bomb.y - 2, 4, 4);
		}

		//  Draw rockets.
		ctx.fillStyle = '#ff0000';
		for(var i=0; i<this.rockets.length; i++) {
			var rocket = this.rockets[i];
			ctx.fillRect(rocket.x, rocket.y - 2, 1, 4);
		}

		//  Draw info.
		var textYpos = game.gameBounds.bottom + ((game.height - game.gameBounds.bottom) / 2) + 14/2;
		ctx.font="14px Arial";
		ctx.fillStyle = '#ffffff';
		var info = "Lives: " + game.lives;
		ctx.textAlign = "left";
		ctx.fillText(info, game.gameBounds.left, textYpos);
		info = "Score: " + game.score + ", Level: " + game.level;
		ctx.textAlign = "right";
		ctx.fillText(info, game.gameBounds.right, textYpos);

		//  If we're in debug mode, draw bounds.
		if(this.config.debugMode) {
			ctx.strokeStyle = '#ff0000';
			ctx.strokeRect(0,0,game.width, game.height);
			ctx.strokeRect(game.gameBounds.left, game.gameBounds.top,
				game.gameBounds.right - game.gameBounds.left,
				game.gameBounds.bottom - game.gameBounds.top);
		}

	};

	PlayState.prototype.keyDown = function(game, keyCode) {

		if(keyCode == 32) {
			//  Fire!
			this.fireRocket(game);
		}
		if(keyCode == 80) {
			//  Push the pause state.
			game.pushState(new PauseState());
		}
	};

	PlayState.prototype.keyUp = function(game, keyCode) {

	};

	PlayState.prototype.fireRocket = function(game) {
		//  If we have no last rocket time, or the last rocket time 
		//  is older than the max rocket rate, we can fire.
		if(this.lastRocketTime === null || ((new Date()).valueOf() - this.lastRocketTime) > (1000 / this.config.rocketMaxFireRate))
		{   
			//  Add a rocket.
			this.rockets.push(new Rocket(this.ship.x, this.ship.y - 12, this.config.rocketVelocity));
            if (game.score > 0) {
                game.score--;
            }
			this.lastRocketTime = (new Date()).valueOf();

			//  Play the 'shoot' sound.
			//game.sounds.playSound('shoot');
		}
	};


	function PauseState() {

	}

	PauseState.prototype.keyDown = function(game, keyCode) {

		if(keyCode == 80) {
			//  Pop the pause state.
			game.popState();
		}
	};

	PauseState.prototype.render = function(game, ctx) {

		//  Clear the background.
		ctx.clearRect(0, 0, game.width, game.height);

		ctx.font="14px Arial";
		ctx.fillStyle = '#ffffff';
		ctx.textBaseline="middle";
		ctx.textAlign="center";
		ctx.fillText("Paused", game.width / 2, game.height/2);
		return;
	};

	/*  
		Level Intro State
		The Level Intro state shows a 'Level X' message and
		a countdown for the level.
	*/
	function LevelIntroState(level) {
		this.level = level;
		this.countdownMessage = "3";
	}

	LevelIntroState.prototype.update = function(game, delta) {

		//  Update the countdown.
		if(this.countdown === undefined) {
			this.countdown = 3000; // countdown from 3 secs
		}
		this.countdown -= delta;

		if(this.countdown < 2000) { 
			this.countdownMessage = "2"; 
		}
		if(this.countdown < 1000) { 
			this.countdownMessage = "1"; 
		} 
		if(this.countdown <= 0) {
			//  Move to the next level, popping this state.
			game.moveToState(new PlayState(game.config, this.level));
		}

	};


	LevelIntroState.prototype.render = function(game, ctx) {

		//  Clear the background.
		ctx.clearRect(0, 0, game.width, game.height);

		ctx.font="36px Arial";
		ctx.fillStyle = '#ffffff';
		ctx.textBaseline="middle"; 
		ctx.textAlign="center"; 
		ctx.fillText("Level " + this.level, game.width / 2, game.height/2);
		ctx.font="24px Arial";
		ctx.fillText("Ready in " + this.countdownMessage, game.width / 2, game.height/2 + 36);      
		return;
	};


	/*
	 
	  Ship
	  The ship has a position and that's about it.
	*/
	function Ship(x, y, sprite) {
		this.x = x;
		this.y = y;
		this.width = 40;
		this.height = 24;
        this.sprite = sprite;
	}

    Ship.prototype.render = function(ctx) {
        if (this.sprite) {
          ctx.drawImage(this.sprite, this.x - (this.width / 2), this.y - (this.height / 2), this.width, this.height);
        } else {
            ctx.fillStyle = '#999999';
            ctx.fillRect(this.x - (this.width / 2), this.y - (this.height / 2), this.width, this.height);
        }
    }

	/*
		Rocket
		Fired by the ship, they've got a position, velocity and state.
		*/
	function Rocket(x, y, velocity) {
		this.x = x;
		this.y = y;
		this.velocity = velocity;
	}

	/*
		Bomb
		Dropped by invaders, they've got position, velocity.
	*/
	function Bomb(x, y, velocity) {
		this.x = x;
		this.y = y;
		this.velocity = velocity;
	}
	 
	/*
		Invader 
		Invader's have position, type, rank/file and that's about it. 
	*/

	function Invader(x, y, rank, file, type, sprite) {
		this.x = x;
		this.y = y;
		this.rank = rank;
		this.file = file;
		this.type = type;
		this.width = 18;
		this.height = 14;
        this.sprite = sprite;
        this.isExploding = false;
	}
    Invader.prototype.render = function(ctx) {
		//  Draw invaders.
		ctx.fillStyle = '#006600';
        if (!this.isExploding) {
            //ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
            if (this.sprite) {
                ctx.drawImage(this.sprite, this.x - this.width/2, this.y - this.height/2, this.width, this.height);
            }
        }
    }

	/*
		Game State
		A Game State is simply an update and draw proc.
		When a game is in the state, the update and draw procs are
		called, with a delta value (delta is delta time, i.e. the number)
		of seconds to update or draw).
	*/
	function GameState(updateProc, drawProc, keyDown, keyUp, enter, leave) {
		this.updateProc = updateProc;
		this.drawProc = drawProc;
		this.keyDown = keyDown;
		this.keyUp = keyUp;
		this.enter = enter;
		this.leave = leave;
	}

	
	//  Setup the canvas.
	var canvas = document.getElementById("gameCanvas"),
        width = screen && screen.width;
        height = screen && screen.height;
	canvas.width = width || 800; //< 800 ? width : 800;
	canvas.height = height ? height - 30 : 600; // < 600 ? height : 600;
	//  Create the game.
	var game = new Game();
	//  Initialise it with the game canvas.
	game.initialize(canvas);
	//  Start the game.
	game.start();
	//  Listen for keyboard events.
	window.addEventListener("keydown", function keydown(e) {
		var keycode = e.which || window.event.keycode;
		//  Supress further processing of left/right/space (37/29/32)
		if(keycode == 37 || keycode == 39 || keycode == 32) {
			e.preventDefault();
		}
		game.keyDown(keycode);
	});
	window.addEventListener("keyup", function keydown(e) {
		var keycode = e.which || window.event.keycode;
		game.keyUp(keycode);
	});
	function toggleMute() {
		game.mute();
		document.getElementById("muteLink").innerText = game.sounds.mute ? "unmute" : "mute";
	}

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
})();
