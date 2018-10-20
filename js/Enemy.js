export default class EnemyFactory {
  constructor(scene) {
    this.scene = scene;
  }

  createEnemy(enemyObject) {
    const enemyType = enemyObject.type;
    const spawnPoint = {
      x: enemyObject.x,
      y: enemyObject.y-(enemyObject.height/2)
    };

    var switchId;
    if (enemyObject.hasOwnProperty('properties'))
      switchId = enemyObject.properties.switchId;

    if (enemyType === "Snapper")
      return new Snapper(this.scene, spawnPoint, switchId);

    if (enemyType === "Springtrap")
      return new Springtrap(this.scene, spawnPoint, switchId);

    if (enemyType === "PouncePuss")
      return new PouncePuss(this.scene, spawnPoint, switchId);

    throw "Unhandled enemyType '" + enemyType + "'";
  }
}

class Enemy {
  constructor(scene, spawnPoint, enemyType, spriteSheet, switchId) {
    this.scene = scene;

    this.sprite = scene.physics.add.sprite(
      spawnPoint.x, spawnPoint.y, spriteSheet);
    this.sprite.type = enemyType;
    this.sprite.depth = 5;
    this.sprite.setCollideWorldBounds(true); // don't go out of the map7
    this.sprite.anims.play(enemyType + '_walk', true); // play walk animation

    this.switchId = switchId;

    this.sprite.parent = this;
  }

  collideBlock(block) {
  }

  slam() {
    return false;
  }
}

class Snapper extends Enemy {
  constructor(scene, spawnPoint, switchId) {
    console.log('new Snapper()');
    super(scene, spawnPoint, "Snapper", "snappersprites", switchId);
  }

  update() {
    const sprite = this.sprite;

    if (sprite.flipX)
      sprite.setVelocityX(-150);
    else
      sprite.setVelocityX(150);
  }

  collideBlock(block) {
    const sprite = this.sprite;
    if (sprite.body.blocked.right)
    {
      sprite.flipX = true;
    }
    else if (sprite.body.blocked.left)
    {
      sprite.flipX = false;
    }
  }

  slam() {
    const sprite = this.sprite;
    sprite.disableBody(true, true);

    if (this.hasOwnProperty('switchId')) {
      console.log('slam:' + this.switchId);
      this.scene.activateSwitch(this.switchId);
    }

    this.scene.sounds.enemydie.play();

    return true;
  }
}

class Springtrap extends Enemy {
  constructor(scene, spawnPoint, switchId) {
    console.log('new Springtrap()');
    super(scene, spawnPoint, "Springtrap", "Springtrapsprites", switchId);
  }

  update() {
    const sprite = this.sprite;
    const playerBody = this.scene.player.sprite.body;

    if (playerBody.center.x < sprite.body.center.x)
    {
      sprite.flipX = true;
      sprite.setVelocityX(-100);
    }
    else if (playerBody.center.x > sprite.body.center.x)
    {
      sprite.setVelocityX(100);
      sprite.flipX = false;
    }
    else
      sprite.setVelocityX(0);
  }
}

class PouncePuss extends Enemy {
  constructor(scene, spawnPoint, switchId) {
    console.log('new PouncePuss()');
    super(scene, spawnPoint, "PouncePuss", "pouncepusssprites", switchId);

    this.sprite.body.setSize(this.sprite.width-32, this.sprite.height-32);
    this.sprite.body.setOffset(16,32);

    this.state = "walking";
  }

  update() {
    if (this.state === "walking")
      this.updateWalking();
    else if (this.state === "crouching")
      this.updateCrouching();
    else if (this.state === "pouncing")
      this.updatePouncing();
    else if (this.state === "idle")
      this.updateIdle();
  }

  updateWalking() {
    const sprite = this.sprite;

    const playerCenter = this.scene.player.sprite.body.center;
    const spriteCenter = sprite.body.center;

    const tolerance = 300;

    if ((playerCenter.x - spriteCenter.x)**2 + (playerCenter.y - spriteCenter.y)**2 <= tolerance**2) {
      if (playerCenter.x < spriteCenter.x) {
        sprite.flipX = true;
      }
      else {
        sprite.flipX = false;
      }

      // stop, crouch, then pounce left
      sprite.setVelocityX(0);
      sprite.anims.play("PouncePuss_crouch", true);
      this.state = "crouching";

      // Callback to pounce after 1 second
      this.scene.time.addEvent({
        delay: 1000,
        callback: this.pounce,
        callbackScope: this
      });

      return;
    }

    // Continue walking
    if (sprite.flipX)
      sprite.setVelocityX(-150);
    else
      sprite.setVelocityX(150);
  }

  updateCrouching() {
    // do nothing; wait to pounce
  }

  updatePouncing() {
    const sprite = this.sprite;

    if (sprite.body.onFloor()) {
      // Idle for 1 second, then continue walking
      sprite.setVelocityX(0);
      sprite.setVelocityY(0);
      sprite.anims.play("PouncePuss_idle", true);
      this.state = "idle";

      // Callback to walk after 1 second
      this.scene.time.addEvent({
        delay: 1000,
        callback: this.walk,
        callbackScope: this
      });
    }
  }

  updateIdle() {
    // Do nothing, wait to walk
  }

  pounce() {
    const sprite = this.sprite;

    if (sprite.flipX)
      sprite.setVelocityX(-400);
    else
      sprite.setVelocityX(400);

    sprite.setVelocityY(-600);

    sprite.anims.play("PouncePuss_pounce", true);

    this.state = "pouncing";
  }

  walk() {
    const sprite = this.sprite;

    if (sprite.flipX)
      sprite.setVelocityX(-150);
    else
      sprite.setVelocityX(150);

    sprite.anims.play("PouncePuss_walk", true);

    this.state = "walking";
  }

  collideBlock(block) {
    const sprite = this.sprite;

    if (this.state === "walking") {
      if (sprite.body.blocked.right) {
        sprite.flipX = true;
      }
      else if (sprite.body.blocked.left) {
        sprite.flipX = false;
      }
    }
  }

  slam() {
    const sprite = this.sprite;
    sprite.disableBody(true, true);

    if (this.hasOwnProperty('switchId')) {
      console.log('slam:' + this.switchId);
      this.scene.activateSwitch(this.switchId);
    }

    this.scene.sounds.enemydie.play();

    return true;
  }
}
