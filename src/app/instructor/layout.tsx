import { Navbar } from "@/components/Navbar"

export default function InstructorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <Navbar />
            {children}
        </>
    )
}
