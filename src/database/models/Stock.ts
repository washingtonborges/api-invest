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
  price: number;

  @Column()
  fee: number;

  @Column()
  operation: boolean;
}
