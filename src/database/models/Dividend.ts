import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ObjectIdColumn,
  ObjectID
} from 'typeorm';
import { DividendsHistory } from './DividendsHistory';

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

  @ManyToOne(
    () => DividendsHistory,
    (dividendsHistory: { dividend: any }) => dividendsHistory.dividend
  )
  dividendsHistory: DividendsHistory;
}
