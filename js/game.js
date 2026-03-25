const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const hud = document.getElementById('hud');
const scoreDisplay = document.getElementById('current-score');
const sizeDisplay = document.getElementById('current-size');
const finalScore = document.getElementById('final-score');
const finalSize = document.getElementById('final-size');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

// 游戏常量
const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;
const PLAYER_START_RADIUS = 15;
const ENEMY_SPAWN_RATE = 0.02; // 每帧生成概率
const MAX_ENEMIES = 15;

// 游戏状态
let gameState = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let player;
let enemies = [];
let keys = {};

// 初始化 Canvas 尺寸
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// 鱼类基类
class Fish {
    constructor(x, y, radius, color, speed, direction) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.direction = direction; // 1 为右，-1 为左
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 身体
        ctx.beginPath();
        ctx.fillStyle = this.color;
        // 绘制椭圆身体
        ctx.ellipse(0, 0, this.radius * 1.5, this.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        // 尾巴
        ctx.beginPath();
        const tailX = -this.direction * this.radius * 1.5;
        ctx.moveTo(tailX, 0);
        ctx.lineTo(tailX - this.direction * this.radius, -this.radius);
        ctx.lineTo(tailX - this.direction * this.radius, this.radius);
        ctx.fill();
        ctx.closePath();

        // 眼睛
        ctx.beginPath();
        ctx.fillStyle = 'white';
        const eyeX = this.direction * this.radius * 0.8;
        ctx.arc(eyeX, -this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.arc(eyeX, -this.radius * 0.3, this.radius * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.restore();
    }
}

// 玩家类
class Player extends Fish {
    constructor() {
        super(GAME_WIDTH / 2, GAME_HEIGHT / 2, PLAYER_START_RADIUS, '#FF851B', 5, 1);
    }

    update() {
        if (keys['ArrowUp'] || keys['w']) this.y -= this.speed;
        if (keys['ArrowDown'] || keys['s']) this.y += this.speed;
        if (keys['ArrowLeft'] || keys['a']) {
            this.x -= this.speed;
            this.direction = -1;
        }
        if (keys['ArrowRight'] || keys['d']) {
            this.x += this.speed;
            this.direction = 1;
        }

        // 边界限制
        this.x = Math.max(this.radius, Math.min(GAME_WIDTH - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(GAME_HEIGHT - this.radius, this.y));
    }

    grow(enemyRadius) {
        // 成长逻辑：吃掉鱼的半径的 10% 增加到玩家半径
        this.radius += enemyRadius * 0.1;
        // 限制最大半径
        if (this.radius > 150) this.radius = 150;
        
        // 根据体型稍微调整速度，体型越大越慢一点点
        this.speed = Math.max(2, 6 - (this.radius / 30));
    }
}

// 敌鱼类
class Enemy extends Fish {
    constructor() {
        const radius = Math.random() * (player.radius * 2.5) + 5; // 随机大小
        const direction = Math.random() > 0.5 ? 1 : -1;
        const x = direction === 1 ? -radius * 3 : GAME_WIDTH + radius * 3;
        const y = Math.random() * (GAME_HEIGHT - radius * 2) + radius;
        const speed = Math.random() * 2 + 1 + (20 / radius); // 小鱼快，大鱼慢
        
        // 颜色根据大小变化，比玩家小的偏绿，比玩家大的偏红
        let color = '#2ECC40'; // 绿色
        if (radius > player.radius) {
            color = '#FF4136'; // 红色
        }

        super(x, y, radius, color, speed, direction);
    }

    update() {
        this.x += this.speed * this.direction;
    }

    isOffScreen() {
        return (this.direction === 1 && this.x > GAME_WIDTH + this.radius * 4) ||
               (this.direction === -1 && this.x < -this.radius * 4);
    }
}

// 输入监听
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// 游戏控制
function startGame() {
    gameState = 'PLAYING';
    score = 0;
    player = new Player();
    enemies = [];
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameState = 'GAMEOVER';
    finalScore.innerText = score;
    finalSize.innerText = (player.radius / PLAYER_START_RADIUS).toFixed(1) + 'x';
    gameOverScreen.classList.remove('hidden');
    hud.classList.add('hidden');
}

function spawnEnemy() {
    if (enemies.length < MAX_ENEMIES && Math.random() < ENEMY_SPAWN_RATE) {
        enemies.push(new Enemy());
    }
}

function checkCollisions() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 简单的圆形碰撞检测
        if (distance < player.radius + enemy.radius * 0.8) {
            if (player.radius >= enemy.radius) {
                // 吃掉敌鱼
                player.grow(enemy.radius);
                score += Math.floor(enemy.radius);
                enemies.splice(i, 1);
            } else {
                // 撞到大鱼
                gameOver();
            }
        }
    }
}

function updateHUD() {
    scoreDisplay.innerText = score;
    sizeDisplay.innerText = (player.radius / PLAYER_START_RADIUS).toFixed(1);
}

function gameLoop() {
    if (gameState !== 'PLAYING') return;

    // 清空画布
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 绘制背景装饰（气泡/水草可以之后加）
    // ...

    // 更新和绘制玩家
    player.update();
    player.draw();

    // 更新和绘制敌鱼
    spawnEnemy();
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.update();
        enemy.draw();

        // 移除屏幕外的鱼
        if (enemy.isOffScreen()) {
            enemies.splice(i, 1);
        }
    }

    checkCollisions();
    updateHUD();

    requestAnimationFrame(gameLoop);
}

// 按钮事件
startButton.onclick = startGame;
restartButton.onclick = startGame;

// 处理窗口大小改变
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
