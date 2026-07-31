import { InjectRepository } from '@nestjs/typeorm';
import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Repository, FindOneOptions, FindManyOptions } from 'typeorm';

import { User } from './entities/user.entity';

import { CreateUserDTO } from './dto/create-user.dto';

import {
  failResult,
  successResult,
  convertToInstance,
} from '../utils/dto-validator';

import { createResultClass, ResultType } from '../utils/result';
import { FindUserDTO } from './dto/find-user.dto';
import { RoleService } from 'src/role/role.service';
import { TenantService } from 'src/tenant/tenant.service';
import { Roles } from 'src/utils/decorators/roles.decorator';

@Injectable()
export class UserService {
  allowedRoles = [Roles.Admin, Roles.User];

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => RoleService))
    private roleService: RoleService,
    private tenantService: TenantService,
  ) {}

  async create(
    createUserDto: CreateUserDTO,
  ): Promise<ResultType<User, string[]>> {
    const Result = createResultClass<User, string[]>();
    try {
      const isUserValid = convertToInstance(CreateUserDTO, createUserDto);

      if (!isUserValid.isSuccess) {
        return failResult(Result, isUserValid.error);
      }

      const userAlreadyExists = await this.userRepository.findOne({
        where: {
          emailAddress: isUserValid.value.emailAddress,
        },
      });

      if (userAlreadyExists) {
        return Result.error({
          error: ['User already exists'],
          errorCode: HttpStatus.BAD_REQUEST,
        });
      }

      const role = await this.roleService.findOne({
        where: {
          id: isUserValid.value.roleId,
        },
      });

      if (!role.isSuccess) {
        return Result.error({
          error: ['Role does not exist'],
          errorCode: HttpStatus.BAD_REQUEST,
        });
      }

      if (!this.allowedRoles.includes(role.value.name)) {
        return Result.error({
          error: [
            `You can only create users with one of the following roles: ${this.allowedRoles.join(', ').toString()}`,
          ],
          errorCode: HttpStatus.BAD_REQUEST,
        });
      }

      const tenant = await this.tenantService.findOne({
        where: {
          id: isUserValid.value.tenantId,
        },
      });

      if (!tenant.isSuccess) {
        return Result.error({
          error: ['Tenant does not exist'],
          errorCode: HttpStatus.BAD_REQUEST,
        });
      }

      let user = this.userRepository.create();

      user.name = createUserDto.name;
      user.password = createUserDto.password;
      user.emailAddress = createUserDto.emailAddress;

      user.role = role.value;
      user.tenant = tenant.value;

      user = await this.userRepository.save(user);

      return successResult(Result, user);
    } catch (e) {
      return failResult(Result, e.toString());
    }
  }

  async getAll() {
    const Result = createResultClass<User[], string[]>();
    try {
      var users = await this.find({});
      if (!users.isSuccess) {
        return Result.error({
          error: [users.error],
          errorCode: users.errorCode,
        });
      }
      return Result.success(users.value);
    } catch (e) {
      return Result.error({
        error: e,
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async deleteUserById(id: number) {
    const Result = createResultClass<string, string>();
    try {
      const user = await this.findOne({
        where: {
          id: id,
        },
      });

      if (!user.isSuccess) {
        return Result.error({
          error: user.error,
          errorCode: user.errorCode,
        });
      }

      const deleteRes = await this.userRepository.delete({
        id: id,
      });

      if ((deleteRes.affected ?? 0) <= 0) {
        return Result.error({
          error: 'Unable to delete user',
          errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      return Result.success('Deleted user successfully');
    } catch (e) {
      return Result.error({
        error: e,
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async findByUsernameAndPassword({
    user: { password, name },
  }: {
    user: FindUserDTO;
  }): Promise<ResultType<User, string>> {
    const Result = createResultClass<User, string>();
    try {
      const userFound = await this.findOne({
        where: {
          name: name,
          password: password,
        },
        relations: ['role', 'tenant'],
      });

      if (!userFound.isSuccess) {
        return failResult(Result, userFound.error);
      }
      return successResult(Result, userFound.value);
    } catch (e) {
      return failResult(Result, e.toString());
    }
  }

  async findOne(
    conditions: FindOneOptions<User>,
  ): Promise<ResultType<User, string>> {
    const Result = createResultClass<User, string>();
    try {
      const userAlreadyExists = await this.userRepository.findOne(conditions);
      if (!userAlreadyExists) {
        return failResult(Result, 'User not found');
      }
      return successResult(Result, userAlreadyExists);
    } catch (e) {
      return failResult(Result, e.toString());
    }
  }

  async find(
    conditions: FindManyOptions<User>,
  ): Promise<ResultType<User[], string>> {
    const Result = createResultClass<User[], string>();
    try {
      const userAlreadyExists = await this.userRepository.find(conditions);
      if (!userAlreadyExists) {
        return failResult(Result, 'User not found');
      }
      return successResult(Result, userAlreadyExists);
    } catch (e) {
      return failResult(Result, e.toString());
    }
  }

  async login(id: number) {
    const Result = createResultClass<User, string[]>();
    try {
      const user = await this.userRepository.findOne({
        where: {
          id: id,
        },
        relations: ['role', 'tenant'],
      });

      if (!user)
        return Result.error({
          errorCode: HttpStatus.NOT_FOUND,
          error: ['Unable to find user'],
        });

      const updateRes = await this.userRepository.update(
        { id: id },
        { last_login_at: new Date() },
      );

      if ((updateRes.affected ?? 0) <= 0) {
        return Result.error({
          error: ['Unable to update user last_login_at'],
          errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
      return Result.success(user);
    } catch (error) {
      return Result.error({
        error: error,
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

}
