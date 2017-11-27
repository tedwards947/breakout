


function Paddle(x = 0, height = 20, width = 100, color = '#0095DD', radius = 5){
    this.x = x;
    this.height = height;
    this.width = width;
    this.color = color;
    this.radius = radius;


    this.velocity = 0;

    //the previous frame's position. used to calculate velocity
    this.previousFrameX = 0;


    this.type = 'paddle';
}
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


    //dont do any of this if the ball isn't anywhere near the paddle
    if(canvas.height - this.height >= obj.y + obj.radius){
        return false;
    }

    const pathPoints = this.getPathPoints();


    const ballCircle = new SAT.Circle(new SAT.Vector(obj.x, obj.y), obj.radius);
    const poly = new SAT.Polygon(new SAT.Vector(0,0), pathPoints.map(function(pt){
        return new SAT.Vector(pt.x, pt.y);
    }));


    //overlays the poly in SAT
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    poly.calcPoints.forEach(function(pt){
        ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
    ctx.closePath();
    
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
        // console.log('dx, dy', dx, dy, 'old dx, dy', answer.x, answer.yas)
    } else{
        return false;
    }
};

