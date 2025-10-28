const mockRedisClientInstance = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),

  on: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  quit: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn(),
};

jest.mock("ioredis", () => {
  return jest.fn(() => mockRedisClientInstance);
});

import {
  storeRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  blacklistAccessToken,
  isAccessTokenBlacklisted,
} from "../src/utils/redisToken";

import { REDIS_KEY_PREFIXES } from "../src/constants/redis";

describe("Redis Token Management Utilities", () => {
  const JTI = "test-jwt-id-456";
  const USER_ID = "user-uuid-xyz";
  const TTL = 3600;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should store a refresh token with the correct key format and TTL", async () => {
    await storeRefreshToken(JTI, USER_ID, TTL);
    expect(mockRedisClientInstance.set).toHaveBeenCalledWith(
      `${REDIS_KEY_PREFIXES.REFRESH_TOKEN}_${JTI}`,
      USER_ID,
      "EX",
      TTL
    );
  });

  it("should retrieve a refresh token using the correct key format", async () => {
    mockRedisClientInstance.get.mockResolvedValueOnce(USER_ID);

    const result = await getRefreshToken(JTI);

    expect(mockRedisClientInstance.get).toHaveBeenCalledWith(
      `${REDIS_KEY_PREFIXES.REFRESH_TOKEN}_${JTI}`
    );
    expect(result).toBe(USER_ID);
  });

  it("should delete a refresh token using the correct key format", async () => {
    mockRedisClientInstance.exists.mockResolvedValue(1); 

    await deleteRefreshToken(JTI);

    expect(mockRedisClientInstance.exists).toHaveBeenCalledWith(
      `${REDIS_KEY_PREFIXES.REFRESH_TOKEN}_${JTI}`
    );
    expect(mockRedisClientInstance.del).toHaveBeenCalledWith(
      `${REDIS_KEY_PREFIXES.REFRESH_TOKEN}_${JTI}`
    );
  });

  it("should throw INVALID_REFRESH_TOKEN if token does not exist", async () => {
    mockRedisClientInstance.exists.mockResolvedValue(0); 

    await expect(deleteRefreshToken(JTI)).rejects.toThrow(
      expect.objectContaining({ code: "INVALID_REFRESH_TOKEN" })
    );

    expect(mockRedisClientInstance.del).not.toHaveBeenCalled();
  });

  it("should blacklist an access token with the correct key and remaining TTL", async () => {
    const REMAINING_TTL = 600;
    await blacklistAccessToken(JTI, REMAINING_TTL);
    expect(mockRedisClientInstance.set).toHaveBeenCalledWith(
      `${REDIS_KEY_PREFIXES.BLACKLIST}_${JTI}`,
      "1",
      "EX",
      REMAINING_TTL
    );
  });

  it("should return TRUE if the token is blacklisted (key exists)", async () => {
    mockRedisClientInstance.exists.mockResolvedValueOnce(1);
    const isBlacklisted = await isAccessTokenBlacklisted(JTI);
    expect(mockRedisClientInstance.exists).toHaveBeenCalledWith(
      `${REDIS_KEY_PREFIXES.BLACKLIST}_${JTI}`
    );
    expect(isBlacklisted).toBe(true);
  });

  it("should return FALSE if the token is NOT blacklisted (key does not exist)", async () => {
    mockRedisClientInstance.exists.mockResolvedValueOnce(0);
    const isBlacklisted = await isAccessTokenBlacklisted(JTI);
    expect(isBlacklisted).toBe(false);
    expect(mockRedisClientInstance.exists).toHaveBeenCalled();
  });
});
