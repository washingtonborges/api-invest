import { Entity, Column, ObjectIdColumn, ObjectID, Unique } from 'typeorm';

@Entity('user')
@Unique(['name'])
export default class User {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  name: string;

  @Column()
  username: string;

  @Column()
  email: string;

  @Column()
  password: string;
}
