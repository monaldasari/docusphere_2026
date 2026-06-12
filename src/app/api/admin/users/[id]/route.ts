import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logEvent } from "@/lib/analytics";
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    if (session.userId === params.id && body.role === "user") {
      return NextResponse.json({ error: "You cannot demote yourself" }, { status: 400 });
    }

    // Only allow updating allowed fields
    const updateData: any = {};
    if (body.role !== undefined) updateData.role = body.role;
    if (body.name !== undefined) updateData.name = body.name;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    await logEvent(session?.userId as string, "admin.action", undefined, {
      action: "update_user",
      targetId: params.id,
      changes: updateData,
    });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.userId === params.id) {
      return NextResponse.json({ error: "You cannot delete yourself" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: params.id } });

    await logEvent(session?.userId as string, "admin.action", undefined, {
      action: "delete_user",
      targetId: params.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
