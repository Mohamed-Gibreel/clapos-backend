import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateProjectDTO } from './dto/create-project.dto';
import { UpdateProjectDTO } from './dto/update-project.dto';
import { createResultClass } from 'src/utils/result';
import { Project } from './entities/project.entity';
import {
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  QueryFailedError,
} from 'typeorm';
import { convertToInstance } from 'src/utils/dto-validator';
import { TenantService } from 'src/tenant/tenant.service';
import { TenantRepository } from 'src/utils/decorators/tenant-repository.decorator';
import { TenantScopedRepository } from 'src/tenant/tenant-scoped.repository';
import { getRepo } from 'src/utils/get-repository';
import { ErrorCode } from 'src/utils/error-codes';

@Injectable()
export class ProjectService {
  constructor(
    @TenantRepository(Project)
    private readonly projectsRepository: TenantScopedRepository<Project>,
    private tenantService: TenantService,
  ) {}

  async create(createProjectDto: CreateProjectDTO) {
    const Result = createResultClass<Project, string[]>();
    try {
      const isBodyValid = convertToInstance(CreateProjectDTO, createProjectDto);
      if (!isBodyValid.isSuccess) {
        return Result.error({
          error: isBodyValid.error,
          errorCode: HttpStatus.BAD_REQUEST,
        });
      }

      const tenant = await this.tenantService.findOne({
        where: { id: isBodyValid.value.tenantId },
      });

      if (!tenant.isSuccess) {
        return Result.error({
          errorCode: tenant.errorCode,
          error: tenant.error,
        });
      }

      const project = this.projectsRepository.create();

      project.tenant = tenant.value;
      project.name = isBodyValid.value.name;

      const savedProject = await this.projectsRepository.save(project);
      return Result.success(savedProject);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const err = error as any;
        if (err.code === '23505') {
          return Result.error({
            error: [ErrorCode.PROJECT_NAME_CONFLICT],
            errorCode: HttpStatus.CONFLICT,
          });
        }
      }
      return Result.error({
        error: [ErrorCode.INTERNAL_SERVER_ERROR],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async getAll() {
    const Result = createResultClass<Project[], string[]>();
    try {
      const projects = await this.projectsRepository.find({
        relations: ['tenant'],
      });
      return Result.success(projects);
    } catch (error) {
      return Result.error({
        error: [ErrorCode.INTERNAL_SERVER_ERROR],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async getById(id: string) {
    const Result = createResultClass<Project, string[]>();
    try {
      const project = await this.findOne({
        where: {
          id: id,
        },
        relations: ['tenant'],
      });

      if (!project.isSuccess) {
        return Result.error({
          error: project.error,
          errorCode: project.errorCode,
        });
      }
      return Result.success(project.value);
    } catch (error) {
      return Result.error({
        error: [ErrorCode.INTERNAL_SERVER_ERROR],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async update(id: string, updateProjectDto: UpdateProjectDTO) {
    const Result = createResultClass<Project, string[]>();
    try {
      const isBodyValid = convertToInstance(UpdateProjectDTO, updateProjectDto);
      if (!isBodyValid.isSuccess) {
        return Result.error({
          error: isBodyValid.error,
          errorCode: HttpStatus.BAD_REQUEST,
        });
      }

      const existingProject = await this.findOne({
        where: {
          id: id,
        },
      });
      if (!existingProject.isSuccess) {
        return Result.error({
          error: existingProject.error,
          errorCode: existingProject.errorCode,
        });
      }
      const updatedProject = this.projectsRepository.merge(
        existingProject.value,
        isBodyValid.value,
      );

      const updateResult = await this.projectsRepository.update(
        {
          id: id,
        },
        updatedProject,
      );

      if ((updateResult.affected ?? 0) <= 0) {
        return Result.error({
          error: [ErrorCode.PROJECT_UPDATE_FAILED],
          errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
      return Result.success(updatedProject);
    } catch (error) {
      return Result.error({
        error: [ErrorCode.INTERNAL_SERVER_ERROR],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async remove(id: string) {
    const Result = createResultClass<string, string[]>();
    try {
      const existingProject = await this.findOne({
        where: {
          id: id,
        },
      });
      if (!existingProject.isSuccess) {
        return Result.error({
          error: existingProject.error,
          errorCode: existingProject.errorCode,
        });
      }

      const deleteResult = await this.projectsRepository.delete({
        id: id,
      });

      if ((deleteResult.affected ?? 0) <= 0) {
        return Result.error({
          error: [ErrorCode.PROJECT_DELETE_FAILED],
          errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
      return Result.success('Deleted project successfully');
    } catch (error) {
      return Result.error({
        error: [ErrorCode.INTERNAL_SERVER_ERROR],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async find(options: FindManyOptions<Project>) {
    const Result = createResultClass<Project[], string[]>();
    try {
      const projects = await this.projectsRepository.find(options);
      return Result.success(projects);
    } catch (error) {
      return Result.error({
        error: [ErrorCode.INTERNAL_SERVER_ERROR],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async findOne(options: FindOneOptions<Project>, manager?: EntityManager) {
    const Result = createResultClass<Project, string[]>();
    try {
      const projectRepo = getRepo(manager, this.projectsRepository);
      const project = await projectRepo.findOne(options);
      if (project == null) {
        return Result.error({
          error: [ErrorCode.PROJECT_NOT_FOUND],
          errorCode: HttpStatus.NOT_FOUND,
        });
      }
      return Result.success(project);
    } catch (error) {
      return Result.error({
        error: [ErrorCode.INTERNAL_SERVER_ERROR],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
