import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateRoleDTO } from './dto/create-role.dto';
import { UpdateRoleDTO } from './dto/update-role.dto';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { createResultClass } from 'src/utils/result';
import { convertToInstance } from 'src/utils/dto-validator';
import { ErrorCode } from 'src/utils/error-codes';
import { isUniqueViolation } from 'src/utils/db-errors';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}
  async create(createRoleDto: CreateRoleDTO) {
    const Result = createResultClass<Role, string[]>();
    try {
      const isBodyValid = convertToInstance(CreateRoleDTO, createRoleDto);
      if (!isBodyValid.isSuccess) {
        return Result.error({
          error: isBodyValid.error,
          errorCode: HttpStatus.BAD_REQUEST,
        });
      }
      const role = this.rolesRepository.create();
      role.name = isBodyValid.value.name;

      const savedRole = await this.rolesRepository.save(role);
      return Result.success(savedRole);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return Result.error({
          error: [ErrorCode.ROLE_NAME_CONFLICT],
          errorCode: HttpStatus.CONFLICT,
        });
      }
      return Result.error({
        error: error,
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async getAll() {
    const Result = createResultClass<Role[], string[]>();
    try {
      const roles = await this.rolesRepository.find();
      return Result.success(roles);
    } catch (error) {
      return Result.error({
        error: error,
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async getById(id: string) {
    const Result = createResultClass<Role, string[]>();
    try {
      const role = await this.findOne({
        where: {
          id: id,
        },
      });

      if (!role.isSuccess) {
        return Result.error({
          error: role.error,
          errorCode: role.errorCode,
        });
      }
      return Result.success(role.value);
    } catch (error) {
      return Result.error({
        error: error,
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async update(id: string, updateRoleDto: UpdateRoleDTO) {
    const Result = createResultClass<Role, string[]>();
    try {
      const isBodyValid = convertToInstance(UpdateRoleDTO, updateRoleDto);
      if (!isBodyValid.isSuccess) {
        return Result.error({
          error: isBodyValid.error,
          errorCode: HttpStatus.BAD_REQUEST,
        });
      }

      const existingRole = await this.findOne({
        where: {
          id: id,
        },
      });
      if (!existingRole.isSuccess) {
        return Result.error({
          error: existingRole.error,
          errorCode: existingRole.errorCode,
        });
      }
      const updatedRole = this.rolesRepository.merge(
        existingRole.value,
        isBodyValid.value,
      );

      const updateResult = await this.rolesRepository.update(
        {
          id: id,
        },
        updatedRole,
      );

      if ((updateResult.affected ?? 0) <= 0) {
        return Result.error({
          error: [ErrorCode.ROLE_UPDATE_FAILED],
          errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
      return Result.success(updatedRole);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return Result.error({
          error: [ErrorCode.ROLE_NAME_CONFLICT],
          errorCode: HttpStatus.CONFLICT,
        });
      }
      return Result.error({
        error: error,
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async remove(id: string) {
    const Result = createResultClass<string, string[]>();
    try {
      const existingRole = await this.findOne({
        where: {
          id: id,
        },
      });
      if (!existingRole.isSuccess) {
        return Result.error({
          error: existingRole.error,
          errorCode: existingRole.errorCode,
        });
      }

      const deleteResult = await this.rolesRepository.delete({
        id: id,
      });

      if ((deleteResult.affected ?? 0) <= 0) {
        return Result.error({
          error: [ErrorCode.ROLE_DELETE_FAILED],
          errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
      return Result.success('Deleted role successfully');
    } catch (error) {
      return Result.error({
        error: error,
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async find(options: FindManyOptions<Role>) {
    const Result = createResultClass<Role[], string[]>();
    try {
      const roles = await this.rolesRepository.find(options);
      return Result.success(roles);
    } catch (error) {
      return Result.error({
        error: [error],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async findOne(options: FindOneOptions<Role>) {
    const Result = createResultClass<Role, string[]>();
    try {
      const role = await this.rolesRepository.findOne(options);
      if (role == null) {
        return Result.error({
          error: [ErrorCode.ROLE_NOT_FOUND],
          errorCode: HttpStatus.NOT_FOUND,
        });
      }
      return Result.success(role);
    } catch (error) {
      return Result.error({
        error: [error],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
