

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { tryCatch } from '@/helper/try-catch';

import { lessonSchema, lessonSchemaType } from "@/features/courses/schemas";
import { createLesson } from '@/features/courses/actions/edit-course';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useForm, UseFormProps } from 'react-hook-form';

import { toast } from 'sonner';

export default function NewLessonModal({ courseId, chapterId }: { courseId: string, chapterId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [pending, startTransition] = useTransition()


    const form = useForm<lessonSchemaType>({
        resolver: zodResolver(lessonSchema) as UseFormProps<lessonSchemaType>['resolver'],
        defaultValues: {
            name: '',
            courseId: courseId,
            chapterId: chapterId

        },
    })

    async function onSubmit(values: lessonSchemaType) {
        startTransition(async () => {
            const { data: result, error } = await tryCatch(createLesson(values))
            if (error) {
                toast.error('An unexpected error occurred. Please try again')
                return;
            }

            if (result.status === 'success') {
                toast.success(result.message)
                form.reset()
                setIsOpen(false)
            } else if (result.status === 'error') {
                toast.error(result.message)
            }
        })


    }

    function handleOpenChange(open: boolean) {
        if (!open) {
            form.reset()
        }
        setIsOpen(open)

    }


    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant='outline' className='w-full justify-center gap-1'>
                    <Plus className='size-4' /> New Lesson
                </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px'>
                <DialogHeader>
                    <DialogTitle>Create New Lesson</DialogTitle>
                    <DialogDescription>What would you like to name your lesson</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form className='space-y-8' onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                            control={form.control}
                            name='name'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name </FormLabel>
                                    <FormControl>
                                        <Input placeholder='Lesson name' {...field} />

                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button disabled={pending} type='submit'>
                                {pending ? 'Saving...' : 'Save change'}

                            </Button>
                        </DialogFooter>

                    </form>

                </Form>


            </DialogContent>

        </Dialog>

    )
}
