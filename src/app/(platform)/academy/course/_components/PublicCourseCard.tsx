import { PublicCourseType } from "@/features/courses/queries/get-all-courses";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { constructUrl } from "@/lib/construct-url";
import { BarChart, Clock, Star, ArrowRight } from "lucide-react";
import Link from "@/components/AppLink";
import { SafeImage } from "@/components/ui/safe-image";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { SaveCourseButton } from "./SaveCourseButton";

export function PublicCourseCard({ data, priority = false }: { data: PublicCourseType & { isSaved?: boolean }; priority?: boolean }) {
  const totalReviews = data.reviews.length;
  const averageRating = totalReviews ? data.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;
  const discounted = data.offerPrice != null && data.offerPrice < data.price;
  const price = discounted ? data.offerPrice! : data.price;
  const currency = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
  const enrolled = data.enrollment?.some(item => item.status === "Active");
  return <Card className="group h-full gap-0 overflow-hidden p-0 transition-colors hover:border-primary/40">
    <Link href={`/academy/course/${data.slug}`} className="relative block aspect-video overflow-hidden bg-muted" aria-label={`View ${data.title}`}>
      <SafeImage width={600} height={338} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" src={constructUrl(data.fileKey)} alt={data.title} priority={priority} sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" />
      <div className="absolute inset-x-3 top-3 flex flex-wrap gap-2"><Badge variant="secondary" className="max-w-full bg-card/95 text-card-foreground">{data.category}</Badge>{enrolled && <Badge>Enrolled</Badge>}</div>
    </Link>
    <CardContent className="flex flex-1 flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Clock className="size-3.5" />{data.duration} hours</span><span className="flex items-center gap-1.5"><BarChart className="size-3.5" />{data.level}</span></div>
      <Link href={`/academy/course/${data.slug}`} className="hover:text-primary"><h3 className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight">{data.title}</h3></Link>
      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{data.smallDescription}</p>
      <div className="mt-auto"><UserAvatarWithInfo name={data.user.name} username={data.user.username} image={data.user.image} expertVerificationType={data.user.expertVerificationType} accountVerificationType={data.user.accountVerificationType} /></div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <span className="text-lg font-semibold">{price === 0 ? "Free" : currency(price)}{discounted && <span className="ml-2 text-xs font-normal text-muted-foreground line-through">{currency(data.price)}</span>}</span>
        {totalReviews > 0 && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="size-3.5 fill-amber-400 text-amber-500" />{averageRating.toFixed(1)} ({totalReviews})</span>}
      </div>
    </CardContent>
    <CardFooter className="gap-2 px-5 pb-5 pt-0">
      <Button asChild className="h-11 min-w-0 flex-1"><Link href={`/academy/course/${data.slug}`}>{enrolled ? "Continue learning" : "Explore course"}<ArrowRight className="size-4" /></Link></Button>
      <SaveCourseButton courseId={data.id} initialIsSaved={!!data.isSaved} />
    </CardFooter>
  </Card>;
}

export function PublicCourseCardSkeleton() {
  return <Card className="h-full gap-0 overflow-hidden p-0"><Skeleton className="aspect-video w-full rounded-none" /><CardContent className="space-y-4 p-5"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-6 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-10 w-3/4" /><Skeleton className="h-11 w-full" /></CardContent></Card>;
}
