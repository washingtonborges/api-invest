import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';

@Entity('invoice-raw')
export default class InvoiceRaw {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  content: string;

  @Column()
  dateReader: Date;

  @Column()
  number: number;
}
