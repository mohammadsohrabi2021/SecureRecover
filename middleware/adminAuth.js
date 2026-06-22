import User from "@/models/User";
import connectDB from "@/lib/db";
import { authenticateRequest } from "@/middleware/auth";
import { errorResponse } from "@/lib/utils/response";

export async function requireAdmin() {
  const auth = await authenticateRequest();
  if (auth.error) return { error: auth.error };

  await connectDB();
  const admin = await User.findById(auth.userId).select("isAdmin role name email");

  const isAdminUser =
    admin?.isAdmin || admin?.role === "admin" || admin?.role === "super_admin";

  if (!isAdminUser) {
    return { error: errorResponse("دسترسی غیرمجاز — فقط ادمین", 403) };
  }

  return { ...auth, admin };
}
