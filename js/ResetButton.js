export default class ResetButton {
  constructor(scene)
  {
    console.log('new ResetButton()');

    this.scene = scene;
    this.image = scene.add.image(1150, 50, 'restart');
    this.image.depth = 10;
    this.image.setScrollFactor(0);
    this.image.setInteractive().on('pointerdown', () => this.onPointerDown());
  }

  onPointerDown() {
    this.doRestart(this.scene);
  }

  doRestart(scene)
  {
    console.log('doRestart()');

    scene.registry.destroy();
    scene.events.off();
    scene.scene.restart();
  }
}
