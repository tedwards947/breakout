


var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');



var INITIAL_DX_MAGNITUDE = 4;
var INITIAL_DY_MAGNITUDE = 4;
var INITIAL_DX = INITIAL_DX_MAGNITUDE;
var INITIAL_DY = -INITIAL_DY_MAGNITUDE;

const BALL_RADIUS = 10;
const BALL_COLOR = '#000000';
const ball = new Ball(0, 0, INITIAL_DX, INITIAL_DY, BALL_RADIUS, BALL_COLOR);

const PADDLE_HEIGHT = 20;
const PADDLE_WIDTH = 100;
const paddle = new Paddle(0, PADDLE_HEIGHT, PADDLE_WIDTH);



let isFloorBlocked = false;



var brickRowCount = 4;
var brickColumnCount = 7; //7
var brickWidth = 75;
var brickHeight = 20;
var brickPadding = 10;
var brickOffsetTop = 30;
var brickOffsetLeft = 30;

var possibleBrickColors = {
    blue: '#0095DD',
    green: '#00FF00',
    gold: '#f0e026',
    purple: '#663399'
};

var bricks = [];

const GRAVITY = 0.02;


var rightPressed = false;
var leftPressed = false;
var isPaused = false;
var onAutopilot = false;
var doDisplayDebugInfo = false;


var powerups = [];

var lives = 3;

var gameState = 'inplay';

var score = 0;
var calculatedMaximumScore = 0;


//we want the chances of any given brick being gold to be rare and dependant on the size of the brick array
var chanceOfBrickBeingGold = 3 / (brickRowCount * brickColumnCount);

var chanceOfBrickBeingPurple = 1 / (brickRowCount * brickColumnCount);



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
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}




//INIT BRICKS ARRAY
bricks = Array.from(Array(brickColumnCount)).map(function(j, columnIndex){
    return Array.from(Array(brickRowCount)).map(function(l, rowIndex){
        function getBrickWorth(){
            const randomNumber = Math.random();

            if(chanceOfBrickBeingPurple >= randomNumber){
                //it passes the test. make it purple!
                return 'purple';
            } else if(chanceOfBrickBeingGold >= randomNumber){
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

        const brickWorth = getBrickWorth();


        return {
            x:0, 
            y:0,
            width: brickWidth,
            height: brickHeight,
            status: 1,
            worth: brickWorth,
            color: possibleBrickColors[brickWorth],
            type: 'brick'
        }
    });
});


function drawBrick(x, y, width, height, color){
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();   
}
function drawBricks(){
    loopThroughBricks(function(columnIndex, rowIndex){
        const brick = bricks[columnIndex][rowIndex];

        if(brick.status === 1) {
            var brickX = (columnIndex*(brickWidth+brickPadding))+brickOffsetLeft;
            var brickY = (rowIndex*(brickHeight+brickPadding))+brickOffsetTop;
            bricks[columnIndex][rowIndex].x = brickX;
            bricks[columnIndex][rowIndex].y = brickY;
            bricks[columnIndex][rowIndex].id = `brick${brickX}${brickY}`;

            drawBrick(brickX, brickY, brickWidth, brickHeight, brick.color);
        }
    });
}


function drawPaddle() {
    const pathPoints = paddle.getPathPoints();

    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    pathPoints.forEach(function(point){
        ctx.lineTo(point.x, point.y);
    });

    ctx.fillStyle = paddle.color;
    ctx.fill();
    ctx.closePath();

}


function drawBall() {
  
    // const animationLevel = getAnimatedOpacity('ball', 25);
    // console.log('animationlevel', animationLevel);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
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
        clientX: ball.x + canvas.offsetLeft
    };

    mouseMoveHandler(fakeEventObject);
}

function bounceBallOffWallsOrPaddle(){

    const isSideHit = (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius);
    const isTopHit = (ball.y + ball.dy < ball.radius);
    const isBottomHit = (ball.y + ball.dy > canvas.height - ball.radius);

    const paddleHitReflectedVelocity = paddle.getReflectedVelocity(ball);
    const isPaddleHit = !!paddleHitReflectedVelocity;

    if(isSideHit) {
        ball.dx = -ball.dx;
    }
     else if(isTopHit) {
        //bounce
        ball.dy = -ball.dy;
    } 
    else if(isPaddleHit){
        //simple reflection
        ball.dx = paddleHitReflectedVelocity.dx;
        ball.dy = paddleHitReflectedVelocity.dy;
    } else if(isBottomHit && isFloorBlocked){
        //allow a bounce if the floor is blocked! lucky u.
        ball.dy = -ball.dy;
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


function dropPowerup(brick){
    var pu = new Powerup(brick.x + brick.width / 2, brick.y + brick.height, 0, 1);
    powerups.push(pu);
}
function drawPowerups(){
    powerups.forEach(function(pu, idx){
        //draw it
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI*2);
        ctx.fillStyle = pu.color;
        ctx.fill();
        ctx.closePath();
    
        //check for paddle hits and check if it's gone off the screen
        const didCollide = !!paddle.getReflectedVelocity(pu);
        
        if(pu.y >= canvas.height || didCollide){
            powerups.splice(idx, 1);
            if(didCollide){
                pu.action();
            }
            return;
        }

        //animate it
        pu.x += pu.dx;
        pu.y += pu.dy;
    });
}

function determinePaddleVelocity(){
    //use to determine ball boosting speed
    const paddleVelocity = paddle.previousFrameX - paddle.x;

    paddle.previousFrameX = paddle.x;
    paddle.velocity = paddleVelocity;
}

function resetBall(){
    ball.isLaunched = false;

    //reset initial velocity
    ball.dx = INITIAL_DX;
    ball.dy = INITIAL_DY;

    //fix the position of the ball to the paddle
    ball.x = paddle.x + (paddle.width / 2);
    ball.y = canvas.height - paddle.height - ball.radius;
}

function draw() {
    if(isPaused){
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPowerups();
    drawPaddle();
    drawLives();
    drawScore();
    drawGameState();
    animatePhantomObjects();

    if(doDisplayDebugInfo){
        updateDebugInfo();
        drawVelocityMarkers();
    }


    if(onAutopilot){
        doAutopilotInstructions();
    }

    determinePaddleVelocity();

    brickCollisionDetection();
    bounceBallOffWallsOrPaddle();



    if(ball.isLaunched){
        //if the ball is launched, calculate the ball's next position.
        ball.x += ball.dx;
        ball.y += ball.dy;

        // ball.dy = ball.dy + GRAVITY;

        if(ball.dx === 0 && ball.dy === 0){
            resetBall();
        }
    } else {
        //fix the position of the ball to the paddle
        resetBall();
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
 
    if(lives <= 0 || checkForWin()){
        ball.dx = 0;
        ball.dy = 0;
    }
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
    } else if(e.keyCode === 68){
        //"d" key. toggle debug
        doDisplayDebugInfo = !doDisplayDebugInfo;
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


function animatePhantomBrick(brickObj, opacity){
    //convert hex to rgb
    const rgbColor = hexToRgb(brickObj.color);

    //add the 'a' to rgb
    const newColor = `rgba(${rgbColor.r},${rgbColor.g},${rgbColor.b},${opacity})`;
    drawBrick(brickObj.x, brickObj.y, brickObj.width, brickObj.height, newColor);
}

const phantomObjects = [];
function animatePhantomObjects(){
    phantomObjects.forEach(function(obj, idx, arr){
        switch (obj.type){
            case 'brick':
                const objId = obj.id;
                const opacity = getAnimatedOpacity(objId, 10);
                if(opacity > 0){
                    animatePhantomBrick(obj, opacity);
                } else {
                    //no animating to do, the opacity is already 0. Remove it!
                    arr.splice(idx, 1);
                }
            break;
            default:
                return;
        }
    });
}
function addPhantomObject(obj){
    phantomObjects.push(obj);
}



function detectFaceCollision (brick){
    const rightOfBrickBorder = ball.x + ball.radius > brick.x;
    const leftOfBrickBorder = ball.x - ball.radius < brick.x + brick.width;
    const belowBrick = ball.y + ball.radius > brick.y;
    const aboveBrick = ball.y - ball.radius < brick.y + brick.height;

    /*
        The x position of the ball is greater than the x position of the brick.
        The x position of the ball is less than the x position of the brick plus its width.
        The y position of the ball is greater than the y position of the brick.
        The y position of the ball is less than the y position of the brick plus its height.
    */
    return ( 
        rightOfBrickBorder && 
        leftOfBrickBorder && 
        belowBrick && 
        aboveBrick 
    );
}
function detectSideCollision(brick){
    /*
        write commentl ol
    */
    const leftOfBrick  = ball.x + ball.radius >= brick.x;
    const rightOfBrick = ball.x - ball.radius <= brick.x + brick.width;
    const belowBrick   = ball.y - ball.radius >= brick.y;
    const aboveBrick   = ball.y + ball.radius <= brick.y + brick.height;


    return ( 
        leftOfBrick && 
        rightOfBrick && 
        belowBrick && 
        aboveBrick 
    );

    /*
    Gotta be 
        at the left border of the brick
        at the right border of the brick
        between the top and the bottom
    */

 

}

function brickCollisionDetection() {
    loopThroughBricks(function(columnIndex, rowIndex){
        var b = bricks[columnIndex][rowIndex];

        if(b.status !== 1) {
            //brick not there, don't do collision detection
            return;
        }

        const isFaceCollision = detectFaceCollision(b);
        const isSideCollision = detectSideCollision(b);

        if(isFaceCollision || isSideCollision) {
            //we've detected a collision!

            //reverse the ball's direction
            if(isFaceCollision){
                //if it's a face collision, reverse the y direction
                ball.dy = -ball.dy;
            } else if(isSideCollision){
                //if it's a face collision, reverse the x direction
                ball.dx = -ball.dx;
            }

            // ball.decayVelocityOnBounce();

            //DESTROY the brick 
            b.status = 0;

            addPhantomObject(b);

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
                case 'purple':
                    dropPowerup(b);
                    break;
                default:
                    ++score;
            }

            //detect win condition
            // if(checkForWin()){
            //     gameState = 'win';
            // }
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


function updateDebugInfo(){
    document.getElementById('velocity').innerText = `(${ball.dx},${ball.dy}`;
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
        roundRect(ctx, 120, 100, 20, ball.dx * 5, 0, 'yellow', 0);
        ctx.closePath();
    
        //draw a graph of ball Y velocity
        ctx.beginPath();
        roundRect(ctx, 140, 100, 20, ball.dy * 5, 0, 'green', 0);
        ctx.closePath();
    }


document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

document.addEventListener("mousemove", mouseMoveHandler, false);


draw();