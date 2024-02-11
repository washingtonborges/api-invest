import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';

@Entity('stock')
export default class Stock {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  symbol: string;

  @Column()
  quantity: number;

  @Column()
  date: Date;

  @Column()
  unit: number;

  @Column()
  total: number;

  @Column()
  fee: number;

  @Column()
  operation: boolean;

  @Column()
  invoice: number;
}
