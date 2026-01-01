'use client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useTransition } from 'react'

import { toast } from 'sonner'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { tryCatch } from '@/helper/try-catch'
import { deleteCourse } from '@/features/courses/actions/delete-course'


export default function DeleteCourse() {
    const [pending, startTransition] = useTransition()
    const { courseId } = useParams<{ courseId: string }>();
    const router = useRouter()



    function onSubmit() {
        startTransition(async () => {
            const { data: result, error } = await tryCatch(deleteCourse(courseId))
            if (error) {
                toast.error("An unexpected error occurred.")
                return;
            }
            if (result.status === "success") {
                toast.success(result.message)

                router.push('/academy/creator')

            } else if (result.status === "error") {
                toast.error(result.message)
            }
        })

    }




    return (
        <div className='max-w-xl mx-auto w-full'>
            <Card className='mt-32'>
                <CardHeader>
                    <CardTitle>Are you sure you want to delete this course?</CardTitle>
                    <CardDescription>This action can not be undone. This will delete your course permanently</CardDescription>
                </CardHeader>
                <CardContent className='flex items-center justify-between'>
                    <Link className={buttonVariants({ variant: 'outline' })} href='/academy/creator'>Cancel</Link>
                    <Button variant='destructive' onClick={onSubmit} disabled={pending}>
                        {pending ? (
                            <>
                                <Loader2 className='size-4 animate-spin' />
                                Deleting Course...
                            </>
                        ) : (
                            <>
                                <Trash2 className='size-4' />
                                Delete Course
                            </>
                        )

                        }
                    </Button>

                </CardContent>
            </Card>
        </div>
    )
}
