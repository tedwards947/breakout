function Game(canvas, ctx, score = 0, lives = 3){
    this.canvas = canvas;
    this.ctx = ctx;
    this.score = score;

    this.lives = lives;

    this.powerups = [];
    this.bricks = [];

    this.paddle = {};
    this.ball = {};
    
}