import { Expose } from 'class-transformer';
import { Folder } from 'src/folder/entities/folder.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
@Expose()
export class Media extends BaseEntity {
  @Column()
  key: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column('int')
  size: number;

  // Null means the file is global — visible to every tenant (e.g. default
  // category icons) rather than owned by one.
  @JoinColumn()
  @ManyToOne(() => Tenant, { nullable: true })
  tenant: Tenant | null;

  // Null means the file sits at the root — not organized into a folder.
  @JoinColumn()
  @ManyToOne(() => Folder, { nullable: true, onDelete: 'SET NULL' })
  folder: Folder | null;
}
