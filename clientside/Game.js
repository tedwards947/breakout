const SCORE_STREAK_TIME = 1000;
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

    this.scoreStreakCounter = 1;
    this.scoreStreakIntervalId = null;
}
Game.prototype.addLife = function addLife(deltaLife){
    this.lives = this.lives + deltaLife;

    if(this.lives <= 0){
        this.lives = 0;
    }
};
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
Game.prototype.scoreStreak = function scoreStreak(){
    clearTimeout(this.scoreStreakIntervalId);
    this.scoreStreakIntervalId = setTimeout(() =>{
        //the timeout has ended, reset!
        this.scoreStreakCounter = 1;
        this.scoreStreakIntervalId = null;
    }, SCORE_STREAK_TIME);
};
Game.prototype.addScore = function addScore(deltaScore){
    if(this.scoreStreakIntervalId){
        //there's a streak interval going
        //multiply?
        ++this.scoreStreakCounter;
        this.scoreStreak();
    } else{
        this.scoreStreak();
    }

    if(deltaScore > 0){
        deltaScore = deltaScore * this.scoreStreakCounter;
    }
    this.score = this.score + deltaScore;
};