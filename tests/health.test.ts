import requrest from "supertest";
import app from "../src/app";

describe("Health Check", () => {
  it("should return 200 OK", async () => {
    const res = await requrest(app).get("/health");
    expect(res.status).toBe(200);
  });
});
