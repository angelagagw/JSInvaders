;(function () {
    var box = document.getElementById("ball"),
        fpsDisplay = document.getElementById('fpsDisplay'),
        boxPos = 10,
        boxLastPos = 10,
        boxVelocity = 0.08,
        limit = 300,
        lastFrameTimeMs = 0,
        maxFPS = 60,
        delta = 0,
        tickLength = 1000 / 60,
        fps = 60,
        framesThisSecond = 0,
        lastFpsUpdate = 0,
        running = false,
        started = false,
        frameID = 0;

    var MyGame = {
        lastTick: 0,
        lastRender: 0,
        tickLength: 1000 / 60
    };

    function update(delta) {
        boxLastPos = boxPos;
        boxPos += boxVelocity * delta;
        // Switch directions if we go too far
        if (boxPos >= limit || boxPos <= 0) boxVelocity = -boxVelocity;
    }

    function render(interp) {
        box.setAttribute("cx", (boxLastPos + (boxPos - boxLastPos) * interp));
        fpsDisplay.textContent = Math.round(fps) + ' FPS';
    }

    function panic() {
        delta = 0;
    }

    function begin() {
    }

    function end(fps) {
        if (fps < 25) {
            box.style.backgroundColor = 'black';
        }
        else if (fps > 30) {
            box.style.backgroundColor = 'red';
        }
    }

    function stop() {
        running = false;
        started = false;
        cancelAnimationFrame(frameID);
    }

    function start() {
        if (!started) {
            started = true;

            MyGame.lastTick = performance.now();
            MyGame.lastRender = MyGame.lastTick;

            setInitialState();
            main(performance.now());
        }
    }

    function main(timestamp) {
        frameID = requestAnimationFrame(main);
        // Throttle the frame rate.    
        if (timestamp < lastFrameTimeMs + (1000 / maxFPS)) {
            return;
        }
        delta += timestamp - lastFrameTimeMs;
        lastFrameTimeMs = timestamp;

        begin(timestamp, delta);

        if (timestamp > lastFpsUpdate + 1000) {
            fps = 0.25 * framesThisSecond + 0.75 * fps;

            lastFpsUpdate = timestamp;
            framesThisSecond = 0;
        }
        framesThisSecond++;



        var numTicks = 0,
            nextTick = MyGame.lastTick + MyGame.tickLength;

        if (timestamp > 
        while (delta >= MyGame.tickLength) {
            update(tickLength);
            delta -= tickLength;
            if (++numUpdateSteps >= 240) {
                panic();
                break;
            }
        }

        render(delta / MyGame.tickLength);

        end(fps);
    }

    function queueUpdates( numTicks ) {
        for(var i=0; i < numTicks; i++) {
            MyGame.lastTick = MyGame.lastTick + MyGame.tickLength; //Now lastTick is this tick.
            update( MyGame.lastTick );
        }
    }

    start();
})();
