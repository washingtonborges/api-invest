import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ObjectIdColumn,
  ObjectID
} from 'typeorm';

@Entity()
export default class DividendBlacklist {
  @ObjectIdColumn()
  _id: ObjectID;

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  symbol: string;

  @Column({ type: 'date' })
  start: Date;
}
