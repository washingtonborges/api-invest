import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';

@Entity('product')
export default class Product {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  color: string;
}
