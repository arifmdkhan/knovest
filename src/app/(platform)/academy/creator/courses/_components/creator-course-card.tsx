import { CreatorGetCourseType } from '@/server/data/creator/creator-get-courses';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { constructUrl } from '@/lib/construct-url';
import { ArrowRight, BarChart, Clock, Edit, Eye, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { UserAvatarWithInfo } from '@/components/UserAvatarWithInfo';
import { Badge } from '@/components/ui/badge';

interface CreatorCourseCardProps {
    data: CreatorGetCourseType;
}

export default function CreatorCourseCard({ data }: CreatorCourseCardProps) {
    const thumbnailUrl = constructUrl(data.fileKey);

    return (
        <Card className='group overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300 hover:border-primary/20 bg-card/50 backdrop-blur-sm flex flex-col h-full p-0'>
            {/* Image Section */}
            <div className='relative aspect-video w-full overflow-hidden bg-muted'>
                <Image
                    src={thumbnailUrl}
                    alt={data.title}
                    fill
                    className='object-cover transition-transform duration-500 group-hover:scale-105'
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Status Badge */}
                <div className="absolute top-3 left-3 z-10">
                    <Badge variant={data.status === 'Published' ? 'default' : 'secondary'} className="shadow-sm backdrop-blur-md">
                        {data.status}
                    </Badge>
                </div>

                {/* Actions Menu */}
                <div className='absolute top-3 right-3 z-10'>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant='secondary' size='icon' className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-md hover:bg-background shadow-sm">
                                <MoreVertical className='size-4' />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-48'>
                            <DropdownMenuItem asChild>
                                <Link href={`/academy/creator/courses/${data.id}/edit`}>
                                    <Pencil className='size-4 mr-2' />
                                    Edit Course
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/academy/creator/courses/${data.slug}`}>
                                    <Eye className='size-4 mr-2' />
                                    Preview
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/academy/creator/courses/${data.id}/delete`}>
                                    <Trash2 className='size-4 mr-2 text-destructive' />
                                    Delete Course
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Content Section */}
            <CardContent className='flex-1 p-4 space-y-3'>
                <div className="space-y-1.5">
                    <Link href={`/academy/creator/courses/${data.id}/edit`} className="block">
                        <h3 className='font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors'>
                            {data.title}
                        </h3>
                    </Link>
                    <p className='text-sm text-muted-foreground line-clamp-2 leading-relaxed'>
                        {data.smallDescription}
                    </p>
                </div>

                {/* Metadata */}
                <div className='flex items-center gap-3 text-xs font-medium text-muted-foreground pt-1'>
                    <div className='flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded-md'>
                        <Clock className='size-3.5' />
                        <span>{data.duration}h</span>
                    </div>
                    <div className='flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded-md'>
                        <BarChart className='size-3.5' />
                        <span>{data.level}</span>
                    </div>
                    <div className='ml-auto flex flex-col items-end'>
                        {data.offerPrice && data.offerPrice < data.price ? (
                            <div className="flex flex-col items-end gap-0.5">
                                <span className="text-[10px] font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                    {Math.round(((data.price - data.offerPrice) / data.price) * 100)}% OFF
                                </span>
                                <div className="flex items-baseline gap-1.5 flex-wrap justify-end">
                                    <span className="text-xs text-muted-foreground line-through">
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.price)}
                                    </span>
                                    <span className="font-bold text-foreground text-sm text-green-600 dark:text-green-400">
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.offerPrice)}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className='font-bold text-foreground text-base'>
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.price)}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>

            {/* Footer Section */}
            <div className="p-4 pt-0 mt-auto">
                <div className="border-t border-border/50 pt-3 flex items-center justify-between gap-3">
                    <UserAvatarWithInfo
                        name={data.user.name}
                        username={data.user.username}
                        image={data.user.image}
                        expertVerificationType={data.user.expertVerificationType}
                        accountVerificationType={data.user.accountVerificationType}
                        className="flex-1 min-w-0"
                        avatarClassName="h-8 w-8"
                    />

                    <Link href={`/academy/creator/courses/${data.id}/edit`}>
                        <Button variant="outline" size="sm" className="gap-2 h-8">
                            <Edit className="size-3.5" />
                            <span>Edit</span>
                        </Button>
                    </Link>
                </div>
            </div>
        </Card>
    )
}

//Fallback skeleton
export function CreatorCourseCardSkeleton() {
    return (
        <Card className='group overflow-hidden border-border/50 bg-card/50 flex flex-col h-full p-0'>
            <div className='relative aspect-video w-full overflow-hidden bg-muted'>
                <Skeleton className='w-full h-full' />
                <div className="absolute top-3 left-3 z-10">
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className='absolute top-3 right-3 z-10'>
                    <Skeleton className="size-8 rounded-full" />
                </div>
            </div>

            <CardContent className='flex-1 p-4 space-y-3'>
                <div className="space-y-1.5">
                    <Skeleton className='h-6 w-3/4 rounded' />
                    <Skeleton className='h-4 w-full rounded' />
                    <Skeleton className='h-4 w-2/3 rounded' />
                </div>

                <div className='flex items-center gap-3 pt-2'>
                    <Skeleton className='h-6 w-12 rounded-md' />
                    <Skeleton className='h-6 w-16 rounded-md' />
                    <Skeleton className='h-6 w-16 ml-auto rounded-md' />
                </div>
            </CardContent>

            <div className="p-4 pt-0 mt-auto">
                <div className="border-t border-border/50 pt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                        <Skeleton className="size-8 rounded-full" />
                        <div className="space-y-1.5 flex-1">
                            <Skeleton className="h-3.5 w-20 rounded" />
                            <Skeleton className="h-3 w-12 rounded" />
                        </div>
                    </div>
                    <Skeleton className="size-8 rounded-full" />
                </div>
            </div>
        </Card>
    )
}
