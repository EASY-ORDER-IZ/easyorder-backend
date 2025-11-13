import type { RegisterRequest } from "../../src/api/v1/types";

export class AuthFixtures {
  static generateCustomerData(
    overrides?: Partial<RegisterRequest>
  ): RegisterRequest {
    const randomNum = Math.floor(Math.random() * 9999);

    return {
      username: `user${randomNum}`,
      email: `user${randomNum}@test.com`,
      password: "Test@1234",
      confirmPassword: "Test@1234",
      createStore: "no",
      ...overrides,
    };
  }

  static generateAdminData(
    overrides?: Partial<RegisterRequest>
  ): RegisterRequest {
    const randomNum = Math.floor(Math.random() * 9999);

    return {
      username: `admin${randomNum}`,
      email: `admin${randomNum}@test.com`,
      password: "Admin@1234",
      confirmPassword: "Admin@1234",
      createStore: "yes",
      storeName: `Store${randomNum}`,
      ...overrides,
    };
  }
}
