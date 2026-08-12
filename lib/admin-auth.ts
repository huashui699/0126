import { timingSafeEqual } from "node:crypto";

export function isAuthorizedAdminRequest(request: Request): boolean {
  const expected = process.env.ADMIN_API_SECRET;
  const supplied = request.headers.get("x-admin-secret");
  if (!expected || expected.length < 32 || !supplied) return false;
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}
