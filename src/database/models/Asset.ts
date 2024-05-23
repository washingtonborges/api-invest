import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ObjectID,
  ObjectIdColumn
} from 'typeorm';
import Dividend from './Dividend';

@Entity()
export default class Asset {
  @ObjectIdColumn()
  _id: ObjectID;

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  symbol: string;

  @Column()
  name: string;

  @Column()
  cnpj: string;

  @Column({ type: 'date' })
  update: Date;

  @Column()
  dividend: Dividend[];
}
