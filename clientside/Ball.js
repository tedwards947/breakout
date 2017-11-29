
/**
 * The constructor for a Ball
 * @param {Number} x Initial x position
 * @param {Number} y Initial y position
 * @param {Number} dx Initial x velocity
 * @param {Number} dy Initial y velocity
 */
function Ball(x = 0, y = 0, dx = 4, dy = -4, radius = 10, color = '#000000') {
    //setting
    this.x = x;
    this.y = y;

    this.dx = dx;
    this.dy = dy;

    //these initial vars are used when we reset the ball
    this.initialX = x;
    this.initialY = y;
    this.initialDx = dx;
    this.initialDy = dy;

    this.radius = radius;
    this.color = color;

    //defaults
    this.isLaunched = false;
    this.type = 'ball';

}
Ball.prototype.decayVelocityOnBounce = function decayVelocityOnBounce(){
    //degrade the velocity due to bounces
    const dxSign = Math.sign(this.dx);
    const dySign = Math.sign(this.dy);

    const absdx = Math.abs(this.dx);
    const absdy = Math.abs(this.dy);

    if(absdx > INITIAL_DX_MAGNITUDE){
        this.dx = dxSign * (absdx - 1);
    } 
    if(absdy > INITIAL_DY_MAGNITUDE){
        this.dy = dySign * (absdy - 1);
    }
};
Ball.prototype.getSATCircle = function getSATCircle(){
    return new SAT.Circle(new SAT.Vector(ball.x, ball.y), ball.radius);
};
Ball.prototype.reset = function reset(){
    this.isLaunched = false;
    
    //reset initial velocity
    this.dx = this.initialDx;
    this.dy = this.initialDy;

    //fix the position of the ball to the paddle
    this.x = paddle.x + (paddle.width / 2);
    this.y = canvas.height - paddle.height - this.radius;
};