import { Expose } from 'class-transformer';
import { Project } from 'src/project/entities/project.entity';
import { User } from 'src/user/entities/user.entity';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity()
@Expose()
export class Tenant extends BaseEntity {
  @Column()
  name: string;

  @OneToMany(() => User, (u) => u.tenant)
  users: User[];

  @OneToMany(() => Project, (p) => p.tenant)
  projects: Project[];
}
