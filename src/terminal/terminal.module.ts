import { Module, forwardRef } from '@nestjs/common';
import { TenantEntityModule } from 'src/tenant/tenant-entity.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { EventModule } from 'src/event/event.module';
import { TerminalController } from './terminal.controller';
import { TerminalService } from './terminal.service';
import { TerminalAuthService } from './terminal-auth.service';
import { PosTerminal } from './entities/terminal.entity';

@Module({
  imports: [TenantEntityModule.forFeature([PosTerminal]), TenantModule, forwardRef(() => EventModule)],
  controllers: [TerminalController],
  providers: [TerminalService, TerminalAuthService],
  exports: [TerminalService, TerminalAuthService],
})
export class TerminalModule {}
