function Game(canvas, ctx, score = 0, lives = 3, isPaused = false, onAutopilot = false){
    this.canvas = canvas;
    this.ctx = ctx;
    this.score = score;
    this.maxPossibleScore = -1;
    this.isPaused = isPaused;
    this.onAutopilot = onAutopilot;
    this.lives = lives;

    this.powerups = [];
    this.bricks = [];

    this.paddle = {};
    this.ball = {};

    this.hasWon = false;
    this.hasLost = false;

}
Game.prototype.calculateGameState = function calculateGameState(){
    this.hasWon = this.checkForWin();
    this.hasLost = this.checkForLoss();
};
Game.prototype.checkForWin = function checkForWin(){
    let count = 0;
    //finding if all the bricks are destroyed
    var output = this.bricks.some(function(col){
        ++count;
        return col.some(function(brick){
            ++count;
            return brick.status === 1;
        });
    });
    return !output;
};
Game.prototype.checkForLoss = function checkForLoss(){
    return this.lives <= 0;
};