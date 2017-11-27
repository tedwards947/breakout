


var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');



var x = canvas.width / 2;
var y = canvas.height - 30;


var INITIAL_DX_MAGNITUDE = 4//2;
var INITIAL_DY_MAGNITUDE = 4//2;
var INITIAL_DX = INITIAL_DX_MAGNITUDE;
var INITIAL_DY = -INITIAL_DY_MAGNITUDE;

var dx = INITIAL_DX;
var dy = INITIAL_DY;



//BALL VARS
var ball = {
    isLaunched: false,
    radius: 10,
    color: '#000000',
    possibleColors: [
        '#000000',
        '#FF0000',
        '#00FF00',
        '#0000FF'
    ],
    decayVelocity: function(){
        //degrade the velocity due to bounces
        const dxSign = Math.sign(dx);
        const dySign = Math.sign(dy);

        const absdx = Math.abs(dx);
        const absdy = Math.abs(dy);

        if(absdx > INITIAL_DX_MAGNITUDE){
            console.log('nerfing x velocity')
            // console.log('abs dx is greater than initial', dx)

            dx = dxSign * (absdx - 1);
        } 
        if(absdy > INITIAL_DY_MAGNITUDE){
            console.log('nerfing y velocity')
            // console.log('abs dy is greater than initial', dy)
            dy = dySign * (absdy - 1);
        }
    }
};



var paddle = {
    x: 0, //start in the far left
    height: 20,
    width: 95,
    color: '#0095DD',
    radius: 5,
    previousFrameX: 0,
    velocity: 0
};






var brickRowCount = 1;
var brickColumnCount = 7;
var brickWidth = 75;
var brickHeight = 20;
var brickPadding = 10;
var brickOffsetTop = 30;
var brickOffsetLeft = 30;

var possibleBrickColors = {
 blue: '#0095DD',
 green: 'green',
 gold: 'rgba(240, 224, 38, 1)'
}

var bricks = [];




var rightPressed = false;
var leftPressed = false;
var isPaused = false;
var onAutopilot = false;



var lives = 3;

var gameState = 'inplay';

var score = 0;
var calculatedMaximumScore = 0;


//we want the chances of any given brick being gold to be rare and dependant on the size of the brick array
var chanceOfBrickBeingGold = 3 / (brickRowCount * brickColumnCount);


//HELPERS
const animationStorage = {};
function getAnimatedOpacity(id, maxSteps){
    //keeps track of counts and returns a different opacity value
    if(animationStorage[id]){
        if(animationStorage[id].stepsRemaining <= 1){
            // debugger;
            delete animationStorage[id];
            return 0;
        } else {
            --animationStorage[id].stepsRemaining;
        }
    } else {
        animationStorage[id] = {
            maxSteps: maxSteps,
            stepsRemaining: maxSteps
        };
    }

    const calculatedOpacity = animationStorage[id].stepsRemaining / animationStorage[id].maxSteps;
    return calculatedOpacity;
}
function loopThroughBricks(cb){
    Array.from(Array(brickColumnCount)).forEach(function(j, columnIndex){
        Array.from(Array(brickRowCount)).forEach(function(l, rowIndex){
            cb(columnIndex, rowIndex);
        });
    });
}
function roundRect(_ctx, _x, _y, _width, _height, _radius, _fill, _stroke) {
    if (typeof _stroke == 'undefined') {
        _stroke = true;
    }
    if (typeof _radius === 'undefined') {
        _radius = 5;
    }
    if (typeof _radius === 'number') {
        _radius = { tl: _radius, tr: _radius, br: _radius, bl: _radius };
    } else {
        var defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (var side in defaultRadius) {
            _radius[side] = _radius[side] || defaultRadius[side];
        }
    }
    _ctx.beginPath();
    _ctx.moveTo(_x + _radius.tl, _y);
    _ctx.lineTo(_x + _width - _radius.tr, _y);
    _ctx.quadraticCurveTo(_x + _width, _y, _x + _width, _y + _radius.tr);
    _ctx.lineTo(_x + _width, _y + _height - _radius.br);
    _ctx.quadraticCurveTo(_x + _width, _y + _height, _x + _width - _radius.br, _y + _height);
    _ctx.lineTo(_x + _radius.bl, _y + _height);
    _ctx.quadraticCurveTo(_x, _y + _height, _x, _y + _height - _radius.bl);
    _ctx.lineTo(_x, _y + _radius.tl);
    _ctx.quadraticCurveTo(_x, _y, _x + _radius.tl, _y);
    if (_fill) {
        _ctx.fillStyle = _fill;
        _ctx.fill();
    }
    if (_stroke) {
        _ctx.stroke();
    }
    _ctx.closePath();
}




//INIT BRICKS ARRAY
bricks = Array.from(Array(brickColumnCount)).map(function(j, columnIndex){
    return Array.from(Array(brickRowCount)).map(function(l, rowIndex){
        function getBrickWorth(){
            const randomNumber = Math.random();

            if(chanceOfBrickBeingGold >= randomNumber){
                //it passes the test. make it worth gold!

                calculatedMaximumScore = calculatedMaximumScore + 3;
                return 'gold';
            } else if(rowIndex <= 1){
                //make all the bricks green which are in the first two rows

                calculatedMaximumScore = calculatedMaximumScore + 2;
                return 'green';
            }
            else {
                calculatedMaximumScore = calculatedMaximumScore + 1;
                return 'blue'
            }
        }


        return {
            x:0, 
            y:0,
            status: 1,
            worth: getBrickWorth()
        }
    });
});


function drawBricks(){
    loopThroughBricks(function(columnIndex, rowIndex){
        const brick = bricks[columnIndex][rowIndex];

        if(brick.status === 1) {
            var brickX = (columnIndex*(brickWidth+brickPadding))+brickOffsetLeft;
            var brickY = (rowIndex*(brickHeight+brickPadding))+brickOffsetTop;
            bricks[columnIndex][rowIndex].x = brickX;
            bricks[columnIndex][rowIndex].y = brickY;

            ctx.beginPath();
            ctx.rect(brickX, brickY, brickWidth, brickHeight);
            ctx.fillStyle = possibleBrickColors[brick.worth]//;
            ctx.fill();
            ctx.closePath();
        }
    });
}


function drawPaddle() {
    const aPaddleRadius = 5;
    const aPaddleColor = "#FF0000";
    ctx.beginPath();
    roundRect(ctx, paddle.x, canvas.height - paddle.height, paddle.width, paddle.height, paddle.radius + 5, paddle.color, 0);
    ctx.closePath();
}


function drawBall() {
  
    // const animationLevel = getAnimatedOpacity('ball', 25);
    // console.log('animationlevel', animationLevel);
    ctx.beginPath();
    ctx.arc(x, y, ball.radius, 0, Math.PI*2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();


    //line marker
    // ctx.beginPath();
    // ctx.rect(x, 0, 2, canvas.height)
    // ctx.fillStyle = "#0095DD";
    // ctx.fill();
    // ctx.closePath();
}

function doAutopilotInstructions() {
    //pilot the ship for the human!

    const fakeEventObject = {
        human: false,
        clientX: x + canvas.offsetLeft
    };

    mouseMoveHandler(fakeEventObject);
}

function bounceBallOffWallsOrPaddle(){

    const isSideHit = (x + dx > canvas.width - ball.radius || x + dx < ball.radius);
    const isTopHit = (y + dy < ball.radius);
    const isPaddleHit = (y + dy > canvas.height - paddle.height - ball.radius) && (x > paddle.x && x < paddle.x + paddle.width);
    const isBottomHit = (y + dy > canvas.height - ball.radius);

    if(isSideHit) {
        dx = -dx;
        ball.decayVelocity();
    }
     else if(isTopHit) {
        //bounce
        dy = -dy;
        ball.decayVelocity();
    } 
    else if(isPaddleHit){
        //detect bounce on paddle top!
        const MAX_ADDITIONAL_SPEED = 4;

        const dySign = Math.sign(dy);
        const absdy = Math.abs(dy);
        const velocitySign = Math.sign(paddle.velocity);

        let additionalSpeed = velocitySign * Math.ceil(Math.abs(paddle.velocity) / 10);
        


        if(additionalSpeed <= MAX_ADDITIONAL_SPEED){
            // console.log('additionalSpeed!', additionalSpeed)
            console.log('previous dx', dx, 'previous dy', dy, 'adding additional', additionalSpeed, 'raw', paddle.velocity / 10)
   

            dy = -dySign * (absdy + additionalSpeed);
            dx = dx + additionalSpeed; //velocitySign * 
            console.log('next dx', dx, 'next dy', dy)
            // console.log(paddle.velocity, additionalSpeed);
        } else {
            dy = -dySign * dy;
            // dy = -dy;
        }

        
        // dy = -dy;

    } 
    else if(isBottomHit) {
        //YOU LOSE
        --lives;
        if(!lives){
            gameState = "loss";
        }
        else {
            resetBall();
        }
    }
}




function determinePaddleVelocity(){
    //use to determine ball boosting speed
    const paddleVelocity = paddle.previousFrameX - paddle.x;

    paddle.previousFrameX = paddle.x;
    paddle.velocity = paddleVelocity;
}

function drawVelocityMarkers(){

    //draw positive velocity graph
    ctx.beginPath();
    roundRect(ctx, 95, 50, 5, 50, 0, "black", 0);
    ctx.closePath();
    //draw negative velocity graph
    ctx.beginPath();
    roundRect(ctx, 95, 100, 5, 50, 0, "red", 0);
    ctx.closePath();

    //draw a graph of paddle velocity!
    ctx.beginPath();
    roundRect(ctx, 100, 100, 20, paddle.velocity, 0, paddle.color, 0);
    ctx.closePath();

    //draw a graph of ball X velocity
    ctx.beginPath();
    roundRect(ctx, 120, 100, 20, dx * 5, 0, 'yellow', 0);
    ctx.closePath();

    //draw a graph of ball Y velocity
    ctx.beginPath();
    roundRect(ctx, 140, 100, 20, dy * 5, 0, 'green', 0);
    ctx.closePath();
}

function resetBall(){
    ball.isLaunched = false;

    //reset initial velocity
    dx = INITIAL_DX;
    dy = INITIAL_DY;

    //fix the position of the ball to the paddle
    x = paddle.x + (paddle.width / 2);
    y = canvas.height - paddle.height - ball.radius;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    drawLives();
    drawScore();
    drawGameState();

    drawVelocityMarkers();

    if(onAutopilot){
        doAutopilotInstructions();
    }

    determinePaddleVelocity();

    brickCollisionDetection();
    bounceBallOffWallsOrPaddle();



    if(ball.isLaunched){
        //if the ball is launched, calculate the ball's next position.
        x += dx;
        y += dy;
    } else {
        //fix the position of the ball to the paddle
        resetBall();
        // x = paddle.x + (paddle.width / 2);
        // y = canvas.height - paddle.height - ball.radius;
    }


    //animate the paddle
    if(rightPressed && paddle.x < canvas.width - paddle.width) {
        paddle.x += 7;
    }
    else if(leftPressed && paddle.x > 0) {
        paddle.x -= 7;
    }


    //continue the game loop
    if(!isPaused){
        requestAnimationFrame(draw);
    }
 
    if(lives <= 0){
        dx = 0;
        dy = 0;
    }
    // if(lives > 0){
    //     requestAnimationFrame(draw);
    // } else if(gameState !== 'inplay' && gameState !== 'postplay' && gameState !== 'win') {
    //     //draw one last time!
    //     gameState = 'postplay';
    //     draw();
    // }
}


function keyDownHandler(e) {

    if(e.keyCode == 39) {
        rightPressed = true;
    }
    else if(e.keyCode == 37) {
        leftPressed = true;
    } else if(e.keyCode === 65){
        //"a" key. toggle autopilot!
        onAutopilot = !onAutopilot;
    } else if(e.keyCode === 80){
        //"p" key. toggle pause!
        isPaused = !isPaused;
        if(!isPaused) {
            draw();
        }
    } else if(e.keyCode === 32){
        //spacebar key. launch the ball!
        ball.isLaunched = true;
    }
}

function keyUpHandler(e) {
    if(e.keyCode == 39) {
        rightPressed = false;
    }
    else if(e.keyCode == 37) {
        leftPressed = false;
    }
}

function mouseMoveHandler(e) {
    if(onAutopilot && e.human !== false){
        return;
    }
    
    var relativeX = e.clientX - canvas.offsetLeft;
    if(relativeX > 0 && relativeX < canvas.width) {

        let newPaddleX = relativeX - paddle.width / 2;

        if(relativeX < paddle.width / 2 ) {
            newPaddleX =  0; 
        }

        if(relativeX > canvas.width - (paddle.width / 2)){
            newPaddleX = canvas.width - paddle.width;
        }

        paddle.x = newPaddleX;
    }
}


function checkForWin(){
    //finding if all the bricks are destroyed
    var output = bricks.some(function(col){
        return col.some(function(brick){
            return brick.status === 1;
        });
    });
    return !output;
}

function brickCollisionDetection() {
    loopThroughBricks(function(columnIndex, rowIndex){
        var b = bricks[columnIndex][rowIndex];

        if(b.status !== 1) {
            //brick not there, don't do collision detection
            return;
        }

        /*
            The x position of the ball is greater than the x position of the brick.
            The x position of the ball is less than the x position of the brick plus its width.
            The y position of the ball is greater than the y position of the brick.
            The y position of the ball is less than the y position of the brick plus its height.
        */
        if ( 
            x > b.x && 
            x < b.x+brickWidth && 
            y > b.y && 
            y < b.y+brickHeight 
        ) {
            //we've detected a collision!

            //reverse the ball's direction
            dy = -dy;
            ball.decayVelocity();

            //DESTROY the brick 
            b.status = 0;

            //increment the score
            switch (b.worth){
                case 'blue':
                    ++score;
                    break;
                case 'green':
                    score = score + 2;
                    break;
                case 'gold': 
                    score = score + 3;
                    break;
                default:
                    ++score;
            }

            //detect win condition
            if(checkForWin()){
                gameState = 'win';
            }
        }

    });
}

function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Score: " + score, 8, 20);
}

function drawLives(){
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Lives: " + lives, canvas.width - 65, 20);
}

function drawGameState() {
    ctx.font= "16px Arial";
    ctx.fillStyle = "#0095DD";

    let message = '';

    if(gameState === 'inplay'){
        message = 'Ball in play! Good luck.';
    } else if(lives === 0){
        message = 'You lost. Refresh to play again!';
    } else {
        message = 'Congrats! Refresh to play again!';
    }
    ctx.fillText(message, 100, 20);
}


document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

document.addEventListener("mousemove", mouseMoveHandler, false);


draw();
