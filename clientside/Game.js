function Game(canvas, ctx, score = 0, lives = 3, isPaused = false){
    this.canvas = canvas;
    this.ctx = ctx;
    this.score = score;
    this.maxPossibleScore = -1;
    this.isPaused = isPaused;
    this.lives = lives;

    this.powerups = [];
    this.bricks = [];

    this.paddle = {};
    this.ball = {};

}