import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ObjectID,
  ObjectIdColumn
} from 'typeorm';
import Dividend from './Dividend';

@Entity()
export default class DividendsHistory {
  @ObjectIdColumn()
  _id: ObjectID;

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  symbol: string;

  @Column({ type: 'date' })
  update: Date;

  @OneToMany(() => Dividend, dividend => dividend.dividendsHistory, {
    cascade: true,
    eager: true
  })
  dividend: Dividend[];
}
