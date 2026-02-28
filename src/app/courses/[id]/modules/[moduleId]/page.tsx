import { Metadata } from "next";
import ModuleViewer from "@/components/courses/ModuleViewer";

export const metadata: Metadata = {
    title: "Module | AI Learning Platform",
    description: "Personalized adaptive module learning experience",
};

export default async function ModulePage({
    params,
}: {
    params: Promise<{ id: string; moduleId: string }>;
}) {
    const { id, moduleId } = await params;
    return <ModuleViewer courseId={id} moduleId={moduleId} />;
}
