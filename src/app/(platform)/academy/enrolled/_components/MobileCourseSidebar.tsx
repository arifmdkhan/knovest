'use client'

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { CourseSidebar } from "./CourseSidebar";
import { CourseSidebarDataType } from "@/app/data/course/get-course-sidebar-data";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

interface MobileCourseSidebarProps {
    course: CourseSidebarDataType['course']
    completedLessonIds: string[];
}

export function MobileCourseSidebar({ course, completedLessonIds }: MobileCourseSidebarProps) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    // Close sidebar on route change
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                    <Menu className="size-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
                <SheetTitle className="sr-only">Course Navigation</SheetTitle>
                <CourseSidebar course={course} completedLessonIds={completedLessonIds} />
            </SheetContent>
        </Sheet>
    )
}
