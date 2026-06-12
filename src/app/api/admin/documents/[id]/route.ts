import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/analytics";
// Force dynamic rendering — this route reads cookies for session auth
export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("🟡 DELETE API HIT");

  const session = await getSession();
  console.log("SESSION:", session);

  if (!session) {
    console.log("❌ No session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🟡 Document ID:", params.id);

    const doc = await prisma.document.findUnique({
      where: { id: params.id },
    });

    console.log("🟡 Found document:", doc);

    if (!doc) {
      console.log("❌ Document not found");
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    console.log("🟡 Owner ID:", doc.ownerId);
    console.log("🟡 Session User ID:", session.userId);

    if (session.role !== "admin") {
      console.log("❌ Forbidden - not admin");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete collaborators first (safe)
    await prisma.collaborator.deleteMany({
      where: { documentId: params.id },
    });

    console.log("🟡 Collaborators deleted");

    await prisma.document.delete({
      where: { id: params.id },
    });

    console.log("✅ Document deleted");

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("🔥 DELETE ERROR FULL:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
