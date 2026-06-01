let particles = [];
let missiles = [];
let explosions = [];
let bombs = [];
let clocks = [];
let minParticles = 10;
let score = 0;
let gameState = "START"; // START, PLAYING, END
let gameTimer = 30;      // 遊戲時長設定為 30 秒
let difficultyMultiplier = 1; // 難度倍率
let lastBombSpawnTime = 0;    // 記錄上次炸彈生成的遊戲時間
let lastClockSpawnTime = 0;   // 記錄上次時鐘生成的遊戲時間
let recoil = 0;               // 記錄發射後的後座力偏移量
let screenShake = 0;          // 記錄畫面震動強度

function setup() {
  createCanvas(windowWidth, windowHeight);
  resetGame();
}

function draw() {
  drawGradient();
  
  if (gameState === "START") {
    drawStartScreen();
  } else if (gameState === "PLAYING") {
    playGame();
  } else if (gameState === "END") {
    drawEndScreen();
  }
}

function playGame() {
  // 更新倒數計時
  gameTimer -= deltaTime / 1000;
  
  // 更新後座力 (使用 lerp 讓它平滑回復到 0)
  recoil = lerp(recoil, 0, 0.15);
  
  // 更新畫面震動 (平滑衰減)
  screenShake = lerp(screenShake, 0, 0.1);

  // 畫面震動效果：在繪製任何東西前移動座標系
  push();
  if (screenShake > 0.1) {
    translate(random(-screenShake, screenShake), random(-screenShake, screenShake));
  }

  // 計算難度係數：隨著時間推移從 1.0 增加到 2.0
  let elapsedTime = 30 - gameTimer;
  difficultyMultiplier = map(elapsedTime, 0, 30, 1, 2);

  if (gameTimer <= 0) {
    gameTimer = 0;
    gameState = "END";
  }

  // 處理飛彈
  for (let i = missiles.length - 1; i >= 0; i--) {
    missiles[i].update();
    missiles[i].display();
    if (missiles[i].isOffScreen()) missiles.splice(i, 1);
  }
  
  // 處理粒子
  for (let p of particles) {
    p.update();
    p.display();
    p.checkHover();
  }

  // 處理爆炸特效
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].display();
    if (explosions[i].isFinished()) explosions.splice(i, 1);
  }

  // 處理炸彈道具生成 (每 10 秒)
  if (elapsedTime - lastBombSpawnTime >= 10) {
    bombs.push(new Bomb(random(100, width - 100), random(100, height - 100)));
    lastBombSpawnTime = elapsedTime;
  }

  // 顯示炸彈
  for (let b of bombs) {
    b.display();
  }

  // 處理時鐘道具生成 (每 15 秒)
  if (elapsedTime - lastClockSpawnTime >= 15) {
    clocks.push(new Clock(random(100, width - 100), random(100, height - 100)));
    lastClockSpawnTime = elapsedTime;
  }

  // 顯示時鐘
  for (let c of clocks) {
    c.display();
  }

  checkCollisions();
  drawArrow();
  drawScore();
  pop(); // 結束震動影響範圍
}

function drawStartScreen() {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(60);
  text("粒子射擊大戰", width / 2, height / 2 - 50);
  textSize(24);
  text("【操作說明】", width / 2, height / 2 + 30);
  text("移動滑鼠瞄準，按左鍵發射飛彈", width / 2, height / 2 + 70);
  text("按住左鍵可讓粒子聚集（但要小心目標！）", width / 2, height / 2 + 100);
  textSize(32);
  fill(255, 200, 0);
  text("點擊滑鼠開始遊戲", width / 2, height / 2 + 170);
}

function drawEndScreen() {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(60);
  text("時間到！", width / 2, height / 2 - 50);
  textSize(40);
  fill(255, 255, 0);
  text(`最終得分: ${score}`, width / 2, height / 2 + 20);
  textSize(24);
  fill(255);
  text("點擊滑鼠重新挑戰", width / 2, height / 2 + 100);
}

function resetGame() {
  score = 0;
  gameTimer = 30;
  particles = [];
  missiles = [];
  explosions = [];
  bombs = [];
  clocks = [];
  lastBombSpawnTime = 0;
  lastClockSpawnTime = 0;
  recoil = 0;
  screenShake = 0;
  for (let i = 0; i < minParticles; i++) {
    particles.push(new Particle(random(width), random(height)));
  }
  pickRandomTrigger();
}

function drawGradient() {
  let colorTop = color(100, 150, 255);    // 淺藍色
  let colorBottom = color(0, 0, 100);     // 深藍色
  
  for (let y = 0; y <= height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(colorTop, colorBottom, inter);
    stroke(c);
    line(0, y, width, y);
  }
}

function drawArrow() {
  let angle = atan2(mouseY - height / 2, mouseX - width / 2);
  
  // 根據後座力方向計算偏移 (往發射方向的反方向移動)
  let rx = width / 2 - cos(angle) * recoil;
  let ry = height / 2 - sin(angle) * recoil;

  push();
  translate(rx, ry);
  rotate(angle);
  
  // 繪製箭頭指標
  fill(255, 150, 0);
  noStroke();
  triangle(30, 0, 0, -10, 0, 10);
  rect(-20, -5, 20, 10);
  pop();
}

function drawScore() {
  fill(255);
  textSize(24);
  textAlign(LEFT, TOP);
  text(`得分: ${score}`, 20, 20);
  text(`剩餘時間: ${ceil(gameTimer)} 秒`, 20, 55);
}

function mousePressed() {
  if (gameState === "START" || gameState === "END") {
    resetGame();
    gameState = "PLAYING";
  } else if (gameState === "PLAYING" && mouseButton === LEFT) {
    let angle = atan2(mouseY - height / 2, mouseX - width / 2);
    missiles.push(new Missile(width / 2, height / 2, angle));
    recoil = 15; // 每次射擊時產生 15 單位的後座力
  }
}

function checkCollisions() {
  // 檢查飛彈是否擊中炸彈
  for (let i = bombs.length - 1; i >= 0; i--) {
    let b = bombs[i];
    for (let j = missiles.length - 1; j >= 0; j--) {
      let m = missiles[j];
      let d = dist(m.pos.x, m.pos.y, b.pos.x, b.pos.y);
      if (d < b.size / 2 + 5) {
        // 擊中炸彈！引發全螢幕連鎖爆炸
        screenShake = 30; // 炸彈引發強烈震動
        for (let p of particles) {
          explosions.push(new Explosion(p.pos.x, p.pos.y, p.color));
          score += 5; // 炸彈清場的分數
        }
        particles = [];
        // 補足粒子數量
        while (particles.length < minParticles) {
          particles.push(new Particle(random(width), random(height)));
        }
        pickRandomTrigger();
        bombs.splice(i, 1);
        missiles.splice(j, 1);
        return; // 跳出檢查避免索引問題
      }
    }
  }

  // 檢查飛彈是否擊中時鐘
  for (let i = clocks.length - 1; i >= 0; i--) {
    let c = clocks[i];
    for (let j = missiles.length - 1; j >= 0; j--) {
      let m = missiles[j];
      let d = dist(m.pos.x, m.pos.y, c.pos.x, c.pos.y);
      if (d < c.size / 2 + 5) {
        // 擊中時鐘！增加 5 秒時間
        gameTimer += 5;
        screenShake = 5; // 吃到道具的小震動
        clocks.splice(i, 1);
        missiles.splice(j, 1);
        return; // 跳出檢查避免索引問題
      }
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    for (let j = missiles.length - 1; j >= 0; j--) {
      let d = dist(particles[i].pos.x, particles[i].pos.y, missiles[j].pos.x, missiles[j].pos.y);
      if (d < particles[i].size * particles[i].currentScale) {
        // 擊中時減少血量
        screenShake = 3; // 普通擊中的輕微震動
        particles[i].health--;
        missiles.splice(j, 1); // 飛彈消失

        if (particles[i].health <= 0) {
          // 血量歸零才爆炸並移除
          screenShake = 10; // 擊殺敵人的中等震動
          explosions.push(new Explosion(particles[i].pos.x, particles[i].pos.y, particles[i].color));
          particles.splice(i, 1);
          score += 10;

          // 補足粒子數量
          if (particles.length < minParticles) {
            particles.push(new Particle(random(width), random(height)));
          }
        }
        break;
      }
    }
  }
}

function pickRandomTrigger() {
  // 先重設所有粒子
  for (let p of particles) p.isTrigger = false;
  // 隨機挑選一個
  if (particles.length > 0) {
    let target = random(particles);
    target.isTrigger = true;
  }
}

class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.homePos = createVector(x, y); // 儲存粒子的「家」（原始散開的位置）

    // 根據目前的難度決定血量機率
    let r = random();
    let elapsedTime = 30 - gameTimer;
    
    if (elapsedTime > 20 && r > 0.8) {
      this.maxHealth = 3; // 遊戲末期有 20% 機率出現 3 HP 的精英
    } else if (r > (0.9 - (elapsedTime / 60))) { 
      // 強壯型 (2 HP) 出現機率隨時間提高 (從約 10% 增加到 50%)
      this.maxHealth = 2;
    } else {
      this.maxHealth = 1;
    }

    this.health = this.maxHealth;

    this.size = random(40, 80) * (1 + (this.maxHealth - 1) * 0.3); // 血量越多體型越大
    this.speedFactor = random(0.03, 0.08); // 每個粒子的速度都不一樣
    this.color = color(random(200, 255), random(150, 200), random(200, 255));
    this.currentScale = 1.0; // 新增：目前的縮放比例
    this.isTrigger = false;
    this.offsets = [];
    
    // 產生不規則形狀的頂點
    let vertices = floor(random(5, 10));
    for (let i = 0; i < vertices; i++) {
      let angle = map(i, 0, vertices, 0, TWO_PI);
      let r = this.size * random(0.8, 1.2);
      this.offsets.push(createVector(cos(angle) * r, sin(angle) * r));
    }
  }

  update() {
    let targetScale = 1.0;
    if (mouseIsPressed && gameState === "PLAYING") {
      // 當滑鼠按住時，計算朝向滑鼠的向量並移動
      let target = createVector(mouseX, mouseY);
      let force = p5.Vector.sub(target, this.pos);
      force.mult(this.speedFactor * difficultyMultiplier); // 速度受難度加成
      this.pos.add(force);
      targetScale = 0.5; // 聚集時縮小到 50%
    } else {
      // 沒按滑鼠時，計算回到「家」的力
      let homeForce = p5.Vector.sub(this.homePos, this.pos);
      homeForce.mult(this.speedFactor * difficultyMultiplier); // 回家速度也受難度加成
      this.pos.add(homeForce);

      // 同時維持輕微的漂浮感，讓粒子看起來更有生命力
      this.pos.x += sin(frameCount * 0.02 + this.size) * 0.5;
      this.pos.y += cos(frameCount * 0.02 + this.size) * 0.5;
      targetScale = 1.0; // 恢復原狀
    }
    // 使用 lerp 讓縮放過程更平滑 (0.1 是轉換速度)
    this.currentScale = lerp(this.currentScale, targetScale, 0.1);
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    scale(this.currentScale); // 套用縮放比例
    
    // 畫身體
    fill(this.color);
    if (this.health > 2) {
      stroke(255, 215, 0); // 精英型 (3 HP) 金色外框
      strokeWeight(6);
    } else if (this.health > 1) {
      stroke(255); // 健康的強壯粒子有白色外框
      strokeWeight(4);
    } else if (this.maxHealth > 1 && this.health === 1) {
      stroke(255, 0, 0); // 被打過一次的強壯粒子變紅框
      strokeWeight(2);
    } else {
      noStroke();
    }
    beginShape();
    for (let v of this.offsets) {
      curveVertex(v.x, v.y);
    }
    // 封閉曲線需要重複前幾個點
    curveVertex(this.offsets[0].x, this.offsets[0].y);
    curveVertex(this.offsets[1].x, this.offsets[1].y);
    endShape(CLOSE);

    // 畫眼睛
    let eyeSpacing = this.size * 0.3;
    this.drawEye(-eyeSpacing, -10);
    this.drawEye(eyeSpacing, -10);

    // 畫嘴巴
    stroke(0);
    noFill();
    strokeWeight(2);
    arc(0, 5, 20, 10, 0, PI);
    pop();
  }

  drawEye(ox, oy) {
    fill(255);
    noStroke();
    ellipse(ox, oy, 15, 15);
    
    // 瞳孔轉動邏輯：朝向滑鼠
    let angle = atan2(mouseY - (this.pos.y + oy), mouseX - (this.pos.x + ox));
    let px = ox + cos(angle) * 3;
    let py = oy + sin(angle) * 3;
    fill(0);
    ellipse(px, py, 7, 7);
  }

  checkHover() {
    let d = dist(mouseX, mouseY, this.pos.x, this.pos.y);
    // 判定範圍也要跟著縮放比例調整
    if (this.isTrigger && d < this.size * this.currentScale) {
      // 產生新粒子時，給它一個隨機的「家」位置，這樣它沒被聚集時才會散開到全螢幕
      let newP = new Particle(this.pos.x, this.pos.y); 
      newP.homePos = createVector(random(width), random(height));
      particles.push(newP);
      pickRandomTrigger(); // 重新分配目標
    }
  }
}

class Missile {
  constructor(x, y, angle) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.fromAngle(angle).mult(8);
  }

  update() {
    this.pos.add(this.vel);
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    fill(255, 50, 50);
    rect(-10, -2, 10, 4);
    pop();
  }

  isOffScreen() {
    return (this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height);
  }
}

class Explosion {
  constructor(x, y, color) {
    this.pos = createVector(x, y);
    this.color = color;
    this.radius = 0;
    this.alpha = 255;
  }

  display() {
    noFill();
    let c = color(red(this.color), green(this.color), blue(this.color), this.alpha);
    stroke(c);
    strokeWeight(4);
    ellipse(this.pos.x, this.pos.y, this.radius);
    this.radius += 4;
    this.alpha -= 8;
  }

  isFinished() {
    return this.alpha <= 0;
  }
}

class Bomb {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.size = 50;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    // 呼吸燈閃爍效果 (紅/橘切換)
    let flash = sin(frameCount * 0.15) * 127 + 128;
    stroke(255, flash, 0);
    strokeWeight(4);
    fill(flash, 20, 20);
    ellipse(0, 0, this.size);
    
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(12);
    textStyle(BOLD);
    text("TNT", 0, 0);
    pop();
  }
}

class Clock {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.size = 40;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    stroke(255);
    strokeWeight(2);
    fill(50, 200, 50); // 綠色背景
    ellipse(0, 0, this.size);
    
    // 簡單的時鐘指標
    stroke(255);
    line(0, 0, 0, -this.size / 4);
    line(0, 0, this.size / 4, 0);
    
    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(12);
    textStyle(BOLD);
    text("+5s", 0, this.size / 2 + 12);
    pop();
  }
}

// 當視窗大小改變時自動調整畫布
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
