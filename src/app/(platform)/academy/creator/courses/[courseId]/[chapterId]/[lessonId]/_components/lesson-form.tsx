"use client"

import { CreatorLessonType } from "@/app/data/creator/creator-get-lesson";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { tryCatch } from "@/helper/try-catch";
import { cn } from "@/lib/utils";
import { lessonSchema, lessonSchemaType } from "@/lib/schema/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { TextEditor } from "@/components/shared/text-editor/editor";
import { updateLesson } from "@/server/actions/courses/update-lesson";
import { MediaUploader } from "@/components/handle-media/media-uploader";
import { constructUrl } from "@/lib/construct-url";


interface LessonFormProps {
    data: CreatorLessonType;
    chapterId: string;
    courseId: string
}

export function LessonForm({ data, chapterId, courseId }: LessonFormProps) {
    const [pending, startTransition] = useTransition()

    const form = useForm<lessonSchemaType>({
        resolver: zodResolver(lessonSchema),
        defaultValues: {
            name: data.title,
            chapterId: chapterId,
            courseId: courseId,
            description: data.description ?? undefined,
            videoKey: data.videoKey ?? undefined,
            thumbnailKey: data.thumbnailKey ?? undefined

        },
    })


    async function onSubmit(values: lessonSchemaType) {
        startTransition(async () => {
            const { data: result, error } = await tryCatch(updateLesson(values, data.id))
            if (error) {
                toast.error("An unexpected error occurred.")
                return;
            }
            if (result.status === "success") {
                toast.success(result.message)


            } else if (result.status === "error") {
                toast.error(result.message)
            }
        })

    }

    return (
        <div>
            <Link
                className={cn(buttonVariants({ variant: 'outline' }), "mb-5")}
                href={`/academy/creator/courses/${courseId}/edit`}
            >
                <ArrowLeft className="size-4" />
                <span>Go Back</span>
            </Link>

            <Card>
                <CardHeader>
                    <CardTitle>Lesson Configuration</CardTitle>
                    <CardDescription>Configure video and description for this lesson</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Lesson Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Chapter abc" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <TextEditor field={field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="thumbnailKey" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Thumbnail Image</FormLabel>
                                    <FormControl>
                                        <MediaUploader
                                            onChange={(files) => {
                                                if (files.length > 0 && files[0].key) {
                                                    field.onChange(files[0].key)
                                                } else {
                                                    field.onChange("")
                                                }
                                            }}
                                            existingMedia={field.value ? [{ url: constructUrl(field.value), type: "IMAGE" }] : []}
                                            acceptedTypes="image"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="videoKey" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Video File</FormLabel>
                                    <FormControl>
                                        <MediaUploader
                                            onChange={(files) => {
                                                if (files.length > 0 && files[0].key) {
                                                    field.onChange(files[0].key)
                                                } else {
                                                    field.onChange("")
                                                }
                                            }}
                                            existingMedia={field.value ? [{ url: constructUrl(field.value), type: "VIDEO" }] : []}
                                            acceptedTypes="video"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <Button type="submit" disabled={pending}>
                                {pending ? 'Saving...' : ' Save Lesson'}
                            </Button>
                        </form>

                    </Form>

                </CardContent>
            </Card>

        </div>
    )
}