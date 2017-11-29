function Paddle(x = 0, height = 20, width = 100, color = '#0095DD', radius = 5){
    this.x = x;
    this.y = game.canvas.height;
    this.height = height;
    this.width = width;
    this.color = color;
    this.radius = radius;

    //used to make sure that we don't do collisions too frequently
    this.wasJustHit = false;

    this.velocity = 0;

    //the previous frame's position. used to calculate velocity
    this.previousFrameX = 0;

    this.type = 'paddle';

    const pathPoints = this.getPathPoints();
    this.shape = new SAT.Polygon(new SAT.Vector(0,0), pathPoints.map(function(pt){
        return new SAT.Vector(pt.x, pt.y);
    }));
}
Paddle.prototype.move = function move(x){
    //constant here because the paddle can't move in the Y direction
    const y = this.y;
    this.x = x;

    this.shape.setOffset( new SAT.Vector(x, 0))
};
Paddle.prototype.getPathPoints = function getPathPoints(){
    /*
        paddle trapezoid diagram
                  A 
          c________________d
    C     /                \    D
       b /                  \e
        |                    |
       a|____________________|f
                  B

        |--|--------------|--|           
        i   j             k  l
          0       1         2

       Calculations [x, y]
        a: [paddle.x, canvas.height]
        b: [paddle.x, canvas.height - (paddle.height / 2)]
        c: [paddle.x + (paddle.width / 5), canvas.height - paddle.height]
        d: [paddle.x + paddle.width - (paddle.width / 5), canvas.height - paddle.height]
        e: [paddle.x + paddle.width, (paddle.height / 2)]
        f: [paddle.x + paddle.width, paddle.width]
        g: (same as a, so that we go back to home)

    */

    const canvas = game.canvas;
    return [
        {x: this.x, y: canvas.height}, //a
        {x: this.x, y: canvas.height - (this.height / 2)}, //b
        {x: this.x + (this.width / 5), y: canvas.height - this.height}, //c
        {x: this.x + this.width - (this.width / 5), y: canvas.height - this.height}, //d
        {x: this.x + this.width, y: canvas.height - (this.height / 2)}, //e
        {x: this.x + this.width, y: canvas.height}, //f
        {x: this.x, y: canvas.height} //g
    ];
};
Paddle.prototype.getReflectedVelocity = function getReflectedVelocity(obj){
    //returns new velocity based on angle
    const canvas = game.canvas;

    //dont do any of this if the ball isn't anywhere near the paddle
    if(canvas.height - this.height >= obj.y + obj.radius){
        return false;
    }

    const pathPoints = this.getPathPoints();

    const ballCircle = new SAT.Circle(new SAT.Vector(obj.x, obj.y), obj.radius);
    const poly = this.shape;
  
    //overlays the poly in SAT
    game.ctx.beginPath();
    game.ctx.moveTo(this.x, this.y);
    poly.calcPoints.forEach(function(pt){
        game.ctx.lineTo(pt.x, pt.y);
    });
    game.ctx.stroke();
    game.ctx.closePath();
    
    const response = new SAT.Response();

    const isCollision = SAT.testPolygonCircle(poly, ballCircle, response);

    if(isCollision){
        //accepted answer! https://gamedev.stackexchange.com/questions/23672/determine-resulting-angle-of-wall-collision
        const overlapVector = response.overlapN;

        const velocityVector = new SAT.Vector(obj.dx, obj.dy);

        const unitNormalVector = new SAT.Vector(overlapVector.x, overlapVector.y).normalize().clone();

        const dotProduct = velocityVector.clone().dot(unitNormalVector) * 2;
        const scaledNormal = unitNormalVector.clone().scale(dotProduct, dotProduct);
        const answer = velocityVector.clone().sub(scaledNormal);

        return {
            dx: answer.x,
            dy: answer.y
        };
    } else{
        return false;
    }
};
Paddle.prototype.updatePaddleVelocity = function updatePaddleVelocity(){
    //not used yet for more than debugging things; may come in handy later
    const velocity = this.previousFrameX - this.x;
    
    this.previousFrameX = this.x;
    this.velocity = velocity;
};

