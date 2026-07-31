import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import {
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_USER,
  POSTGRES_PORT,
  POSTGRES_PASSWORD,
} from 'src/utils/constants';
config();

const configService = new ConfigService();

const host = configService.get(POSTGRES_HOST);
const port = configService.get(POSTGRES_PORT);

const database = configService.get(POSTGRES_DB);
const username = configService.get(POSTGRES_USER);
const password = configService.get(POSTGRES_PASSWORD);

const AppDataSource = new DataSource({
  type: 'postgres',
  host: host,
  port: port,
  username: username,
  password: password,
  database: database,
  synchronize: false,
  entities: ['**/*.entity.ts'],
  migrations: ['src/database/migrations/*-migration.ts'],
  migrationsRun: false,
  logging: true,
});

export default AppDataSource;
