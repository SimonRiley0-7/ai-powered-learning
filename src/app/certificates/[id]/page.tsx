import { Metadata } from "next";
import CertificateView from "@/components/courses/CertificateView";

export const metadata: Metadata = {
    title: "Certificate | AI Learning Platform",
    description: "Your course completion certificate",
};

export default async function CertificatePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <CertificateView certId={id} />;
}
