
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { tryCatch } from '@/helper/try-catch';
import { deleteChapter } from '@/features/courses/actions/edit-course';

import { Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';

import { toast } from 'sonner';

export default function DeleteChapter({
    chapterId,
    courseId,

}: {
    chapterId: string;
    courseId: string;

}) {
    const [open, setOpen] = useState(false)
    const [pending, startTransition] = useTransition()

    async function onSubmit() {
        startTransition(async () => {
            const { data: result, error } = await tryCatch(deleteChapter({ chapterId, courseId }))
            if (error) {
                toast.error('An unexpected error occurred. Please try again')
                return;
            }

            if (result.status === 'success') {
                toast.success(result.message)

                setOpen(false)
            } else if (result.status === 'error') {
                toast.error(result.message)
            }



        })

    }


    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant='ghost' size='icon'>
                    <Trash2 className='size-4' />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure to delete this Chapter?</AlertDialogTitle>
                    <AlertDialogDescription>This action can not be undone. It will delete this chapter permanently</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button onClick={onSubmit} disabled={pending}>
                        {pending ? 'Deleting' : 'Delete'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
