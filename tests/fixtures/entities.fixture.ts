import type { DataSource } from "typeorm";
import { User, AccountStatus } from "../../src/entities/User";
import { Store } from "../../src/entities/Store";

export class TestFixtures {
  constructor(private dataSource: DataSource) {}

  async createUser(customData?: Partial<User>): Promise<User> {
    const userRepo = this.dataSource.getRepository(User);

    const user = {
      username: `user_${Date.now()}`,
      email: `user_${Date.now()}@example.com`,
      passwordHash: "hashedpassword123",
      accountStatus: AccountStatus.ACTIVE,
      ...customData,
    };

    return userRepo.save(user);
  }

  async createStore(
    ownerId: string,
    customData?: Partial<Store>
  ): Promise<Store> {
    const storeRepo = this.dataSource.getRepository(Store);

    const store = {
      ownerId,
      name: `store_${Date.now()}`,
      description: "Test store",
      createdBy: ownerId,
      ...customData,
    };

    return storeRepo.save(store);
  }

  async createUserWithStore(
    userData?: Partial<User>,
    storeData?: Partial<Store>
  ): Promise<{ user: User; store: Store }> {
    const user = await this.createUser(userData);
    const store = await this.createStore(user.id, storeData);
    return { user, store };
  }
}
