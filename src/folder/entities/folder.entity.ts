import { Expose } from 'class-transformer';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity()
@Expose()
// Partial index so soft-deleted folders don't block reusing their name.
// Root-level folders (parent IS NULL) aren't caught by this constraint —
// Postgres treats NULLs as distinct — so the service also checks explicitly.
@Index('UQ_folder_name_parent_tenant_active', ['name', 'parent', 'tenant'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class Folder extends BaseEntity {
  @Column()
  name: string;

  @JoinColumn()
  @ManyToOne(() => Folder, { nullable: true, onDelete: 'RESTRICT' })
  parent: Folder | null;

  @OneToMany(() => Folder, (folder) => folder.parent)
  children: Folder[];

  @JoinColumn()
  @ManyToOne(() => Tenant)
  tenant: Tenant;
}
