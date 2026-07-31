import { EntityManager, ObjectLiteral, Repository } from 'typeorm';

export function getRepo<T extends ObjectLiteral>(
  manager: EntityManager | undefined,
  defaultRepo: Repository<T>,
) {
  return manager ? manager.getRepository<T>(defaultRepo.target) : defaultRepo;
}
