"use client"

import { CreatorCourseSingularType } from '@/features/creator/queries/creator-get-course';
import { Button } from '@/components/ui/button';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { DndContext, DragEndEvent, DraggableSyntheticListeners, KeyboardSensor, PointerSensor, rectIntersection, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, FileText, GripVertical } from 'lucide-react';
import Link from "@/components/AppLink";
import { title } from 'process';
import { ReactNode, useEffect, useState } from 'react';
import { toast } from 'sonner';

import NewChapterModal from './new-chapter-modal';
import NewLessonModal from './new-lesson-modal';
import DeleteLesson from './delete-lesson';
import DeleteChapter from './delete-chapter.tsx';
import { reorderChapters, reorderLessons } from '@/features/courses/actions/edit-course';

interface CourseStructureProps {
    data: CreatorCourseSingularType
}
interface SortableItemProps {
    id: string;
    children: (listeners: DraggableSyntheticListeners) => ReactNode
    className?: string;
    data?: {
        type: 'chapter' | 'lesson'
        chapterId?: string;  //only relevant for lesson
    }
}

export default function CourseStructure({ data }: CourseStructureProps) {
    const initialItems = data.chapter.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        order: chapter.position,
        isOpen: true,
        lessons: chapter.lessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            order: lesson.position
        }))
    })) || [];

    const [items, setItems] = useState(initialItems);


    useEffect(() => {
        setItems((prevItems) => {
            const updatedItems = data.chapter.map((chapter) => ({
                id: chapter.id,
                title: chapter.title,
                order: chapter.position,
                isOpen: prevItems.find((item) => item.id === chapter.id)?.isOpen ?? true,
                lessons: chapter.lessons.map((lesson) => ({
                    id: lesson.id,
                    title: lesson.title,
                    order: lesson.position
                }))


            })) || []
            return updatedItems
        })
    }, [data])

    function SortableItem({ children, id, className, data }: SortableItemProps) {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({ id: id, data: data });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
        };

        return (
            <div ref={setNodeRef} style={style} {...attributes} className={cn('touch-none', className, isDragging ? 'z-10' : "")}>
                {children(listeners)}
            </div>
        );
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) {
            return;
        }
        const activeId = active.id;
        const overId = over.id;
        const activeType = active.data.current?.type as "chapter" | "lesson";
        const overType = over.data.current?.type as "chapter" | "lesson";
        const courseId = data.id

        if (activeType === "chapter") {
            let targetChapterId = null;
            if (overType === "chapter") {
                targetChapterId = overId
            } else if (overType === "lesson") {
                targetChapterId = over.data.current?.chapterId ?? null
            }

            if (!targetChapterId) {
                toast.error("Could not determine the chapter for reordering")
                return;
            }
            const oldIndex = items.findIndex((item) => item.id === activeId);
            const newIndex = items.findIndex((item) => item.id === targetChapterId);


            if (oldIndex === -1 || newIndex === -1) {
                toast.error("Could not find chapter")

                return;
            }

            const reorderedLocalChapters = arrayMove(items, oldIndex, newIndex)
            const updatedChapterForState = reorderedLocalChapters.map(
                (chapter, index) => ({
                    ...chapter,
                    order: index + 1
                })
            )

            const previousItems = [...items]
            setItems(updatedChapterForState)

            if (courseId) {
                const chaptersToUpdate = updatedChapterForState.map((chapter) => ({
                    id: chapter.id,
                    position: chapter.order
                }))

                const reorderPromise = () => reorderChapters(courseId, chaptersToUpdate)

                toast.promise(reorderPromise(), {
                    loading: 'Reordering chapters...',
                    success: (result) => {
                        if (result.status === 'success') return result.message;

                        throw new Error(result.message)
                    },
                    error: () => {
                        setItems(previousItems)
                        return 'Failed to reorder chapters'
                    }
                })
            }
            return;

        }
        if (activeType === 'lesson' && overType === 'lesson') {
            const chapterId = active.data.current?.chapterId;
            const overChapterId = over.data.current?.chapterId;

            if (!chapterId || chapterId !== overChapterId) {
                toast.error('Lesson move between different chapter or invalid chapter ID is not allowed')
                return;
            }

            const chapterIndex = items.findIndex((chapter) => chapter.id === chapterId)

            if (chapterIndex === -1) {
                toast.error('Could not find chapter for lesson')
                return;
            }
            const chapterToUpdate = items[chapterIndex]
            const oldLessonIndex = chapterToUpdate.lessons.findIndex((lesson) => lesson.id === activeId)
            const newLessonIndex = chapterToUpdate.lessons.findIndex((lesson) => lesson.id === overId)

            if (oldLessonIndex === -1 || newLessonIndex === -1) {
                toast.error("Could not find lesson for reordering")
                return;
            }

            const reorderedLessons = arrayMove(chapterToUpdate.lessons, oldLessonIndex, newLessonIndex)

            const updatedLessonForState = reorderedLessons.map((lesson, index) => ({
                ...lesson, order: index + 1
            }))

            const newItems = [...items];
            newItems[chapterIndex] = {
                ...chapterToUpdate,
                lessons: updatedLessonForState
            }
            const previousItems = [...items]
            setItems(newItems)

            if (courseId) {
                const lessonsToUpdate = updatedLessonForState.map((lesson) => ({
                    id: lesson.id,
                    position: lesson.order,
                }))

                const reorderLessonsPromise = () => reorderLessons(chapterId, lessonsToUpdate, courseId)
                toast.promise(reorderLessonsPromise(), {
                    loading: 'Reordering Lessons...',
                    success: (result) => {
                        if (result.status === 'success') return result.message;
                        throw new Error(result.message)
                    },
                    error: () => {
                        setItems(previousItems)
                        return 'Failed to reorder lessons'
                    }
                })
            }

            return;


        }



    }

    function toggleChapter(chapterId: string) {
        setItems(
            items.map((chapter) => chapter.id === chapterId ? { ...chapter, isOpen: !chapter.isOpen } : chapter)
        )
    }

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );


    return (
        <DndContext collisionDetection={rectIntersection} onDragEnd={handleDragEnd} sensors={sensors}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Chapters & Lessons</h3>
                    <NewChapterModal courseId={data.id} />
                </div>

                <div className="space-y-4">
                    <SortableContext
                        items={items}
                        strategy={verticalListSortingStrategy}>
                        {items.map((item) => (
                            <SortableItem
                                id={item.id}
                                data={{ type: "chapter" }}
                                key={item.id}>
                                {(listeners) => (
                                    <div className="border rounded-lg bg-card/50 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                                        <Collapsible open={item.isOpen} onOpenChange={() => toggleChapter(item.id)}>
                                            <div className={cn(
                                                'flex items-center justify-between p-3 transition-colors',
                                                item.isOpen ? 'bg-muted/50' : 'hover:bg-muted/30'
                                            )}>
                                                <div className='flex items-center gap-3 flex-1 overflow-hidden'>
                                                    <Button
                                                        size='icon'
                                                        variant='ghost'
                                                        className="cursor-grab active:cursor-grabbing hover:bg-background/80 h-8 w-8 shrink-0"
                                                        {...listeners}
                                                    >
                                                        <GripVertical className='size-4 text-muted-foreground' />
                                                    </Button>

                                                    <CollapsibleTrigger asChild>
                                                        <Button size='icon' variant='ghost' className='h-8 w-8 shrink-0 hover:bg-background/80'>
                                                            {item.isOpen ? (
                                                                <ChevronDown className='size-4 text-muted-foreground' />
                                                            ) : (
                                                                <ChevronRight className='size-4 text-muted-foreground' />
                                                            )}
                                                        </Button>
                                                    </CollapsibleTrigger>

                                                    <span className='font-medium truncate select-none'>
                                                        {item.title}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 pl-2">
                                                    <DeleteChapter chapterId={item.id} courseId={data.id} />
                                                </div>
                                            </div>

                                            <CollapsibleContent>
                                                <div className='p-3 space-y-2 bg-background/50'>
                                                    <SortableContext items={item.lessons.map((lesson) => lesson.id)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        {item.lessons.length === 0 && (
                                                            <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-md">
                                                                No lessons in this chapter yet.
                                                            </div>
                                                        )}

                                                        {item.lessons.map((lesson) => (
                                                            <SortableItem
                                                                key={lesson.id}
                                                                id={lesson.id}
                                                                data={{ type: "lesson", chapterId: item.id }}
                                                            >
                                                                {(lessonListeners) => (
                                                                    <div className='group flex items-center justify-between p-2 rounded-md border border-transparent hover:border-border hover:bg-accent/50 transition-all duration-200'>
                                                                        <div className='flex items-center gap-3 flex-1 overflow-hidden'>
                                                                            <Button
                                                                                variant='ghost'
                                                                                size='icon'
                                                                                className="cursor-grab active:cursor-grabbing h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                {...lessonListeners}
                                                                            >
                                                                                <GripVertical className='size-4 text-muted-foreground' />
                                                                            </Button>

                                                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                                <div className="p-1.5 rounded-full bg-primary/10 text-primary shrink-0">
                                                                                    <FileText className='size-3.5' />
                                                                                </div>
                                                                                <Link
                                                                                    href={`/academy/creator/courses/${data.id}/${item.id}/${lesson.id}`}
                                                                                    className="truncate text-sm hover:underline hover:text-primary transition-colors"
                                                                                >
                                                                                    {lesson.title}
                                                                                </Link>
                                                                            </div>
                                                                        </div>
                                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                                                                            <DeleteLesson chapterId={item.id} courseId={data.id} lessonId={lesson.id} />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </SortableItem>
                                                        ))}
                                                    </SortableContext>

                                                    <div className='pt-2 flex justify-center'>
                                                        <NewLessonModal chapterId={item.id} courseId={data.id} />
                                                    </div>
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    </div>
                                )}
                            </SortableItem>
                        ))}
                    </SortableContext>

                    {items.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                            <h3 className="text-lg font-medium text-muted-foreground">Start by creating a chapter</h3>
                            <p className="text-sm text-muted-foreground/80 mt-1 mb-4">Organize your course content into chapters and lessons.</p>
                            <NewChapterModal courseId={data.id} />
                        </div>
                    )}
                </div>
            </div>
        </DndContext>
    )
}
