"use client"

import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { courseCategories, courseLevels, courseSchema, CourseSchemaType, CourseStatus } from '@/lib/schema/zod-schema'
import { ArrowLeft, Loader2, PlusIcon, SparkleIcon } from 'lucide-react'
import Link from 'next/link'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, UseFormProps } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import slugify from 'slugify'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { tryCatch } from '@/helper/try-catch'
import { UploadIntent } from '@/lib/storage/types'
import { useState, useEffect } from 'react'
import { CreateCourse } from '@/server/actions/courses/create-course'
import { MediaUploader } from '@/components/handle-media/media-uploader'
import { TextEditor } from '@/components/shared/text-editor/editor'

export default function CourseCreate() {

    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const [courseId, setCourseId] = useState<string>("")

    useEffect(() => {
        setCourseId(crypto.randomUUID())
    }, [])

    const form = useForm<CourseSchemaType>({
        resolver: zodResolver(courseSchema) as UseFormProps<CourseSchemaType>['resolver'],
        defaultValues: {
            title: "",
            description: "",
            fileKey: "",
            price: 0,
            duration: 0,
            level: 'Beginner',
            category: "Stock",
            status: 'Draft',
            slug: "",
            smallDescription: ""
        },
    })


    function onSubmit(values: CourseSchemaType) {
        startTransition(async () => {
            const { data: result, error } = await tryCatch(CreateCourse({ ...values, id: courseId }))
            if (error) {
                toast.error("An unexpected error occurred.")
                return;
            }
            if (result.status === "success") {
                toast.success(result.message)
                // triggerConfetti()
                form.reset()
                router.push('/academy/creator')

            } else if (result.status === "error") {
                toast.error(result.message)
            }
        })

    }


    return (
        <div className="max-w-[1600px] mx-auto pb-20">
            <div className='flex items-center gap-4 mb-8'>
                <Link
                    href='/academy/creator'
                    className={buttonVariants({
                        variant: 'ghost',
                        size: 'icon',
                        className: 'rounded-full hover:bg-muted'
                    })}
                >
                    <ArrowLeft className='size-5' />
                </Link>
                <div>
                    <h1 className='text-3xl font-bold tracking-tight'>Create New Course</h1>
                    <p className="text-muted-foreground mt-1">Start building your curriculum</p>
                </div>
            </div>

            <Form {...form}>
                <form
                    className='space-y-8'
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-xl">Course Details</CardTitle>
                                    <CardDescription>
                                        The core content of your course.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name='title'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Course Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder='e.g., Basics of Stock Market' className="text-lg font-medium h-12" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid gap-2">
                                        <FormField
                                            control={form.control}
                                            name='slug'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>URL Slug</FormLabel>
                                                    <div className="flex gap-2">
                                                        <FormControl>
                                                            <Input placeholder='course-url-slug' {...field} />
                                                        </FormControl>
                                                        <Button
                                                            type='button'
                                                            variant="secondary"
                                                            onClick={() => {
                                                                const titleValue = form.getValues('title')
                                                                const slug = slugify(titleValue, { lower: true, strict: true })
                                                                form.setValue('slug', slug, { shouldValidate: true })
                                                            }}
                                                            title="Generate from Title"
                                                        >
                                                            <SparkleIcon size={16} />
                                                        </Button>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name='smallDescription'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Short Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        className='min-h-[100px] resize-none'
                                                        placeholder='A brief overview of what students will learn...'
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name='description'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Description</FormLabel>
                                                <FormControl>
                                                    <div className="min-h-[300px] border rounded-md overflow-hidden">
                                                        <TextEditor field={field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Settings & Media */}
                        <div className="space-y-8">
                            <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-xl">Media</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name='fileKey'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Thumbnail Image</FormLabel>
                                                <FormControl>
                                                    <div className="aspect-video bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                                                        {courseId ? (
                                                            <MediaUploader
                                                                allowedTypes={['image']}
                                                                maxSizeMB={2}
                                                                intent={UploadIntent.COURSE_COVER}
                                                                uploadParams={{ courseId }}
                                                                onChange={(files) => {
                                                                    if (files.length > 0 && files[0].key) {
                                                                        field.onChange(files[0].key)
                                                                    } else {
                                                                        field.onChange("")
                                                                    }
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full">
                                                                <Loader2 className="animate-spin text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-xl">Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name='category'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder='Select' />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {courseCategories.map((category) => (
                                                                <SelectItem key={category} value={category}>{category}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name='level'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Level</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder='Select' />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {courseLevels.map((level) => (
                                                                <SelectItem key={level} value={level}>{level}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name='duration'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Duration (h)</FormLabel>
                                                    <FormControl>
                                                        <Input type='number' {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name='price'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Price (₹)</FormLabel>
                                                    <FormControl>
                                                        <Input type='number' {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name='status'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder='Select Status' />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {CourseStatus.map((status) => (
                                                            <SelectItem key={status} value={status}>{status}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                        </div>
                    </div>

                    <div className="flex justify-center mt-8">
                        <Button type='submit' size="lg" className="w-full md:w-1/3 font-semibold text-lg px-8" disabled={isPending}>
                            {isPending ? (
                                <>
                                    Creating...
                                    <Loader2 className='animate-spin ml-2' />
                                </>
                            ) : (
                                <>
                                    Create Course
                                    <PlusIcon className='ml-2' size={18} />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
