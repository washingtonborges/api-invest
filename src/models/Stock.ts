import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';

@Entity('stock')
export default class Product {
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
  fee: string;

  @Column()
  operation: boolean;
}
