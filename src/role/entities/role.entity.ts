import { Expose } from 'class-transformer';
import { User } from 'src/user/entities/user.entity';
import { Roles } from 'src/utils/decorators/roles.decorator';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@Expose()
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: Roles,
    unique: true,
  })
  name: Roles;

  @OneToMany(() => User, (u) => u.role)
  users: User[];
}
