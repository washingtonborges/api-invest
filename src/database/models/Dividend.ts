import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ObjectIdColumn,
  ObjectID
} from 'typeorm';

@Entity()
export default class Dividend {
  @ObjectIdColumn()
  _id: ObjectID;

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  limit: Date;

  @Column({ type: 'date' })
  payment: Date;

  @Column()
  value: number;
}
