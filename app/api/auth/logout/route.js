import { clearAuthCookie } from "@/lib/cookies";
import { successResponse } from "@/lib/utils/response";

export async function POST() {
  const res = successResponse("با موفقیت خارج شدید");
  res.headers.set("Set-Cookie", clearAuthCookie());
  return res;
}
