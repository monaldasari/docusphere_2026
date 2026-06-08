import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering — this route reads cookies for session auth
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await prisma.document.findMany({
    where: {
      OR: [
        { ownerId: session.userId as string },
        { collaborators: { some: { userId: session.userId as string } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, emoji, content } = await req.json();

  const document = await prisma.document.create({
    data: {
      title: title || "Untitled Document",
      emoji: emoji || "📄",
      content: content || "",
      ownerId: session.userId as string,
    },
  });

  return NextResponse.json(document);
}
