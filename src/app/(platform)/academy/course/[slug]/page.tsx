import { getIndividualCourse } from '@/features/courses/queries/get-course';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, Clock, BookOpen, PlayCircle, Star, Share2, Globe, MessageSquare, ArrowLeft } from 'lucide-react';
import Image from 'next/image'
import { checkIfCourseBought } from '@/features/user/queries/user-is-enrolled';
import Link from "@/components/AppLink";
import { EnrollmentButton } from './_components/EnrollmentButton';
import { cn } from '@/lib/utils';
import { ExpandableDescription } from '../_components/ExpandableDescription';
import { UserAvatarWithInfo } from '@/components/UserAvatarWithInfo';
import { getCourseReviews } from '@/features/reviews/queries/get-course-reviews';
import { ReviewForm } from "../_components/ReviewForm";
import { ReviewList } from "../_components/ReviewList";
import { requireUser } from '@/features/user/queries/require-user';
import { CourseActions } from './_components/CourseActions';
import { constructUrl } from '@/lib/construct-url';

type Params = Promise<{ slug: string }>

export default async function SlugPage({ params }: { params: Params }) {
    const { slug } = await params;
    const course = await getIndividualCourse(slug)
    const [isEnrolled, { reviews, totalReviews, averageRating }, user] = await Promise.all([
        checkIfCourseBought(course.id),
        getCourseReviews(course.id),
        requireUser(),
    ]);

    // Check if user has already reviewed
    const userReview = reviews.find(r => r.userId === user.id);

    const imageUrl = constructUrl(course.fileKey);

    return (
        <div className="min-h-screen bg-background relative">
            {/* Background Layer */}
            <div className="absolute top-0 left-0 right-0 h-[600px] bg-muted/30 overflow-hidden z-0">
                <Image
                    src={imageUrl}
                    alt="Background"
                    fill
                    className="object-cover opacity-10 blur-3xl scale-110"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
            </div>

            <div className="container mx-auto px-4 py-12 lg:py-16 relative z-10 max-w-7xl">
                <div className="mb-8">
                    <Link
                        href="/academy/course"
                        className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Courses
                    </Link>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Hero Info (Left Top) */}
                    <div className="lg:col-span-2 space-y-6 order-1">
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1 text-sm">
                                    {course.category}
                                </Badge>
                                <Badge variant="outline" className="border-primary/20 text-primary px-3 py-1 text-sm">
                                    {course.level}
                                </Badge>
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                                {course.title}
                            </h1>
                            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
                                {course.smallDescription}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-4">
                            <div className="flex items-center gap-2">
                                <UserAvatarWithInfo
                                    name={course.user.name}
                                    username={course.user.username}
                                    image={course.user.image}
                                    expertVerificationType={course.user.expertVerificationType}
                                    accountVerificationType={course.user.accountVerificationType}
                                />
                                {/* Removed "Created by" text as requested */}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Globe className="size-4" />
                                <span>English</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="size-4" />
                                <span>Last updated {new Date().toLocaleDateString()}</span>
                            </div>
                            <CourseActions title={course.title} slug={course.slug} />
                        </div>
                    </div>

                    {/* Sidebar (Right - Spanning Rows) */}
                    <div className="lg:col-span-1 lg:row-span-2 order-2 lg:order-2 relative">
                        <div className="sticky top-24 space-y-8">
                            {/* Video Preview / Thumbnail Card */}
                            <Card className="overflow-hidden border-none shadow-xl ring-1 ring-border/50 py-0 gap-0">
                                <div className="relative aspect-video w-full group cursor-pointer">
                                    <Image
                                        src={imageUrl}
                                        alt={course.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                        <div className="size-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                                            <PlayCircle className="size-8 text-primary fill-primary/20" />
                                        </div>
                                    </div>
                                </div>
                                <CardContent className="p-5 space-y-4 bg-card">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-baseline gap-2 flex-wrap">
                                            {course.offerPrice && course.offerPrice < course.price ? (
                                                <>
                                                    <span className="text-3xl font-bold text-foreground">
                                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(course.offerPrice)}
                                                    </span>
                                                    <span className="text-muted-foreground line-through text-lg">
                                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(course.price)}
                                                    </span>
                                                    <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full ml-1">
                                                        {Math.round(((course.price - course.offerPrice) / course.price) * 100)}% OFF
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-3xl font-bold text-foreground">
                                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(course.price)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {isEnrolled ? (
                                            <Link className={cn(buttonVariants({ size: 'lg', className: 'w-full font-bold text-lg' }))} href={`/academy/enrolled`}>
                                                Go to Course
                                            </Link>
                                        ) : (
                                            <EnrollmentButton courseId={course.id} />
                                        )}
                                        <p className="text-xs text-center text-muted-foreground">30-Day Money-Back Guarantee</p>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-border/50">
                                        <h4 className="font-semibold text-sm">This course includes:</h4>
                                        <ul className="space-y-3 text-sm text-muted-foreground">
                                            <li className="flex items-center gap-3">
                                                <Clock className="size-4 text-primary" />
                                                <span>{course.duration} hours on-demand video</span>
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <BookOpen className="size-4 text-primary" />
                                                <span>{course.chapter.length} chapters</span>
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <Globe className="size-4 text-primary" />
                                                <span>Full lifetime access</span>
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <Star className="size-4 text-primary" />
                                                <span>Certificate of completion</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                        <Button variant="ghost" size="sm" className="w-full gap-2">
                                            <Share2 className="size-4" /> Share
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Body Content (Left Bottom) */}
                    <div className="lg:col-span-2 space-y-12 order-3 lg:order-3">
                        {/* Description */}
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                <BookOpen className="size-6 text-primary" />
                                About this course
                            </h2>
                            <div className="prose prose-gray dark:prose-invert max-w-none">
                                <ExpandableDescription html={course.description} limit={300} />
                            </div>
                        </section>

                        <Separator />

                        {/* Course Content */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                    <PlayCircle className="size-6 text-primary" />
                                    Course Content
                                </h2>
                                <div className="text-sm text-muted-foreground">
                                    {course.chapter.length} chapters • {course.chapter.reduce((acc, ch) => acc + ch.lessons.length, 0)} lessons • {course.duration}h total length
                                </div>
                            </div>

                            <div className="space-y-4">
                                {course.chapter.map((chapter, index) => (
                                    <Collapsible key={chapter.id} defaultOpen={index === 0}>
                                        <Card className="border-border/50 shadow-sm overflow-hidden">
                                            <CollapsibleTrigger className="w-full">
                                                <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <ChevronDown className="size-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                                        <div className="text-left">
                                                            <h3 className="font-semibold text-foreground">{chapter.title}</h3>
                                                            <p className="text-xs text-muted-foreground">{chapter.lessons.length} lessons</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <div className="border-t border-border/50 bg-muted/30">
                                                    {chapter.lessons.map((lesson, lIndex) => (
                                                        <div key={lesson.id} className="flex items-center gap-3 p-3 pl-12 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0">
                                                            <PlayCircle className="size-4 text-primary/60" />
                                                            <span className="text-sm text-foreground/80">{lesson.title}</span>
                                                            {/* <span className="ml-auto text-xs text-muted-foreground">10:00</span> Placeholder duration */}
                                                        </div>
                                                    ))}
                                                </div>
                                            </CollapsibleContent>
                                        </Card>
                                    </Collapsible>
                                ))}
                            </div>
                        </section>

                        <Separator />

                        {/* Reviews Section */}
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                <MessageSquare className="size-6 text-primary" />
                                Reviews ({totalReviews})
                            </h2>

                            <div className="flex items-center gap-4">
                                <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={cn(
                                                    "size-5",
                                                    averageRating >= star
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-muted-foreground/20"
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{totalReviews} ratings</p>
                                </div>
                            </div>

                            {isEnrolled && !userReview && (
                                <Card className="p-6">
                                    <h3 className="font-semibold mb-4">Leave a Review</h3>
                                    <ReviewForm courseId={course.id} />
                                </Card>
                            )}

                            <ReviewList reviews={reviews} currentUserId={user.id} courseId={course.id} courseOwnerId={course.userId} />
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}
