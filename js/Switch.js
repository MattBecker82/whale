export default class Switch {
  constructor(scene, group, switchObject) {
    this.scene = scene;

    const spawnPoint = {
      x: switchObject.x,
      y: switchObject.y-(switchObject.height/2)
    };

    this.sprite = group.create(switchObject.x + (switchObject.width/2), switchObject.y - (switchObject.height/2), 'switch');
    this.sprite.depth = 5;

    this.sprite.body.setSize(this.sprite.width-20, this.sprite.height-10);
    this.sprite.body.setOffset(10,10);

    this.sprite.parent = this;

    this.isOn = false;
    this.switchId = switchObject.properties.switchId;
  }

  slam() {
    if (this.isOn)
      return false;

    this.sprite.setFrame(1);
    this.sprite.body.setSize(this.sprite.width-20, this.sprite.height-30);
    this.sprite.body.setOffset(10,30);

    this.scene.activateSwitch(this.switchId);

    this.scene.sounds.switchon.play();
  }
}
