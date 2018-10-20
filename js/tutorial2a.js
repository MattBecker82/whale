import EnemyFactory from "./Enemy.js";
import ResetButton from "./ResetButton.js";
import Sounds from "./Sounds.js";
import StatusBar from "./StatusBar.js";
import Switch from "./Switch.js";
import Whale from "./Whale.js";
import Wizard from "./Wizard.js";

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

var map;
var blocks, water, tick, collectibles;

var enemies;
var enemiesGroup;
var spawnPoint;

var gatesGroup, switchesGroup;

var touchedYellowTiles = [];

var levelComplete = false;

var winJumps;

var scene;
var phys;

var wizardShownText = [];

function preload() {
  this.sounds = new Sounds(this);

  this.load.image('background', 'assets/Ocean.png');
  this.load.image('restart', 'assets/restart.png');
  this.load.image('whalesmall', 'assets/whalesmall.png');
  this.load.image('wizard', 'assets/whaleWizard1.png');
  this.load.image('wizardOk', 'assets/WizardOk.png');
  this.load.image('gate', 'assets/gate.png');

  // Load the tilemap
  this.load.tilemapTiledJSON('map', 'assets/tutorial2.json?v=24');

  // Load the tiles used in the tilemap
  var tileFrameDims = { frameWidth: 64, frameHeight: 64 };
  this.load.spritesheet('TilesMain', 'assets/TilesMain.png', tileFrameDims);
  this.load.spritesheet('WaterTiles', 'assets/WaterTiles.png', tileFrameDims);
  this.load.spritesheet('Collectible1', 'assets/Collectible1.png', tileFrameDims);
  this.load.spritesheet('snappersprites', 'assets/snappersprites.png',
    { frameWidth: 96, frameHeight: 48 });
  this.load.spritesheet('Springtrapsprites', 'assets/Springtrapsprites.png', tileFrameDims);
  this.load.spritesheet('pouncepusssprites', 'assets/pouncepusssprites.png',
    { frameWidth: 128, frameHeight: 96 });

  this.load.spritesheet('player', 'assets/Whale.png',
    { frameWidth: 64, frameHeight: 48 });

  this.load.spritesheet('switch', 'assets/switch.png',
    { frameWidth: 128, frameHeight: 64 });

  this.sounds.preload();
}

function create() {
  scene = this;
  scene.activateSwitch = activateSwitch;

  phys = this.physics;
  phys.world.TILE_BIAS = 32;

  this.touchYellowTile = touchYellowTile;

  createMap();
  scene.player = new Whale(scene, spawnPoint);
  createSwitchesAndGates();
  createEnemies();
  createBackground();

  this.wizard = new Wizard(scene, wizardShownText);
  scene.resetButton = new ResetButton(scene);
  createCamera();
  this.statusBar = new StatusBar(this);
  this.statusBar.update(scene.player);
  this.sounds.create();

  setCollisions();

  this.wizard.showTextOnce('Welcome to the second tutorial.');
  this.wizard.showTextOnce('This one will be about enemies and switches.');
  this.wizard.showTextOnce('By the way, you can press DOWN to slam and defeat enemies.');
}

function createMap()
{
  console.log('createMap()');

  // Map
  map = scene.make.tilemap({key: 'map'});
  spawnPoint = map.findObject("Player", obj => obj.name === "spawnpoint");

  createLayers();
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

function createSwitchesAndGates() {
  var layer = map.getObjectLayer('Switches and Gates');

  gatesGroup = scene.physics.add.staticGroup();
  var gates = layer.objects
    .filter(obj => obj.type === "gate")
    .forEach(createGate);

  switchesGroup = phys.add.staticGroup();
  var switches = layer.objects
    .filter(obj => obj.type === "switch")
    .forEach(createSwitch);
}

function createGate(obj) {
  var gate = gatesGroup.create(obj.x + (obj.width/2), obj.y - (obj.height/2), 'gate');
  gate.depth = 5;
  gate.isOpen = false;
  gate.switchId = obj.properties.switchId;
  return gate;
}

function createSwitch(switchObject) {
  return new Switch(scene, switchesGroup, switchObject);
}

function createEnemies()
{
  createEnemyAnimations();

  var enemyFactory = new EnemyFactory(scene);

  var enemiesLayer = map.getObjectLayer('Enemies');

  enemies = enemiesLayer.objects.map(enemyFactory.createEnemy, enemyFactory);
  enemiesGroup = phys.add.group(enemies.map(e => e.sprite));
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

  // pouncepuss idle animation
  scene.anims.create({
    key: 'PouncePuss_idle',
    frames: [
      { key: 'pouncepusssprites', frame: 0}
    ],
    frameRate: 3,
    repeat: -1
  });

  // pouncepuss idle animation
  scene.anims.create({
    key: 'PouncePuss_pounce',
    frames: [
      { key: 'pouncepusssprites', frame: 1}
    ],
    frameRate: 3,
    repeat: -1
  });

  // pouncepuss crouch animation
  scene.anims.create({
    key: 'PouncePuss_crouch',
    frames: [
      { key: 'pouncepusssprites', frame: 2}
    ],
    frameRate: 3,
    repeat: -1
  });

  // pouncepuss walk animation
  scene.anims.create({
    key: 'PouncePuss_walk',
    frames: [
      { key: 'pouncepusssprites', frame: 3},
      { key: 'pouncepusssprites', frame: 4},
      { key: 'pouncepusssprites', frame: 5},
      { key: 'pouncepusssprites', frame: 4}
    ],
    frameRate: 3,
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
  phys.add.collider(blocks, scene.player.sprite);
  phys.add.collider(blocks, enemiesGroup, collideBlockEnemy);

  water.setCollisionByExclusion([-1,0,1,2]);
  phys.add.collider(water, scene.player.sprite, scene.player.collideWater, null, scene.player);
  phys.add.collider(water, enemiesGroup);

  phys.add.overlap(scene.player.sprite, enemiesGroup, scene.player.overlapEnemy, null, scene.player);

  collectibles.setTileIndexCallback(17, collectOne, scene);
  phys.add.overlap(scene.player.sprite, collectibles);

  tick.setTileIndexCallback(16, collideTick, scene);
  phys.add.overlap(scene.player.sprite, tick);

  phys.add.collider(scene.player.sprite, gatesGroup);
  phys.add.collider(scene.player.sprite, switchesGroup, collideSwitch);
}

function createBackground()
{
  console.log('createBackground()');

  const background = scene.add.image(0, 0, 'background');
  background.depth = -1;
  background.setPosition(background.width * 2, background.height * 2);
  background.setScale(4);

  // Scroll the background relative to the game world
  background.setScrollFactor(background.width / blocks.width,
    background.height / blocks.height);
}

function createCamera()
{
  console.log('createCamera()');

  // set bounds so the camera won't go outside the game world
  const camera = scene.cameras.main;
  camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  // make the camera follow the player
  camera.startFollow(scene.player.sprite);
}

function touchYellowTile(tile)
{
  if (!touchedYellowTiles.includes(tile))
  {
    touchedYellowTiles.push(tile);
  }
}

function collectOne(sprite, tile)
{
  console.log('collectOne()');

  collectibles.removeTileAt(tile.x, tile.y); // remove the tile
  scene.sounds.collect.play();
}

function collideYellowBlock(sprite, tile)
{
  const parent = sprite.parent;
  parent.collideYellowBlock.call(parent, tile);
}

function collideBlueBlock(sprite, tile)
{
  const parent = sprite.parent;
  parent.collideBlueBlock.call(parent, tile);
}

function collideRedBlock(sprite, tile)
{
  const parent = sprite.parent;
  parent.collideRedBlock.call(parent, tile);
}

function collideBlockEnemy(enemy, block)
{
  const parent = enemy.parent;
  parent.collideBlock.call(parent, block);
}

function collideTick(sprite, tile)
{
  console.log('collideTick()');

  if (levelComplete)
    return;

  scene.sounds.win.play();

  completeLevel();
}

function collideSwitch(sprite, switch0) {
  const parent = sprite.parent;
  parent.collideSwitch.call(parent, switch0);
}

var winJumps;
function completeLevel()
{
  console.log('completeLevel()');

  levelComplete = true;
  winJumps = 5;

  scene.player.sprite.setCollideWorldBounds(false); // Allow player out the map
}

function isTouching(sprite, tile)
{
  var tolerance = 10;

  var spriteTop = sprite.body.top;
  var spriteBottom = sprite.body.bottom;
  var spriteLeft = sprite.body.left;
  var spriteRight = sprite.body.right;

  const camera = scene.cameras.main;
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

function activateSwitch(switchId) {
  console.log('activateSwitch(' + switchId + ')');
  gatesGroup.children.entries
    .filter(gate => gate.switchId === switchId)
    .forEach(openGate);
}

function openGate(gate) {
  gate.disableBody(true, true);
}

function updateDead(time, delta) {
  scene.player.sprite.body.t
  scene.player.sprite.setVelocityX(0);
  scene.player.sprite.setVelocityY(-400);
}

function updateLevelComplete()
{
  if (winJumps > 0 &&  scene.player.sprite.body.onFloor())
  {
    scene.player.sprite.body.setVelocityY(-800); // jump up
    scene.sounds.jump.play();
    winJumps--;
  }
  else if (scene.player.sprite.body.left <= phys.world.bounds.width)
  {
    scene.player.sprite.body.setVelocityX(400); // move right
    scene.player.sprite.anims.play('walk', true); // play walk animation
    scene.player.sprite.flipX = true; // flip the sprite to the right
  }
  else
  {
    scene.player.sprite.body.setVelocityX(0);
  }
}

function updateEnemies()
{
  enemies.forEach(enemy => enemy.update.call(enemy));
}

function update(time, delta) {
  if (this.wizard.isShowing)
    return;

  if (scene.player.state.isDead)
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

  // Check if any touched yellow tiles are exiting
  var i = 0;
  while (i < touchedYellowTiles.length)
  {
    var tile = touchedYellowTiles[i];
    if (!isTouching(scene.player.sprite, tile))
    {
      // Change the tile to brown and remove it from the list
      blocks.fill(11, tile.x, tile.y, 1, 1, true);
      scene.sounds.bleep.play();
      touchedYellowTiles.splice(i, 1);
    }
    else
    {
      ++i;
    }
  }

  blocks.setCollision(11);

  updateEnemies();

  scene.player.update(time, delta);
}
