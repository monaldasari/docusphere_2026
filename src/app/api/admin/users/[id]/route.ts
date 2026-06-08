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
    const body = await req.json();

    const user = await prisma.user.update({
      where: { id: params.id },
      data: body,
    });

    await logEvent(session?.userId as string, "admin.action", undefined, {
      action: "update_user",
      targetId: params.id,
      changes: body,
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
