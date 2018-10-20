export default class StatusBar {
  constructor(scene) {
    console.log('new StatusBar()');

    this.scene = scene;
    this.image = scene.add.image(50, 50, 'whalesmall');
    this.image.depth = 10;
    this.image.setScrollFactor(0);

    this.livesText = scene.add.text(80, 40, 'x', {
      fontSize: '30px',
      fill: '#000000'
    });
    this.livesText.setScrollFactor(0);
  }

  update(player) {
    const state = player.state;
    this.livesText.setText('x' + state.lives);
  }
}
