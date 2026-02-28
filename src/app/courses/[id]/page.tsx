import { Metadata } from "next";
import CourseDetail from "@/components/courses/CourseDetail";

export const metadata: Metadata = {
    title: "Course | AI Learning Platform",
};

export default async function CoursePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <CourseDetail courseId={id} />;
}
