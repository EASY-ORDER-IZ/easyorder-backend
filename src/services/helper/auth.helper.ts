import { AppDataSource } from "../../configs/database";
import { Store } from "../../entities/Store";

export class StoreHelper {
  private static storeRepository = AppDataSource.getRepository(Store);

  static async getStoreIdByUserId(userId: string): Promise<string | null> {
    const store = await this.storeRepository.findOne({
      where: { ownerId: userId }, 
      select: ["id"],
    });

    return store ? store.id : null;
  }
}
