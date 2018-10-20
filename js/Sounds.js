//boing sound: https://freesound.org/people/juskiddink/sounds/140867/
//bleep sound: https://freesound.org/people/Greencouch/sounds/124907/
//jump sound: https://freesound.org/people/cabled_mess/sounds/350900/
//spash sound: https://freesound.org/people/soundscalpel.com/sounds/110393/
//fail sound: https://freesound.org/people/NotR/sounds/172949/
//win sound: https://freesound.org/people/LittleRobotSoundFactory/sounds/270404/
//slam sound: https://freesound.org/people/volivieri/sounds/161189/
//collect sound: https://freesound.org/people/suntemple/sounds/253172/
//hurt sound: https://freesound.org/people/OwlStorm/sounds/404747/
//enemydie sound: https://freesound.org/people/LittleRobotSoundFactory/sounds/270306/
//switchon sound: https://freesound.org/people/InspectorJ/sounds/403007/

export default class Sounds {
  constructor(scene) {
    this.scene = scene;
  }

  preload() {
    const scene = this.scene;

    scene.load.audio('boing', 'assets/140867__juskiddink__boing.wav');
    scene.load.audio('bleep', 'assets/124907__greencouch__bleeps-double-4.wav');
    scene.load.audio('jump', 'assets/350900__cabled-mess__jump-c-07.wav');
    scene.load.audio('splash', 'assets/110393__soundscalpel-com__water-splash.wav');
    scene.load.audio('fail', 'assets/172949__notr__sadtrombones.mp3');
    scene.load.audio('win', 'assets/270404__littlerobotsoundfactory__jingle-achievement-00.wav');
    scene.load.audio('slam', 'assets/161189__volivieri__storm-door-slam-02.wav');
    scene.load.audio('collect', 'assets/253172__suntemple__retro-bonus-pickup-sfx.wav');
    scene.load.audio('hurt', 'assets/404747__owlstorm__retro-video-game-sfx-ouch.wav');
    scene.load.audio('enemydie', 'assets/270306__littlerobotsoundfactory__explosion-02.wav');
    scene.load.audio('switchon', 'assets/403007__inspectorj__ui-confirmation-alert-a2.wav');
  }

  create() {
    const scene = this.scene;

    this.boing = scene.sound.add('boing');
    this.bleep = scene.sound.add('bleep');
    this.jump = scene.sound.add('jump');
    this.splash = scene.sound.add('splash');
    this.fail = scene.sound.add('fail');
    this.win = scene.sound.add('win');
    this.slam = scene.sound.add('slam');
    this.collect = scene.sound.add('collect');
    this.hurt = scene.sound.add('hurt');
    this.enemydie = scene.sound.add('enemydie');
    this.switchon = scene.sound.add('switchon');
  }
}
