import { Schema, type } from '@colyseus/schema';

export class MyRoomState extends Schema {
  @type('string')
  mySynchronizedProperty = 'Hello world';
}
