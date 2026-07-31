import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDTO } from './dto/create-project.dto';
import { UpdateProjectDTO } from './dto/update-project.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';
import { Role, Roles } from 'src/utils/decorators/roles.decorator';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('project')
@Role([Roles.Admin])
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDTO) {
    return this.projectService.create(createProjectDto);
  }

  @Get()
  findAll() {
    return this.projectService.getAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectService.getById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDTO,
  ) {
    return this.projectService.update(id, updateProjectDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectService.remove(id);
  }
}
