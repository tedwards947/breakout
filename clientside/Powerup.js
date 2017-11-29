


const POWERUP_TYPES = [
    {
        type: 'invisibleFloor',
        color: 'green',
        action: function(){
            //the floor is not lava
            isFloorBlocked = true;

            game.canvas.style.borderBottom = '3px dashed red';

            setTimeout(function(){
                game.canvas.style.borderBottom = '0';
                isFloorBlocked = false;
            }, 5000);
        }
    },
    {
        type: 'ballSizeIncrease',
        color: 'goldenrod',
        action: function(){
            //double the width of the ball

            game.ball.radius = 20;
            setTimeout(function(){
                game.ball.radius = 10;
            }, 15000);
        }
    },
    {
        type: 'freeBall',
        color: 'orange',
        action: function(){
            //give  another life
            game.addLife(1);
        }
    }
];
function Powerup(x, y, dx, dy, radius = 4, color = 'blue'){
    const randomPowerupIndex = Math.floor(Math.random() * POWERUP_TYPES.length);
    const selectedPowerup = POWERUP_TYPES[randomPowerupIndex];
    this.type = selectedPowerup.type;
    this.action = selectedPowerup.action;
    this.color = selectedPowerup.color;

    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.radius = radius;
   
}

// function InvisibleFloor(x, y, dx, dy){

// }
// InvisibleFloor.prototype = Obbject.create(Person.prototype);
// InvisibleFloor.prototype.const




/*

Good pickups:

- Increase the size of the ball
- Increase the size of the paddle
- A bomb - destroys bricks in a certain radius
- Invisible floor - creates a floor temporarily, so you cannot lose
- Points++ - doubles the points you get from hitting a brick
- Freeball - extra life
- Double ball (or Douball even) - throws another ball in
- Gravball - the ball 'attracts' bricks (REF: Electric bubble in Sonic III)

Bad pickups:

- Decrease size of ball
- Decrease size of paddle
- Black hole - ball can fall into it
- Disappearing wall - one of the entire walls disappears temporarily
- Points-- - half the points for hitting a brick
- Repeller - the ball 'repels' bricks away
- Invisiball - you can't see the ball temporarily
- Invisibrick - you can't see the bricks temporarily

*/