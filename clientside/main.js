
var _canvas = document.getElementById('canvas');
var _ctx = canvas.getContext('2d');

const game = new Game(_canvas, _ctx, 0, 3);


var INITIAL_DX_MAGNITUDE = 4;
var INITIAL_DY_MAGNITUDE = 4;
var INITIAL_DX = INITIAL_DX_MAGNITUDE;
var INITIAL_DY = -INITIAL_DY_MAGNITUDE;

const BALL_RADIUS = 10;
const BALL_COLOR = '#000000';
game.ball = new Ball(0, 0, INITIAL_DX, INITIAL_DY, BALL_RADIUS, BALL_COLOR);

const PADDLE_HEIGHT = 20;
const PADDLE_WIDTH = 100;
game.paddle = new Paddle(0, PADDLE_HEIGHT, PADDLE_WIDTH);



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


var rightPressed = false;
var leftPressed = false;
var doDisplayDebugInfo = false;

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
game.bricks = Array.from(Array(brickColumnCount)).map(function(j, columnIndex){
    return Array.from(Array(brickRowCount)).map(function(l, rowIndex){
        function getBrickWorth(){
            const randomNumber = Math.random();

            if(chanceOfBrickBeingPurple >= randomNumber){
                //it passes the test. make it purple!
                return 'purple';
            } else if(chanceOfBrickBeingGold >= randomNumber){
                //it passes the test. make it worth gold!

                game.maxPossibleScore += 3;
                return 'gold';
            } else if(rowIndex <= 1){
                //make all the bricks green which are in the first two rows

                game.maxPossibleScore += + 2;
                return 'green';
            }
            else {
                game.maxPossibleScore += + 1;
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
    game.ctx.beginPath();
    game.ctx.rect(x, y, width, height);
    game.ctx.fillStyle = color;
    game.ctx.fill();
    game.ctx.closePath();   
}
function drawBricks(){
    loopThroughBricks(function(columnIndex, rowIndex){
        const brick = game.bricks[columnIndex][rowIndex];

        if(brick.status === 1) {
            var brickX = (columnIndex*(brickWidth+brickPadding))+brickOffsetLeft;
            var brickY = (rowIndex*(brickHeight+brickPadding))+brickOffsetTop;
            game.bricks[columnIndex][rowIndex].x = brickX;
            game.bricks[columnIndex][rowIndex].y = brickY;
            game.bricks[columnIndex][rowIndex].id = `brick${brickX}${brickY}`;

            drawBrick(brickX, brickY, brickWidth, brickHeight, brick.color);
        }
    });
}


function drawPaddle() {
    const pathPoints = game.paddle.getPathPoints();

    game.ctx.beginPath();
    game.ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    pathPoints.forEach(function(point){
        game.ctx.lineTo(point.x, point.y);
    });

    game.ctx.fillStyle = game.paddle.color;
    game.ctx.fill();
    game.ctx.closePath();

}


function drawBall() {  
    const ball = game.ball;

    game.ctx.beginPath();
    game.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
    game.ctx.fillStyle = ball.color;
    game.ctx.fill();
    game.ctx.closePath();
}

function doAutopilotInstructions() {
    //pilot the ship for the human!

    const fakeEventObject = {
        human: false,
        clientX: game.ball.x + game.canvas.offsetLeft
    };

    mouseMoveHandler(fakeEventObject);
}

function bounceBallOffWallsOrPaddle(){
    const ball = game.ball;
    const canvas = game.canvas; 
    const paddle = game.paddle;

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
        --game.lives;

        if(game.lives !== 0){
            ball.reset();
        }
    }

    paddle.wasJustHit = false;
}

function dropPowerup(brick){
    var pu = new Powerup(brick.x + brick.width / 2, brick.y + brick.height, 0, 1);
    game.powerups.push(pu);
}
function drawPowerups(){
    game.powerups.forEach(function(pu, idx){
        //draw it
        game.ctx.beginPath();
        game.ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI*2);
        game.ctx.fillStyle = pu.color;
        game.ctx.fill();
        game.ctx.closePath();
    
        //check for paddle hits and check if it's gone off the screen
        const didCollide = !!game.paddle.getReflectedVelocity(pu);
        
        if(pu.y >= game.canvas.height || didCollide){
            game.powerups.splice(idx, 1);
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
    if(game.isPaused){
        return;
    }

    const ball = game.ball;
    const paddle = game.paddle;

    game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
    drawBricks();
    drawBall();
    drawPowerups();
    drawPaddle();
    drawLives();
    drawScore();

    animatePhantomObjects();

    if(doDisplayDebugInfo){
        updateDebugInfo();
        game.paddle.updatePaddleVelocity();
        drawVelocityMarkers();
    }


    if(game.onAutopilot){
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
    if(rightPressed && paddle.x < game.canvas.width - paddle.width) {
        paddle.move(paddle.x += 7);
    }
    else if(leftPressed && paddle.x > 0) {
        paddle.move(paddle.x -= 7);
    }

    //continue the game loop
    if(!game.isPaused){
        requestAnimationFrame(draw);
    }
    
    game.calculateGameState();
    drawGameState();
    if(game.hasWon || game.hasLost){
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
        game.onAutopilot = !game.onAutopilot;
    } else if(e.keyCode === 80){
        //"p" key. toggle pause!
        game.isPaused = !game.isPaused;
        if(!game.isPaused) {
            draw();
        }
    } else if(e.keyCode === 32){
        //spacebar key. launch the ball!
        game.ball.isLaunched = true;
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
    if(game.onAutopilot && e.human !== false){
        return;
    }
    
    var relativeX = e.clientX - game.canvas.offsetLeft;
    if(relativeX > 0 && relativeX < game.canvas.width) {

        let newPaddleX = relativeX - game.paddle.width / 2;

        if(relativeX < game.paddle.width / 2 ) {
            newPaddleX =  0; 
        }

        if(relativeX > game.canvas.width - (game.paddle.width / 2)){
            newPaddleX = game.canvas.width - game.paddle.width;
        }

        game.paddle.move(newPaddleX);
    }
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
    if (brick.y + brick.height <= game.ball.y - 10) {
        return false;
    }

    const ballCircle = game.ball.getSATCircle();
    const brickPolygon = new SAT.Box(new SAT.Vector(brick.x, brick.y), brick.width, brick.height).toPolygon();

    const response = new SAT.Response();

    const isCollision = SAT.testPolygonCircle(brickPolygon, ballCircle, response);

    if(isCollision){
        const overlapVector = response.overlapN;
        
        const velocityVector = new SAT.Vector(game.ball.dx, game.ball.dy);

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
        var b = game.bricks[columnIndex][rowIndex];

        if(b.status !== 1) {
            //brick not there, don't do collision detection
            return;
        }


        const brickCollisionResultantBallVelocityVector = detectBrickCollision(b);

        if(brickCollisionResultantBallVelocityVector){

            game.ball.dx = brickCollisionResultantBallVelocityVector.dx;
            game.ball.dy = brickCollisionResultantBallVelocityVector.dy;

            //DESTROY the brick 
            b.status = 0;

            addPhantomObject(b);

            //increment the score
            switch (b.worth){
                case 'blue':
                    ++game.score;
                    break;
                case 'green':
                    game.score += 2;
                    break;
                case 'gold': 
                    game.score += 3;
                    break;
                case 'purple':
                    dropPowerup(b);
                    break;
                default:
                    ++game.score;
            }

        }

    });
}

function drawScore() {
    game.ctx.font = "16px Arial";
    game.ctx.fillStyle = "#0095DD";
    game.ctx.fillText("Score: " + game.score, 8, 20);
}

function drawLives(){
    game.ctx.font = "16px Arial";
    game.ctx.fillStyle = "#0095DD";
    game.ctx.fillText("Lives: " + game.lives, game.canvas.width - 65, 20);
}

function drawGameState() {
    game.ctx.font= "16px Arial";
    game.ctx.fillStyle = "#0095DD";

    let message = '';


    if(!game.hasWon && !game.hasLost){
        message = 'Ball in play! Good luck.';
    } else if(game.hasLost){
        message = 'You lost. Refresh to play again!';
    } else if(game.hasWon) {
        message = 'Congrats! Refresh to play again!';
    }
    game.ctx.fillText(message, 100, 20);
}


function updateDebugInfo(){
    document.getElementById('velocity').innerText = `(${game.ball.dx},${game.ball.dy}`;
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