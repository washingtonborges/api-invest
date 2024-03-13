import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';

@Entity('latest-quote')
export default class LatestQuote {
  @ObjectIdColumn()
  _id?: ObjectID;

  @Column()
  symbol: string;

  @Column()
  date: Date;

  @Column()
  unit: number;
}
