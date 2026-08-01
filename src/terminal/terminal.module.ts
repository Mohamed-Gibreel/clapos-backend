import { Module } from '@nestjs/common';
import { TenantEntityModule } from 'src/tenant/tenant-entity.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { TerminalController } from './terminal.controller';
import { TerminalService } from './terminal.service';
import { PosTerminal } from './entities/terminal.entity';

@Module({
  imports: [TenantEntityModule.forFeature([PosTerminal]), TenantModule],
  controllers: [TerminalController],
  providers: [TerminalService],
  exports: [TerminalService],
})
export class TerminalModule {}
