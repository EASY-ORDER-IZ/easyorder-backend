import { randomUUID } from "crypto";
import type { Repository } from "typeorm";
import type { Store } from "../../entities/Store";

export async function generateUniqueStoreName(
  username: string,
  storeRepository: Repository<Store>
): Promise<string> {
  const storeName = username;

  const exists = await storeRepository.findOneBy({ name: storeName });

  if (!exists) {
    return storeName;
  }

  const uniqueSuffix = randomUUID().split("-")[0];
  return `${username}_${uniqueSuffix}`;
}
