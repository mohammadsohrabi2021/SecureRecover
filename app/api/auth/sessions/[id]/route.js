import connectDB from "@/lib/db";
import Session from "@/models/Session";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function DELETE(req, { params }) {

  try {

    await connectDB();

    await Session.findByIdAndDelete(params.id);

    return successResponse("session removed");

  } catch (error) {

    return errorResponse("failed", 500);

  }

}
