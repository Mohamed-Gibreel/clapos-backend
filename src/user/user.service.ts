import { InjectRepository } from '@nestjs/typeorm';
import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Repository, FindOneOptions, FindManyOptions } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { failResult, successResult, convertToInstance } from '../utils/dto-validator';
import { createResultClass, ResultType } from '../utils/result';
import { RoleService } from 'src/role/role.service';
import { TenantService } from 'src/tenant/tenant.service';
import { Roles } from 'src/utils/decorators/roles.decorator';
import { ErrorCode } from 'src/utils/error-codes';

@Injectable()
export class UserService {
  allowedRoles = [Roles.Owner, Roles.Manager, Roles.Cashier];

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => RoleService))
    private roleService: RoleService,
    private tenantService: TenantService,
  ) {}

  async create(createUserDto: CreateUserDTO): Promise<ResultType<User, string[]>> {
    const Result = createResultClass<User, string[]>();
    try {
      const isUserValid = convertToInstance(CreateUserDTO, createUserDto);
      if (!isUserValid.isSuccess) {
        return failResult(Result, isUserValid.error);
      }

      const userAlreadyExists = await this.userRepository.findOne({
        where: {
          emailAddress: isUserValid.value.emailAddress,
          tenant: { id: isUserValid.value.tenantId },
        },
      });

      if (userAlreadyExists) {
        return Result.error({
          error: [ErrorCode.USER_ALREADY_EXISTS],
          errorCode: HttpStatus.BAD_REQUEST,
        });
      }

      const role = await this.roleService.findOne({
        where: { id: isUserValid.value.roleId },
      });

      if (!role.isSuccess) {
        return Result.error({
          error: [ErrorCode.ROLE_NOT_FOUND],
          errorCode: HttpStatus.BAD_REQUEST,
        });
      }

      if (!this.allowedRoles.includes(role.value.name)) {
        return Result.error({
          error: [ErrorCode.INVALID_ROLE],
          errorCode: HttpStatus.BAD_REQUEST,
        });
      }

      const tenant = await this.tenantService.findOne({
        where: { id: isUserValid.value.tenantId },
      });

      if (!tenant.isSuccess) {
        return Result.error({
          error: [ErrorCode.TENANT_NOT_FOUND],
          errorCode: HttpStatus.BAD_REQUEST,
        });
      }

      let user = this.userRepository.create();
      user.name = createUserDto.name;
      user.password = await bcrypt.hash(createUserDto.password, 10);
      user.emailAddress = createUserDto.emailAddress;
      user.role = role.value;
      user.tenant = tenant.value;

      user = await this.userRepository.save(user);
      return successResult(Result, user);
    } catch (e) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getAll(tenantId: string) {
    const Result = createResultClass<User[], string[]>();
    try {
      const users = await this.find({
        where: { tenant: { id: tenantId } },
      });
      if (!users.isSuccess) {
        return Result.error({ error: [users.error], errorCode: users.errorCode });
      }
      return Result.success(users.value);
    } catch (e) {
      return Result.error({ error: e, errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getById(id: string, tenantId: string) {
    const Result = createResultClass<User, string[]>();
    try {
      const user = await this.userRepository.findOne({
        where: { id, tenant: { id: tenantId } },
        relations: ['role', 'tenant'],
      });
      if (!user) {
        return Result.error({ error: [ErrorCode.USER_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }
      return Result.success(user);
    } catch (e) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async update(id: string, dto: UpdateUserDTO, tenantId: string) {
    const Result = createResultClass<User, string[]>();
    try {
      const user = await this.userRepository.findOne({
        where: { id, tenant: { id: tenantId } },
        relations: ['role', 'tenant'],
      });
      if (!user) {
        return Result.error({ error: [ErrorCode.USER_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }

      if (dto.name) user.name = dto.name;

      if (dto.emailAddress && dto.emailAddress !== user.emailAddress) {
        const conflict = await this.userRepository.findOne({
          where: { emailAddress: dto.emailAddress, tenant: { id: tenantId } },
        });
        if (conflict) {
          return Result.error({ error: [ErrorCode.USER_ALREADY_EXISTS], errorCode: HttpStatus.CONFLICT });
        }
        user.emailAddress = dto.emailAddress;
      }

      if (dto.password) {
        user.password = await bcrypt.hash(dto.password, 10);
      }

      if (dto.roleId) {
        const role = await this.roleService.findOne({ where: { id: dto.roleId } });
        if (!role.isSuccess) {
          return Result.error({ error: [ErrorCode.ROLE_NOT_FOUND], errorCode: HttpStatus.BAD_REQUEST });
        }
        if (!this.allowedRoles.includes(role.value.name)) {
          return Result.error({ error: [ErrorCode.INVALID_ROLE], errorCode: HttpStatus.BAD_REQUEST });
        }
        user.role = role.value;
      }

      const saved = await this.userRepository.save(user);
      return Result.success(saved);
    } catch (e) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async deleteUserById(id: string) {
    const Result = createResultClass<string, string>();
    try {
      const user = await this.findOne({ where: { id: id } });
      if (!user.isSuccess) {
        return Result.error({ error: user.error, errorCode: user.errorCode });
      }

      const deleteRes = await this.userRepository.delete({ id: id });
      if ((deleteRes.affected ?? 0) <= 0) {
        return Result.error({
          error: ErrorCode.USER_DELETE_FAILED,
          errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      return Result.success('Deleted user successfully');
    } catch (e) {
      return Result.error({ error: e, errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  /**
   * Find a user by name scoped to a specific tenant.
   * Used during login — password comparison is done separately with bcrypt.
   */
  async findByName({
    name,
    tenantId,
  }: {
    name: string;
    tenantId: string;
  }): Promise<ResultType<User, string>> {
    const Result = createResultClass<User, string>();
    try {
      const user = await this.userRepository.findOne({
        where: { name, tenant: { id: tenantId } },
        relations: ['role', 'tenant'],
      });
      if (!user) return failResult(Result, ErrorCode.USER_NOT_FOUND);
      return successResult(Result, user);
    } catch (e) {
      return failResult(Result, ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(conditions: FindOneOptions<User>): Promise<ResultType<User, string>> {
    const Result = createResultClass<User, string>();
    try {
      const user = await this.userRepository.findOne(conditions);
      if (!user) return failResult(Result, ErrorCode.USER_NOT_FOUND);
      return successResult(Result, user);
    } catch (e) {
      return failResult(Result, ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async find(conditions: FindManyOptions<User>): Promise<ResultType<User[], string>> {
    const Result = createResultClass<User[], string>();
    try {
      const users = await this.userRepository.find(conditions);
      if (!users) return failResult(Result, ErrorCode.USER_NOT_FOUND);
      return successResult(Result, users);
    } catch (e) {
      return failResult(Result, ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async login(id: string) {
    const Result = createResultClass<User, string[]>();
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['role', 'tenant'],
      });

      if (!user) {
        return Result.error({ errorCode: HttpStatus.NOT_FOUND, error: [ErrorCode.USER_NOT_FOUND] });
      }

      const updateRes = await this.userRepository.update({ id }, { last_login_at: new Date() });
      if ((updateRes.affected ?? 0) <= 0) {
        return Result.error({
          error: [ErrorCode.USER_UPDATE_FAILED],
          errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
      return Result.success(user);
    } catch (error) {
      return Result.error({ error, errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
}
