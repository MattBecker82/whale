//boing sound: https://freesound.org/people/juskiddink/sounds/140867/
//bleep sound: https://freesound.org/people/Greencouch/sounds/124907/
//jump sound: https://freesound.org/people/cabled_mess/sounds/350900/
//spash sound: https://freesound.org/people/soundscalpel.com/sounds/110393/
//fail sound: https://freesound.org/people/NotR/sounds/172949/
//win sound: https://freesound.org/people/LittleRobotSoundFactory/sounds/270404/
//slam sound: https://freesound.org/people/volivieri/sounds/161189/
//collect sound: https://freesound.org/people/suntemple/sounds/253172/

var config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 800,
    physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 2000 },
          debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

var background, restart;

var map;
var blocks, water, tick, collectibles;
var player;
var enemies;

var camera;
var cursors, enterKey;

var bounceUp = 0;
var bounceRight = 0;

var spriteText;
var tileText;

var touchedYellowTiles = [];

var boing, bleep, jump, splash, fail, win, slam, collect;

var isFalling = false;
var isDead = false
var isSlamming = false;
var levelComplete = false;

// winning animation
var winJumps;

var wizardScreen, wizardText, wizardButton;
var wizardIsShowing;
var wizardTextList = [];

var scene;
var phys;

function preload() {
  this.load.image('background', 'assets/Ocean.png');
  this.load.image('restart', 'assets/restart.png');
  this.load.image('wizard', 'assets/whaleWizard1.png');
  this.load.image('wizardOk', 'assets/WizardOk.png');

  // Load the tilemap
  this.load.tilemapTiledJSON('map', 'assets/tutorial2.json?v=18');

  // Load the tiles used in the tilemap
  var tileFrameDims = { frameWidth: 64, frameHeight: 64 };
  this.load.spritesheet('TilesMain', 'assets/TilesMain.png', tileFrameDims);
  this.load.spritesheet('WaterTiles', 'assets/WaterTiles.png', tileFrameDims);
  this.load.spritesheet('Collectible1', 'assets/Collectible1.png', tileFrameDims);
  this.load.spritesheet('snappersprites', 'assets/snappersprites.png',
    { frameWidth: 96, frameHeight: 48 });
  this.load.spritesheet('Springtrapsprites', 'assets/Springtrapsprites.png', tileFrameDims);

  this.load.spritesheet('player', 'assets/Whale.png',
    { frameWidth: 64, frameHeight: 48 });

  this.load.audio('boing', 'assets/140867__juskiddink__boing.wav');
  this.load.audio('bleep', 'assets/124907__greencouch__bleeps-double-4.wav');
  this.load.audio('jump', 'assets/350900__cabled-mess__jump-c-07.wav');
  this.load.audio('splash', 'assets/110393__soundscalpel-com__water-splash.wav');
  this.load.audio('fail', 'assets/172949__notr__sadtrombones.mp3');
  this.load.audio('win', 'assets/270404__littlerobotsoundfactory__jingle-achievement-00.wav');
  this.load.audio('slam', 'assets/161189__volivieri__storm-door-slam-02.wav');
  this.load.audio('collect', 'assets/253172__suntemple__retro-bonus-pickup-sfx.wav');
}

var shownIntroText = false;
function create() {
  scene = this;
  phys = this.physics;
  phys.world.TILE_BIAS = 32;

  createMap();
  createPlayer();
  createEnemies();
  createBackground();
  createWizardScreen();
  createResetButton();
  createCamera();
  createInputs();
  createDebugText();
  createSoundEffects();

  setCollisions();

  if (!shownIntroText)
  {
    showWizardText('Welcome to the second tutorial.');
    showWizardText('This one will be about enemies and switches.');
  }
}

function createMap()
{
  console.log('createMap()');

  // Map
  map = scene.make.tilemap({key: 'map'});
  spawnPoint = map.findObject("Player", obj => obj.name === "spawnpoint");

  createLayers();
}

function createPlayer()
{
  console.log('createPlayer()');

  // create the player sprite
  player = phys.add.sprite(spawnPoint.x, spawnPoint.y, 'player');
  player.depth = 5;
  player.setCollideWorldBounds(true); // don't go out of the map

  // small fix to our player images, we resize the physcs body object slightly
  player.body.setSize(player.width-20, player.height-8);
  player.body.setOffset(10,8);

  createPlayerAnimations();

  resetPlayerState();
}

function resetPlayerState()
{
  console.log('resetPlayerState()');

  player.setPosition(spawnPoint.x, spawnPoint.y);
  player.flipX = true; // flip the sprite to the right

  bounceUp = 0;
  bounceRight = 0;

  isFalling = false;
  isSlamming = false;
  isDead = false;
  levelComplete = false;
}

function createLayers()
{
  console.log('createLayers()');

  // Main tiles image
  var tilesMain = map.addTilesetImage('TilesMain');
  var waterTiles = map.addTilesetImage('WaterTiles');
  var collectible1 = map.addTilesetImage('Collectible1');

  // Create map layers
  blocks = map.createDynamicLayer('Blocks', tilesMain, 0, 0);
  blocks.depth = 0;

  tick = map.createDynamicLayer('Tick', tilesMain, 0, 0);
  tick.depth = 1;

  collectibles = map.createDynamicLayer('Collectibles', collectible1, 0, 0);
  collectibles.depth = 1;

  water = map.createDynamicLayer('Water', waterTiles, 0, 0);
  water.depth = 2;

  // set the boundaries of our game world
  phys.world.bounds.width = blocks.width;
  phys.world.bounds.height = blocks.height;
}

function createEnemies()
{
  createEnemyAnimations();

  var enemiesLayer = map.getObjectLayer('Enemies');

  enemies = phys.add.group(enemiesLayer.objects.map(createEnemy));
}

function createEnemy(enemyObject)
{
  var enemyType = enemyObject.type;
  console.log('createEnemy(' + enemyType + ')');

  var sprite = getEnemySprite(enemyType);

  var enemy = phys.add.sprite(enemyObject.x, enemyObject.y-(enemyObject.height/2), sprite);
  enemy.type = enemyType;
  enemy.depth = 5;
  enemy.setCollideWorldBounds(true); // don't go out of the map7
  enemy.anims.play(enemyType + '_walk', true); // play walk animation

  return enemy;
}

function getEnemySprite(enemyType)
{
  if (enemyType === "Snapper")
    return "snappersprites";
  if (enemyType === "Springtrap")
    return "Springtrapsprites";
  return "";
}

function createEnemyAnimations()
{
  console.log('createEnemyAnimations()');

  // snapper walk animation
  scene.anims.create({
    key: 'Snapper_walk',
    frames:
      scene.anims.generateFrameNumbers('snappersprites', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });

  // springtrap walk animation
  scene.anims.create({
    key: 'Springtrap_walk',
    frames:
      scene.anims.generateFrameNumbers('Springtrapsprites', { start: 0, end: 2 }),
    frameRate: 10,
    repeat: -1
  });
}

function setCollisions()
{
  console.log('setCollisions()');

  blocks.setCollisionByExclusion([-1,7]);
  blocks.setTileIndexCallback(7, collideYellowBlock, scene);
  blocks.setTileIndexCallback(8, collideRedBlock, scene);
  blocks.setTileIndexCallback(10, collideBlueBlock, scene);
  phys.add.collider(blocks, player);
  phys.add.collider(blocks, enemies, collideBlockEnemy);

  water.setCollisionByExclusion([-1,0,1,2]);
  phys.add.collider(water, player, collideWater);
  phys.add.collider(water, enemies);

  collectibles.setTileIndexCallback(17, collectOne, scene);
  phys.add.overlap(player, collectibles);

  tick.setTileIndexCallback(16, collideTick, scene);
  phys.add.overlap(player, tick);
}

function createBackground()
{
  console.log('createBackground()');

  background = scene.add.image(0, 0, 'background');
  background.depth = -1;
  background.setPosition(background.width * 2, background.height * 2);
  background.setScale(4);

  // Scroll the background relative to the game world
console.log('blocks.width='+blocks.width);
  background.setScrollFactor(background.width / blocks.width,
    background.height / blocks.height);
}

function createPlayerAnimations()
{
  console.log('createPlayerAnimations()');

  // player walk animation
  scene.anims.create({
    key: 'walk',
    frames:
      scene.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
    frameRate: 10,
    repeat: -1
  });

  // idle with only one frame, so repeat is not needed
  scene.anims.create({
    key: 'idle',
    frames: [{ key: 'player', frame: 0 }],
    frameRate: 10
  });
}

function createResetButton()
{
  console.log('createResetButton()');

  // Restart button
  button = scene.add.image(1150, 50, 'restart');
  button.depth = 10;
  button.setScrollFactor(0);
  button.setInteractive().on('pointerdown', () => restart(scene));
}

function createWizardScreen()
{
  console.log('createWizardScreen()');

  // Wizard info screen
  var graphics = scene.add.graphics(0, 0);
  graphics.depth = 10;
  graphics.setScrollFactor(0);
  graphics.lineStyle(5, 0x802030, 1.0);1
  graphics.fillStyle(0xFFCFAF, 1.0);
  graphics.fillRect(150, 150, 900, 500);
  graphics.strokeRect(150, 150, 900, 500);

  var wizard = scene.add.image(300, 400, 'wizard');
  wizard.depth = 11;
  wizard.setScrollFactor(0);

  wizardText = scene.add.text(500, 200, '', {
    fontFamily: 'arial',
    fontSize: '48px',
    fill: '#000000'
  });
  wizardText.depth = 12;
  wizardText.setWordWrapWidth(500);
  wizardText.setScrollFactor(0);

  wizardButton = scene.add.image(900, 550, 'wizardOk');
  wizardButton.depth = 12;
  wizardButton.setScrollFactor(0);
  wizardButton.setInteractive().on('pointerdown', wizardOk);

  wizardScreen = scene.add.group();
  wizardScreen.add(graphics);
  wizardScreen.add(wizard);
  wizardScreen.add(wizardText);
  wizardScreen.add(wizardButton);
  wizardIsShowing = true;

  wizardTextList = [];
  hideWizard();
}

function createCamera()
{
  console.log('createCamera()');

  // set bounds so the camera won't go outside the game world
  camera = scene.cameras.main;
  camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  // make the camera follow the player
  camera.startFollow(player);
}

function createInputs()
{
  console.log('createInputs()');

  cursors = scene.input.keyboard.createCursorKeys();
  enterKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  scene.input.keyboard.on('keydown_ENTER', enterKeyPressed);
}

function createDebugText()
{
  console.log('createDebugText()');

  spriteText = scene.add.text(20, 20, 'player', {
    fontSize: '20px',
    fill: '#000000'
  });
  spriteText.setScrollFactor(0);

  tileText = scene.add.text(20, 40, 'tile', {
    fontSize: '20px',
    fill: '#000000'
  });
  tileText.setScrollFactor(0);
}

function createSoundEffects()
{
  console.log('createSoundEffects()');

  // Create sound effects
  boing = scene.sound.add('boing');
  bleep = scene.sound.add('bleep');
  jump = scene.sound.add('jump');
  splash = scene.sound.add('splash');
  fail = scene.sound.add('fail');
  win = scene.sound.add('win');
  slam = scene.sound.add('slam');
  collect = scene.sound.add('collect');
}

function enterKeyPressed()
{
  console.log('enterKeyPressed()');

  if (wizardIsShowing)
    wizardOk();
}

function showWizardText(text)
{
  console.log('showWizardText(' + text + ')');

  wizardTextList.push(text);

  if (!wizardIsShowing)
    advanceWizardText();
}

function advanceWizardText()
{
  console.log('advanceWizardText()');

  if (wizardTextList.length > 0)
  {
    var nextText = wizardTextList.shift();
    wizardText.setText(nextText);
    showWizard();
  }
  else
  {
    hideWizard();
  }
}

function showWizard()
{
  console.log('showWizard()');

  if (!wizardIsShowing)
  {
    wizardButton.setInteractive();
    wizardScreen.toggleVisible();
    phys.pause();
    wizardIsShowing = true;
  }
}

function hideWizard()
{
  console.log('hideWizard()');

  if (wizardIsShowing)
  {
    wizardButton.disableInteractive();
    wizardScreen.toggleVisible();
    phys.resume();
    wizardIsShowing = false;
  }
}

function wizardOk()
{
  advanceWizardText();
}

function restart(g)
{
  console.log('restart()');

  g.registry.destroy();
  g.events.off();
  g.scene.restart();
}

function collectOne(sprite, tile)
{
  console.log('collectOne()');

  collectibles.removeTileAt(tile.x, tile.y); // remove the tile
  collect.play();
}

function collideWater(sprite, tile)
{
  if (isFalling && sprite.body.onFloor())
  {
    isFalling = false;
    splash.play();
  }
}

var shownCollideYellowText = false;
function collideYellowBlock(sprite, tile)
{
  if (!shownCollideYellowText)
  {
    showWizardText('You can pass through each yellow block once. After that, it turns brown and you can\'t go through it.');
    showWizardText('Also, watch out for blue blocks. They will kill you.');
    shownCollideYellowText = true;
  }

  var tileLeft = tile.getLeft(camera);
  tileText.setText('tile.y=' + tile.y + ' tile.collides=' + tile.collides);
  spriteText.setText('sprite.body.x=' + sprite.body.x);

  // Add to list of touched yellow tiles
  if (!touchedYellowTiles.includes(tile))
  {
    touchedYellowTiles.push(tile);
  }

  tile.resetCollision();
}

var shownCollideBlueText = false;
function collideBlueBlock(sprite, tile)
{
  if (!shownCollideBlueText)
  {
    showWizardText('Oh dear. You hit a blue block, so you died. Click the reset button in the top-right to start the level again.');
    shownCollideBlueText = true;
  }

  die();
}

function die()
{
  player.flipY = true;
  player.anims.play('idle', true);
  fail.play();
  isDead = true;
}

var shownCollideRedText = true;
function collideRedBlock(sprite, tile)
{
  if (!shownCollideRedText)
  {
    showWizardText('Red blocks are bouncy. Use them to get up high.');
    shownCollideRedText = true;
  }

  var tolerance = 10;

  var tileTop = tile.getTop(camera);

  var tileLeft = tile.getLeft(camera);
  var tileRight = tile.getRight(camera);

  tileText.setText('tileLeft=' + tileLeft + ' sprite.body.right=' + sprite.body.right);
  if (sprite.body.bottom <= (tileTop + tolerance))
  {
    bounceUp = 1200;
    boing.play();
  }
  else if (sprite.body.right <= (tileLeft + tolerance))
  {
    bounceRight = -1200;
    boing.play();
  }
  else if (sprite.body.left >= (tileRight - tolerance))
  {
    bounceRight = 1200;
    boing.play();
  }
}

function collideBlockEnemy(enemy, block)
{
  if (enemy.type == "Snapper")
  {
    if (enemy.body.blocked.right)
    {
      enemy.flipX = true;
    }
    else if (enemy.body.blocked.left)
    {
      enemy.flipX = false;
    }
  }
}

var shownCollideTickText = false;
function collideTick(sprite, tile)
{
  console.log('collideTick()');

  if (levelComplete)
    return;

  if (!shownCollideTickText)
  {
    win.play();
    shownCollideTickText = true;
  }

  completeLevel();
}

var winJumps;
function completeLevel()
{
  console.log('completeLevel()');

  levelComplete = true;
  winJumps = 5;

  player.setCollideWorldBounds(false); // Allow player out the map
}

function isTouching(sprite, tile)
{
  var tolerance = 10;

  var spriteTop = sprite.body.top;
  var spriteBottom = sprite.body.bottom;
  var spriteLeft = sprite.body.left;
  var spriteRight = sprite.body.right;

  var tileTop = tile.getTop(camera);
  var tileBottom = tile.getBottom(camera);
  var tileLeft = tile.getLeft(camera);
  var tileRight = tile.getRight(camera);

  var touchingTop = spriteBottom >= tileTop - tolerance;
  var touchingBottom = spriteTop <= tileBottom + tolerance;
  var touchingLeft = spriteRight >= tileLeft - tolerance;
  var touchingRight = spriteLeft <= tileRight + tolerance;

  return touchingTop && touchingBottom && touchingLeft && touchingRight;
}

function updateDead(time, delta) {
  player.body.t
  player.setVelocityX(0);
  player.setVelocityY(-400);
}

function updateWizard()
{
  // Do nothing
}

function updateLevelComplete()
{
  if (winJumps > 0 &&  player.body.onFloor())
  {
    player.body.setVelocityY(-800); // jump up
    jump.play();
    winJumps--;
  }
  else if (player.body.left <= phys.world.bounds.width)
  {
    player.body.setVelocityX(400); // move right
    player.anims.play('walk', true); // play walk animation
    player.flipX = true; // flip the sprite to the right
  }
  else
  {
    player.body.setVelocityX(0);
  }
}

function updateEnemies()
{
  enemies.children.iterate(updateEnemy);
}

function updateEnemy(enemy)
{
  if (enemy.type === "Snapper")
  {
    if (enemy.flipX)
      enemy.setVelocityX(-150);
    else
      enemy.setVelocityX(150);
  }

  if (enemy.type === "Springtrap")
  {
    if (player.body.center.x < enemy.body.center.x)
    {
      enemy.setVelocityX(-100);
      enemy.flipX = true;
    }
    else if (player.body.center.x > enemy.body.center.x)
    {
      enemy.setVelocityX(100);
      enemy.flipX = false;
    }
    else
      enemy.setVelocityX(0);
  }
}

function update(time, delta) {
  if (wizardIsShowing)
  {
    updateWizard();
    return;
  }

  if (isDead)
  {
    phys.pause();
    updateDead(time, delta);
    return;
  }

  if (levelComplete)
  {
    updateLevelComplete();
    return;
  }

  updateEnemies();

  // Check if any touched yellow tiles are exiting
  var i = 0;
  while (i < touchedYellowTiles.length)
  {
    var tile = touchedYellowTiles[i];
    if (!isTouching(player, tile))
    {
      // Change the tile to brown and remove it from the list
      blocks.fill(11, tile.x, tile.y, 1, 1, true);
      bleep.play();
      touchedYellowTiles.splice(i, 1);
    }
    else
    {
      ++i;
    }
  }

  blocks.setCollision(11);

  var elapsed = delta; // game.physics.elapsed;

  var bounceFriction = 5;
  if (bounceRight > 0)
  {
    player.body.setVelocityX(bounceRight);
    bounceRight = Math.max(bounceRight - bounceFriction * elapsed, 0);
  }
  else if (bounceRight < 0)
  {
    player.body.setVelocityX(bounceRight);
    bounceRight = Math.min(bounceRight + bounceFriction * elapsed, 0);
  }
  else if (cursors.left.isDown && !player.body.touching.right) // if the left arrow key is isDown
  {
    player.body.setVelocityX(-400); // move left
    player.anims.play('walk', true); // play walk animation
    player.flipX = false; // use the original sprite looking to the left
  }
  else if (cursors.right.isDown) // if the right arrow key is isDown
  {
    player.body.setVelocityX(400); // move right
    player.anims.play('walk', true); // play walk animation
    player.flipX = true; // flip the sprite to the right
  }
  else {
    player.body.setVelocityX(0); // stop horizonal movement
    player.anims.play('idle');
  }

  // Vertical movement
  if (bounceUp > 0)
  {
    player.body.setVelocityY(-bounceUp);
    bounceUp = 0;
  }
  else if ((cursors.space.isDown || cursors.up.isDown) &&  player.body.onFloor())
  {
    player.body.setVelocityY(-800); // jump up
    jump.play();
  }
  else if (cursors.down.isDown && !player.body.onFloor() && !isSlamming)
  {
    isSlamming = true;
    player.body.setVelocityY(1200); // ground pound
    slam.play();
  }

  if (isSlamming && player.body.velocity.y <= 0)
  {
    // Stop slamming once we hit the floor or boune etc.
    isSlamming = false;
  }

  //spriteText.setText('bounceRight=' + bounceRight);

  isFalling = player.body.velocity.y > 0;
}
