import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessions = await prisma.chatSession.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { messages: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          where: { role: "user" },
        },
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Sessions fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  // Delete all sessions
  try {
    await prisma.chatSession.deleteMany();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sessions delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
