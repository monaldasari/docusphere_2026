import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const document = await prisma.document.findUnique({
    where: {
      inviteToken: params.token,
      shared: true,
    },
    include: {
      owner: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const session = await getSession();
  if (session && session.userId && document.ownerId !== session.userId) {
    await prisma.collaborator.upsert({
      where: {
        documentId_userId: {
          documentId: document.id,
          userId: session.userId as string,
        },
      },
      update: {},
      create: {
        documentId: document.id,
        userId: session.userId as string,
      },
    }).catch(() => {});
  }

  return NextResponse.json(document);
}
