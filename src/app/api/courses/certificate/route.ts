// GET /api/courses/certificate?id=[certId] — fetch a certificate
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const cert = await prisma.certificate.findFirst({
        where: { id, userId: session.user.id },
    });

    if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });

    return NextResponse.json(cert);
}
