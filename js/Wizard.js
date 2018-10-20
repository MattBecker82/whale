export default class Wizard {
  constructor(scene, shownText) {
    console.log('new Wizard()');

    this.scene = scene;
    this.shownText = shownText;

    // Wizard info screen
    const graphics = scene.add.graphics(0, 0);
    graphics.depth = 10;
    graphics.setScrollFactor(0);
    graphics.lineStyle(5, 0x802030, 1.0);1
    graphics.fillStyle(0xFFCFAF, 1.0);
    graphics.fillRect(150, 150, 900, 500);
    graphics.strokeRect(150, 150, 900, 500);

    const image = scene.add.image(300, 400, 'wizard');
    image.depth = 11;
    image.setScrollFactor(0);

    this.text = scene.add.text(500, 200, '', {
      fontFamily: 'arial',
      fontSize: '48px',
      fill: '#000000'
    });
    this.text.depth = 12;
    this.text.setWordWrapWidth(500);
    this.text.setScrollFactor(0);

    this.button = scene.add.image(900, 550, 'wizardOk');
    this.button.depth = 12;
    this.button.setScrollFactor(0);
    this.button.setInteractive().on('pointerdown', this.wizardOk, this);

    this.screen = scene.add.group();
    this.screen.add(graphics);
    this.screen.add(image);
    this.screen.add(this.text);
    this.screen.add(this.button);

    scene.input.keyboard.on('keydown_ENTER', this.wizardOk, this);

    this.isShowing = true;

    this.textList = [];
    this.hide();
  }

  wizardOk() {
    if (this.isShowing)
      this.advanceWizardText();
  }

  advanceWizardText()
  {
    if (this.textList.length > 0)
    {
      const nextText = this.textList.shift();
      this.text.setText(nextText);
      this.show();
    }
    else
    {
      this.hide();
    }
  }

  show()
  {
    if (!this.isShowing)
    {
      this.button.setInteractive();
      this.screen.toggleVisible();
      this.scene.physics.pause();
      this.isShowing = true;
    }
  }

  hide()
  {
    if (this.isShowing)
    {
      this.button.disableInteractive();
      this.screen.toggleVisible();
      this.scene.physics.resume();
      this.isShowing = false;
    }
  }

  showText(text)
  {
    this.textList.push(text);

    if (!this.isShowing)
      this.advanceWizardText();
  }

  showTextOnce(text) {
    if (this.shownText.includes(text))
      return;

    this.showText(text);
    this.shownText.push(text);
  }

}
