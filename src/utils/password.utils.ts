import argon2 from "argon2";

export const PasswordUtil = {
  async hash(password: string): Promise<string> {
    return argon2.hash(password);
  },

  async verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  },
};
