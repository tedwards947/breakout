
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

const game = new Game(canvas, ctx, 0, 3);


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
var brickColumnCount = 7; 
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
    const isPaddleHit = !!paddleHitReflectedVelocity && !paddle.wasJustHit;

    if(isSideHit) {
        ball.dx = -ball.dx;
    }
     else if(isTopHit) {
        //bounce
        ball.dy = -ball.dy;
    } 
    else if(isPaddleHit){
        paddle.wasJustHit = true;
    
        ball.dx = paddleHitReflectedVelocity.dx;
        ball.dy = paddleHitReflectedVelocity.dy;

        //return here so we don't reset paddle.wasJustHit
        return;
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
            ball.reset();
        }
    }

    paddle.wasJustHit = false;
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
        paddle.updatePaddleVelocity();
        drawVelocityMarkers();
    }


    if(onAutopilot){
        doAutopilotInstructions();
    }


    brickCollisionDetection();
    bounceBallOffWallsOrPaddle();


    if(ball.isLaunched){
        //if the ball is launched, calculate the ball's next position.
        ball.x += ball.dx;
        ball.y += ball.dy;

        if(ball.dx === 0 && ball.dy === 0){
            ball.reset();
        }
    } else {
        //fix the position of the ball to the paddle
        ball.reset();
    }

    
    //animate the paddle if keyboard controls are used
    if(rightPressed && paddle.x < canvas.width - paddle.width) {
        paddle.move(paddle.x += 7);
    }
    else if(leftPressed && paddle.x > 0) {
        paddle.move(paddle.x -= 7);
    }

    //continue the game loop
    if(!isPaused){
        requestAnimationFrame(draw);
    }
    
    const hasNoLivesLeft = (lives <= 0 );
    const hasWon = checkForWin();
    if(hasNoLivesLeft || hasWon){
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

        paddle.move(newPaddleX);
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



function detectBrickCollision (brick){
    //short circuit if the ball isn't equal or above the lowest Y value
    if (brick.y + brick.height <= ball.y - 10) {
        return false;
    }

    const ballCircle = ball.getSATCircle()//new SAT.Circle(new SAT.Vector(ball.x, ball.y), ball.radius);
    const brickPolygon = new SAT.Box(new SAT.Vector(brick.x, brick.y), brick.width, brick.height).toPolygon();

    const response = new SAT.Response();

    const isCollision = SAT.testPolygonCircle(brickPolygon, ballCircle, response);

    if(isCollision){
        const overlapVector = response.overlapN;
        
        const velocityVector = new SAT.Vector(ball.dx, ball.dy);

        const unitNormalVector = new SAT.Vector(overlapVector.x, overlapVector.y).normalize().clone();


        const dotProduct = velocityVector.clone().dot(unitNormalVector) * 2;
        const scaledNormal = unitNormalVector.clone().scale(dotProduct, dotProduct);
        const answer = velocityVector.clone().sub(scaledNormal);

        return {
            dx: answer.x,
            dy: answer.y
        };
    } else {
        return false;
    }
}

function brickCollisionDetection() {
    loopThroughBricks(function(columnIndex, rowIndex){
        var b = bricks[columnIndex][rowIndex];

        if(b.status !== 1) {
            //brick not there, don't do collision detection
            return;
        }


        const brickCollisionResultantBallVelocityVector = detectBrickCollision(b);

        if(brickCollisionResultantBallVelocityVector){

            ball.dx = brickCollisionResultantBallVelocityVector.dx;
            ball.dy = brickCollisionResultantBallVelocityVector.dy;

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
    //REFACTOR THIS TO USE ctx.rect instead!


        // //draw positive velocity graph
        // ctx.beginPath();
        // roundRect(ctx, 95, 50, 5, 50, 0, "black", 0);
        // ctx.closePath();
        // //draw negative velocity graph
        // ctx.beginPath();
        // roundRect(ctx, 95, 100, 5, 50, 0, "red", 0);
        // ctx.closePath();
    
        // //draw a graph of paddle velocity!
        // ctx.beginPath();
        // roundRect(ctx, 100, 100, 20, paddle.velocity, 0, paddle.color, 0);
        // ctx.closePath();
    
        // //draw a graph of ball X velocity
        // ctx.beginPath();
        // roundRect(ctx, 120, 100, 20, ball.dx * 5, 0, 'yellow', 0);
        // ctx.closePath();
    
        // //draw a graph of ball Y velocity
        // ctx.beginPath();
        // roundRect(ctx, 140, 100, 20, ball.dy * 5, 0, 'green', 0);
        // ctx.closePath();
    }


document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

document.addEventListener("mousemove", mouseMoveHandler, false);


draw();