import Phaser from 'phaser';
import { createPlayerAnims } from '../anims/playeranims';
import { SceneKeys } from '../constants/scenekeys';
import { TextureKeys } from '../constants/texturekeys';
import { MyPlayer } from '../players/my-player';
import { Chair } from '../props/chair';
import { Keyboard, NavKeys } from '../types/keyboard-state';

export default class World extends Phaser.Scene {
  private map!: Phaser.Tilemaps.Tilemap;
  private cursors!: NavKeys;

  myPlayer!: MyPlayer;

  constructor() {
    super(SceneKeys.World);
  }

  registerKeys() {
    if (!this.input.keyboard) {
      throw new Error('null keyboard');
    }
    this.cursors = {
      ...this.input.keyboard?.createCursorKeys(),
      ...(this.input.keyboard?.addKeys('W,S,A,D') as Keyboard),
    };

    this.input.keyboard.disableGlobalCapture();
  }

  disableKeys() {
    if (!this.input.keyboard) {
      throw new Error('null keyboard');
    }
    this.input.keyboard.enabled = false;
  }

  enableKeys() {
    if (!this.input.keyboard) {
      throw new Error('null keyboard');
    }
    this.input.keyboard.enabled = true;
  }

  create() {
    createPlayerAnims(this.anims);

    this.map = this.make.tilemap({ key: TextureKeys.TileMap });

    // add my player into scene, and enable it's physics dynamic body
    this.myPlayer = new MyPlayer(this, 705, 500, TextureKeys.Adam, 'tempId');
    this.physics.world.enableBody(this.myPlayer, Phaser.Physics.Arcade.DYNAMIC_BODY);
    if (!this.myPlayer.body) {
      throw new Error('null my player body');
    }
    const collisionScale = [0.5, 0.2];
    this.myPlayer.body
      .setSize(this.myPlayer.width * collisionScale[0], this.myPlayer.height * collisionScale[1])
      .setOffset(this.myPlayer.width * (1 - collisionScale[0]) * 0.5, this.myPlayer.height * (1 - collisionScale[1]));
    this.add.existing(this.myPlayer);

    // groundLayer with FloorAndGround
    const FloorAndGround = this.map.addTilesetImage('FloorAndGround', TextureKeys.TilesWall);
    if (!FloorAndGround) {
      throw new Error('null FloorAndGround tielset');
    }
    const groundLayer = this.map.createLayer('Ground', FloorAndGround);
    if (!groundLayer) {
      throw new Error('null Ground Layer');
    }
    groundLayer.setCollisionByProperty({ collides: true });

    // import chair objects from Tiled map to Phaser
    const chairs = this.physics.add.staticGroup({ classType: Chair });
    const chairLayer = this.map.getObjectLayer('Chair');
    if (!chairLayer) {
      throw new Error('null Chair Layer');
    }
    chairLayer.objects.forEach((chairObj) => {
      const chair = this.addObjectFromTiled(chairs, chairObj, TextureKeys.Chairs, 'chair') as Chair;
      chair.propDirection = chairObj.properties[0].value;
    });

    // import other objects from Tiled map to Phaser
    this.addGroupFromTiled('Wall', TextureKeys.TilesWall, 'FloorAndGround', false);
    this.addGroupFromTiled('Objects', TextureKeys.Office, 'Modern_Office_Black_Shadow', false);
    this.addGroupFromTiled('ObjectsOnCollide', TextureKeys.Office, 'Modern_Office_Black_Shadow', true);
    this.addGroupFromTiled('GenericObjects', TextureKeys.Generic, 'Generic', false);
    this.addGroupFromTiled('GenericObjectsOnCollide', TextureKeys.Generic, 'Generic', true);
    this.addGroupFromTiled('Basement', TextureKeys.Basement, 'Basement', true);

    this.cameras.main.zoom = 1.5;
    this.cameras.main.startFollow(this.myPlayer, true);

    this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], groundLayer);

    this.registerKeys();
    this.enableKeys();
  }

  private addObjectFromTiled(
    group: Phaser.Physics.Arcade.StaticGroup,
    object: Phaser.Types.Tilemaps.TiledObject,
    key: TextureKeys,
    tilesetName: string
  ) {
    if (!object.x || !object.width || !object.y || !object.height || !object.gid) {
      throw new Error('invalid object');
    }

    const actualX = object.x + object.width * 0.5;
    const actualY = object.y - object.height * 0.5;

    const tileset = this.map.getTileset(tilesetName);
    if (!tileset) {
      throw new Error('invalid tileset');
    }

    const obj = group.get(actualX, actualY, key, object.gid - tileset.firstgid).setDepth(actualY);
    return obj;
  }

  private addGroupFromTiled(objectLayerName: string, key: TextureKeys, tilesetName: string, collidable: boolean) {
    const group = this.physics.add.staticGroup();

    const objectLayer = this.map.getObjectLayer(objectLayerName);
    if (!objectLayer) {
      throw new Error(`null object Layer for objectLayerName: ${objectLayerName}`);
    }

    objectLayer.objects.forEach((object) => {
      if (!object.x || !object.width || !object.y || !object.height || !object.gid) {
        throw new Error('invalid object');
      }

      const actualX = object.x + object.width * 0.5;
      const actualY = object.y - object.height * 0.5;

      const tileset = this.map.getTileset(tilesetName);
      if (!tileset) {
        throw new Error('invalid tileset');
      }

      group.get(actualX, actualY, key, object.gid - tileset.firstgid).setDepth(actualY);

      if (this.myPlayer && collidable) {
        this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], group);
      }
    });
  }

  update(t: number, dt: number) {
    if (this.myPlayer) {
      this.myPlayer.update(this.cursors);
    }
  }
}
