import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

export type AnalyticsEvent =
  | "document.open"
  | "document.edit"
  | "document.create"
  | "document.delete"
  | "document.share"
  | "document.export"
  | "document.import"
  | "comment.create"
  | "comment.resolve"
  | "user.login"
  | "user.signup"
  | "user.logout"
  | "admin.action";

export async function logEvent(
  userId: string,
  eventName: AnalyticsEvent,
  documentId?: string,
  metadata?: Record<string, any>
) {
  try {
    await prisma.analytics.create({
      data: {
        userId,
        eventName,
        documentId: documentId || null,
        metadata: metadata || Prisma.JsonNull,
      },
    });
  } catch (error) {
    console.error("Analytics log error:", error);
  }
}

export async function getAnalytics(filters?: {
  userId?: string;
  documentId?: string;
  eventName?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const where: any = {};
  if (filters?.userId) where.userId = filters.userId;
  if (filters?.documentId) where.documentId = filters.documentId;
  if (filters?.eventName) where.eventName = filters.eventName;
  if (filters?.from || filters?.to) {
    where.createdAt = {};
    if (filters?.from) where.createdAt.gte = filters.from;
    if (filters?.to) where.createdAt.lte = filters.to;
  }

  return prisma.analytics.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters?.limit || 100,
    include: {
      user: { select: { name: true, email: true } },
      document: { select: { title: true } },
    },
  });
}
