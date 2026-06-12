import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/analytics";

// Force dynamic rendering — this route reads cookies for session auth
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const document = await prisma.document.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { name: true, email: true } },
      collaborators: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Allow owner or collaborators
  const isOwner = document.ownerId === (session.userId as string);
  const isCollaborator = document.collaborators.some(
    (c: { userId: string }) => c.userId === (session.userId as string)
  );

  if (!isOwner && !isCollaborator && !document.shared) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await logEvent(session.userId as string, "document.open", params.id);
  return NextResponse.json(document);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const existingDoc = await prisma.document.findUnique({
    where: { id: params.id },
    include: {
      collaborators: {
        where: { userId: session.userId as string },
      },
    },
  });

  if (!existingDoc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = existingDoc.ownerId === session.userId;
  const isCollaborator = existingDoc.collaborators.length > 0;
  const isShared = existingDoc.shared;

  if (!isOwner && !isCollaborator) {
    if (isShared) {
      // Add as collaborator
      await prisma.collaborator.create({
        data: {
          documentId: params.id,
          userId: session.userId as string,
        },
      }).catch(() => {});
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Sanitize update data
  const updateData: any = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.emoji !== undefined) updateData.emoji = body.emoji;
  if (body.excerpt !== undefined) updateData.excerpt = body.excerpt;
  if (body.content !== undefined) updateData.content = body.content;
  if (body.starred !== undefined) updateData.starred = body.starred;
  if (body.shared !== undefined) updateData.shared = body.shared;

  if (body.shared === true && !existingDoc.inviteToken) {
    updateData.inviteToken =
      Math.random().toString(36).substring(2, 8) +
      Math.random().toString(36).substring(2, 8);
  }

  updateData.updatedBy = session.email as string;
  updateData.updatedAt = new Date();

  const document = await prisma.document.update({
    where: { id: params.id },
    data: updateData,
  });

  await logEvent(session.userId as string, "document.edit", params.id);
  return NextResponse.json(document);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingDoc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!existingDoc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existingDoc.ownerId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.document.delete({
    where: { id: params.id },
  });

  await logEvent(session.userId as string, "document.delete", params.id);
  return NextResponse.json({ success: true });
}
