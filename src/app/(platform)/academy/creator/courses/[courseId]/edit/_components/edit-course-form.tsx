"use client"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { courseCategories, courseLevels, courseSchema, CourseSchemaType, CourseStatus } from '@/lib/schema/zod-schema'
import { UploadIntent } from '@/lib/storage/types'
import { Loader2, PlusIcon, SparkleIcon } from 'lucide-react'
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
import { CreatorCourseSingularType } from '@/app/data/creator/creator-get-course'
import { tryCatch } from '@/helper/try-catch'
import { editCourse } from '@/server/actions/courses/edit-course'
import { TextEditor } from '@/components/shared/text-editor/editor'

import { MediaUploader } from '@/components/handle-media/media-uploader'
import { constructUrl } from '@/lib/construct-url'


interface EditCourseFormProps {
    data: CreatorCourseSingularType;
}


export default function EditCourseForm({ data }: EditCourseFormProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const form = useForm<CourseSchemaType>({
        resolver: zodResolver(courseSchema) as UseFormProps<CourseSchemaType>['resolver'],
        defaultValues: {
            title: data.title,
            description: data.description,
            fileKey: data.fileKey,
            price: data.price,
            duration: data.duration,
            level: data.level,
            category: data.category as CourseSchemaType['category'],
            status: data.status,
            slug: data.slug,
            smallDescription: data.smallDescription,
            offerPrice: data.offerPrice ?? undefined,
        },
    })


    function onSubmit(values: CourseSchemaType) {
        startTransition(async () => {
            const { data: result, error } = await tryCatch(editCourse(values, data.id))
            if (error) {
                toast.error("An unexpected error occurred.")
                return;
            }
            if (result.status === "success") {
                toast.success(result.message)
                form.reset(values) // Reset with new values to avoid dirty state if needed
                router.refresh() // Refresh to update server data
                router.push('/academy/creator')

            } else if (result.status === "error") {
                toast.error(result.message)
            }
        })

    }

    return (
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
                                                <Input placeholder='e.g., Advanced React Patterns' className="text-lg font-medium h-12" {...field} />
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
                                                    <MediaUploader
                                                        allowedTypes={['image']}
                                                        maxSizeMB={2}
                                                        intent={UploadIntent.COURSE_COVER}
                                                        uploadParams={{ courseId: data.id }}
                                                        onChange={(files) => {
                                                            if (files.length > 0 && files[0].key) {
                                                                field.onChange(files[0].key)
                                                            } else {
                                                                field.onChange("")
                                                            }
                                                        }}
                                                        existingMedia={field.value ? [{ url: `${constructUrl(field.value)}?t=${Date.now()}`, type: "IMAGE" }] : []}
                                                    />
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

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
                                    <FormField
                                        control={form.control}
                                        name='offerPrice'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Offer Price (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input type='number' placeholder='e.g. 499' {...field} value={field.value ?? ''} />
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
                                Updating...
                                <Loader2 className='animate-spin ml-2' />
                            </>
                        ) : (
                            <>
                                Update Course
                                <PlusIcon className='ml-2' size={18} />
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
