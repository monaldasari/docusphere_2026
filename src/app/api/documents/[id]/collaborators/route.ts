import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/analytics";

// Force dynamic rendering — this route reads cookies for session auth
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    // Verify document ownership
    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.ownerId !== session.userId) {
      return NextResponse.json({ error: "Only the owner can add collaborators" }, { status: 403 });
    }

    // Find the user by email
    const userToInvite = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToInvite) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userToInvite.id === session.userId) {
      return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });
    }

    // Ensure document is marked as shared
    if (!document.shared) {
      await prisma.document.update({
        where: { id: params.id },
        data: { shared: true },
      });
    }

    // Add collaborator
    const collaborator = await prisma.collaborator.upsert({
      where: {
        documentId_userId: {
          documentId: params.id,
          userId: userToInvite.id,
        },
      },
      update: {},
      create: {
        documentId: params.id,
        userId: userToInvite.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    await logEvent(session.userId as string, "document.share", params.id);
    return NextResponse.json(collaborator);
  } catch (error) {
    console.error("Error adding collaborator:", error);
    return NextResponse.json({ error: "Failed to add collaborator" }, { status: 500 });
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const doc = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (doc.ownerId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userToRemove = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToRemove) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.collaborator.delete({
      where: {
        documentId_userId: {
          documentId: params.id,
          userId: userToRemove.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove Collaborator Error:", error);
    return NextResponse.json(
      { error: "Failed to remove collaborator" },
      { status: 500 }
    );
  }
}