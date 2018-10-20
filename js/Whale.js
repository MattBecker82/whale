class PlayerState {
  constructor() {
    this.reset();
  }

  reset() {
    this.lives = 3;

    this.bounceUp = 0;
    this.bounceRight = 0;

    this.isFalling = false;
    this.isSlamming = false;
    this.isDead = false;

    this.isInvincible = false;
  }
}

export default class Whale {
  constructor(scene, spawnPoint) {
    console.log('new Whale()');

    this.scene = scene;
    this.spawnPoint = spawnPoint;
    this.sprite = this.createSprite();
    this.sprite.parent = this;

    this.state = new PlayerState();

    this.createAnimations();
    this.resetPlayerState();

    this.cursors = scene.input.keyboard.createCursorKeys();
  }

  createSprite() {
    const sprite = this.scene.physics.add.sprite(
      this.spawnPoint.x, this.spawnPoint.y, 'player');
    sprite.depth = 6;
    sprite.setCollideWorldBounds(true);

    sprite.body.setSize(sprite.width-20, sprite.height-8);
    sprite.body.setOffset(10,8);

    return sprite;
  }

  createAnimations()
  {
    const anims = this.scene.anims;

    // player walk animation
    anims.create({
      key: 'walk',
      frames:
        anims.generateFrameNumbers('player', { start: 0, end: 1 }),
      frameRate: 10,
      repeat: -1
    });

    // idle with only one frame, so repeat is not needed
    anims.create({
      key: 'idle',
      frames: [{ key: 'player', frame: 0 }],
      frameRate: 10
    });
  }

  resetPlayerState()
  {
    this.sprite.setPosition(this.spawnPoint.x, this.spawnPoint.y);
    this.sprite.flipX = true; // flip the sprite to the right

    this.state.reset();
  }

  update(time, delta) {
    const elapsed = delta; // game.physics.elapsed;

    const sprite = this.sprite;
    const state = this.state;
    const cursors = this.cursors;
    const sounds = this.scene.sounds;

    if (state.isInvincible && (time % 200) < 100)
    {
      sprite.alpha = 0.5;
    }
    else
    {
      sprite.alpha = 1.0;
    }

    const bounceFriction = 5;
    if (state.bounceRight > 0)
    {
      sprite.body.setVelocityX(state.bounceRight);
      state.bounceRight = Math.max(state.bounceRight - bounceFriction * elapsed, 0);
    }
    else if (state.bounceRight < 0)
    {
      sprite.body.setVelocityX(state.bounceRight);
      state.bounceRight = Math.min(state.bounceRight + bounceFriction * elapsed, 0);
    }
    else if (cursors.left.isDown && !sprite.body.touching.right) // if the left arrow key is isDown
    {
      sprite.body.setVelocityX(-400); // move left
      sprite.anims.play('walk', true); // play walk animation
      sprite.flipX = false; // use the original sprite looking to the left
    }
    else if (cursors.right.isDown) // if the right arrow key is isDown
    {
      sprite.body.setVelocityX(400); // move right
      sprite.anims.play('walk', true); // play walk animation
      sprite.flipX = true; // flip the sprite to the right
    }
    else {
      sprite.body.setVelocityX(0); // stop horizonal movement
      sprite.anims.play('idle');
    }

    // Vertical movement
    if (state.bounceUp > 0)
    {
      sprite.body.setVelocityY(-state.bounceUp);
      state.bounceUp = 0;
    }
    else if ((cursors.space.isDown || cursors.up.isDown) &&  sprite.body.onFloor())
    {
      sprite.body.setVelocityY(-800); // jump up
      sounds.jump.play();
    }
    else if (cursors.down.isDown && !sprite.body.onFloor() && !state.isSlamming)
    {
      state.isSlamming = true;
      sprite.body.setVelocityY(1200); // ground pound
      sounds.slam.play();
    }

    if (state.isSlamming && sprite.body.velocity.y <= 0)
    {
      // Stop slamming once we hit the floor or bounce etc.
      state.isSlamming = false;
    }

    //spriteText.setText('bounceRight=' + bounceRight);

    state.isFalling = sprite.body.velocity.y > 0;
  }

  collideWater(sprite, tile) {
    const state = this.state;
    if (this.state.isFalling && this.sprite.body.onFloor())
    {
      this.state.isFalling = false;
      this.scene.sounds.splash.play();
    }
  }

  collideRedBlock(tile) {
    const scene = this.scene;
    // scene.wizard.showTextOnce('Red blocks are bouncy. Use them to get up high.');

    const tolerance = 10;

    const camera = scene.cameras.main;
    const tileTop = tile.getTop(camera);

    const tileLeft = tile.getLeft(camera);
    const tileRight = tile.getRight(camera);

    // tileText.setText('tileLeft=' + tileLeft + ' sprite.body.right=' + sprite.body.right);
    const sprite = this.sprite;
    if (sprite.body.bottom <= (tileTop + tolerance))
    {
      scene.player.state.bounceUp = 1200;
      scene.sounds.boing.play();
    }
    else if (sprite.body.right <= (tileLeft + tolerance))
    {
      scene.player.state.bounceRight = -1200;
      scene.sounds.boing.play();
    }
    else if (sprite.body.left >= (tileRight - tolerance))
    {
      scene.player.state.bounceRight = 1200;
      scene.sounds.boing.play();
    }
  }

  collideYellowBlock(tile) {
    const scene = this.scene;

    scene.wizard.showTextOnce('You can pass through each yellow block once. After that, it turns brown and you can\'t go through it.');
    scene.wizard.showTextOnce('Also, watch out for blue blocks. They will kill you.');

    const camera = scene.cameras.main;
    var tileLeft = tile.getLeft(camera);

    // Add to list of touched yellow tiles
    scene.touchYellowTile(tile);

    tile.resetCollision();
  }

  collideBlueBlock(tile) {
    this.scene.wizard.showTextOnce('Oh dear. You hit a blue block, so you died. Click the reset button in the top-right to start the level again.');
    this.die();
  }

  overlapEnemy(sprite, enemy) {
    const state = this.state;

    if (state.isSlamming && sprite.y < enemy.y) {
      var isHit = enemy.parent.slam();
      if (isHit)
        return;
    }

    if (state.isInvincible)
      return;

    this.loseLife();
    if (state.isDead)
      return;

    this.scene.sounds.hurt.play();
    sprite.body.setVelocityX(0);
    state.isInvincible = true;

    // Turn off isInvincible after 2 seconds
    this.scene.time.addEvent({
      delay: 2000,
      callback: () => { this.state.isInvincible = false; },
      callbackScope: this
    });
  }

  collideSwitch(switch0) {
    const state = this.state;
    const sprite = this.sprite;

    if (state.isSlamming && sprite.y < switch0.y) {
      switch0.parent.slam.call(switch0.parent);
    }
  }

  loseLife() {
    this.state.lives--;
    this.scene.statusBar.update(this);

    if (this.state.lives == 0)
      this.die();
  }

  die()
  {
    this.sprite.flipY = true;
    this.sprite.anims.play('idle', true);
    this.scene.sounds.fail.play();
    this.state.isDead = true;
  }
}
