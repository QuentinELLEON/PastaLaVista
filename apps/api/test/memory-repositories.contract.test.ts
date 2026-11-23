import { createMemoryRepositories } from '../src/infrastructure/memory';
import { runRepositoryContracts } from './contracts/repository-contracts';

runRepositoryContracts('implémentation en mémoire', () => createMemoryRepositories());
