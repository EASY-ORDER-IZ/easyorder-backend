import { DataSource } from "typeorm";
import dotenv from "dotenv";
import path from "path";
import { User } from "../../src/entities/User";
import { Store } from "../../src/entities/Store";
import { UserRole } from "../../src/entities/UserRole";
import { OtpCode } from "../../src/entities/OtpCode";
import { TestFixtures } from "../fixtures/entities.fixture";

dotenv.config({
  path: path.resolve(process.cwd(), ".env.test"),
  override: true,
});

describe("User-Store Relationship Tests", () => {
  let dataSource: DataSource;
  let fixtures: TestFixtures;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: "postgres",
      host: process.env.DB_HOST ?? "localhost",
      port: Number(process.env.DB_PORT) || 5433,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [User, Store, UserRole, OtpCode],
      synchronize: true,
      dropSchema: true,
      logging: false,
    });
    await dataSource.initialize();
    fixtures = new TestFixtures(dataSource);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    await dataSource
      .getRepository(OtpCode)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(Store)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(UserRole)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(User)
      .createQueryBuilder()
      .delete()
      .execute();
  });

  it("should connect to the test database successfully", () => {
    expect(dataSource.isInitialized).toBe(true);
  });

  it("should create a user successfully", async () => {
    const user = await fixtures.createUser({
      username: "testuser",
      email: "test@example.com",
    });

    expect(user.id).toBeDefined();
    expect(user.username).toBe("testuser");
    expect(user.email).toBe("test@example.com");
  });

  it("should create store for a user", async () => {
    const { user, store } = await fixtures.createUserWithStore(
      { username: "ahmad", email: "ahmad@example.com" },
      { name: "Ahmad Store", description: "A store for Ahmad" }
    );

    expect(store.id).toBeDefined();
    expect(store.ownerId).toBe(user.id);
    expect(store.name).toBe("Ahmad Store");
  });

  it("should guarantee that a user can only have one store", async () => {
    const user = await fixtures.createUser({
      username: "ahmad",
      email: "ahmad@example.com",
    });

    await fixtures.createStore(user.id, { name: "First Store" });

    await expect(
      fixtures.createStore(user.id, { name: "Second Store" })
    ).rejects.toThrow();
  });

  it("should return the user with his store info", async () => {
    const { user } = await fixtures.createUserWithStore(
      { username: "ahmad", email: "ahmad@example.com" },
      { name: "Ahmad Store" }
    );

    const userWithStore = await dataSource.getRepository(User).findOne({
      where: { id: user.id },
      relations: ["store"],
    });

    expect(userWithStore).toBeDefined();
    expect(userWithStore?.store).toBeDefined();
    expect(userWithStore?.store?.name).toBe("Ahmad Store");
    expect(userWithStore?.store?.ownerId).toBe(user.id);
  });

  it("should not create store for non-existing user", async () => {
    const fakeUserId = "fgfgfffg-gggg-4ggg-8ggg-ggg";

    await expect(
      dataSource.getRepository(Store).save({
        ownerId: fakeUserId,
        name: "Invalid Store",
      })
    ).rejects.toThrow();
  });

  it("should enforce unique store name constraint", async () => {
    const user1 = await fixtures.createUser({
      username: "user1",
      email: "user1@example.com",
    });

    const user2 = await fixtures.createUser({
      username: "user2",
      email: "user2@example.com",
    });

    await fixtures.createStore(user1.id, { name: "Unique Store Name" });

    await expect(
      fixtures.createStore(user2.id, { name: "Unique Store Name" })
    ).rejects.toThrow();
  });

  it("should keep store when user is soft-deleted", async () => {
    const { user, store } = await fixtures.createUserWithStore(
      { username: "deleteduser", email: "deleted@example.com" },
      { name: "Store to Keep" }
    );

    await dataSource.getRepository(User).softDelete(user.id);

    const foundStore = await dataSource.getRepository(Store).findOne({
      where: { id: store.id },
    });
    expect(foundStore).toBeDefined();
    expect(foundStore?.name).toBe("Store to Keep");

    const deletedUser = await dataSource.getRepository(User).findOne({
      where: { id: user.id },
      withDeleted: true,
    });
    expect(deletedUser?.deletedAt).toBeDefined();
  });

  it("should enforce unique email constraint", async () => {
    await fixtures.createUser({
      username: "user1",
      email: "duplicate@example.com",
    });

    await expect(
      fixtures.createUser({
        username: "user2",
        email: "duplicate@example.com",
      })
    ).rejects.toThrow();
  });

  it("should load store with owner user", async () => {
    const { user, store } = await fixtures.createUserWithStore(
      { username: "owner123", email: "owner123@example.com" },
      { name: "Loaded Store" }
    );

    const storeWithOwner = await dataSource.getRepository(Store).findOne({
      where: { id: store.id },
      relations: ["owner"],
    });

    expect(storeWithOwner).toBeDefined();
    expect(storeWithOwner?.owner).toBeDefined();
    expect(storeWithOwner?.owner.username).toBe("owner123");
    expect(storeWithOwner?.owner.email).toBe("owner123@example.com");
    expect(storeWithOwner?.owner.id).toBe(user.id);
  });
});
