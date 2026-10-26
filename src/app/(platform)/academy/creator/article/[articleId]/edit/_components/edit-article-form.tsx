"use client";


import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaUploader } from "@/components/handle-media/media-uploader";
import { UploadIntent } from "@/lib/storage/types";
import { TextEditor } from "@/components/shared/text-editor/editor";
import { tryCatch } from "@/helper/try-catch";
import { articleCategories, articleSchema, ArticleSchemaType } from "@/features/articles/schemas";
import { UpdateArticle } from "@/features/articles/actions/update-article";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save, SparkleIcon } from "lucide-react";
import Link from "@/components/AppLink";
import { useRouter } from "@/components/NavigationProvider";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import slugify from "slugify";
import { toast } from "sonner";
import { Article } from "@/generated/prisma/client";
import { constructUrl } from "@/lib/construct-url";

export function EditArticleForm({ article }: { article: Article }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<ArticleSchemaType>({
        resolver: zodResolver(articleSchema),
        defaultValues: {
            title: article.title,
            slug: article.slug,
            content: article.content,
            thumbnailKey: article.thumbnailKey || "",
            category: article.category,
            status: article.status as ArticleSchemaType["status"],
        },
    });

    function onSubmit(values: ArticleSchemaType) {
        startTransition(async () => {
            const response = await tryCatch(
                UpdateArticle(article.id, values)
            );

            if (response.error) {
                toast.error("An unexpected error occurred.");
                return;
            }

            const result = response.data;

            if (result.status === "success") {
                toast.success(result.message);
                router.refresh();
            } else if (result.status === "error") {
                toast.error(result.message);
            }
        });
    }

    return (
        <div className="max-w-[1600px] mx-auto pb-20 pt-10 px-4 sm:px-6">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/academy/creator"
                    className={buttonVariants({
                        variant: "ghost",
                        size: "icon",
                        className: "rounded-full hover:bg-muted",
                    })}
                >
                    <ArrowLeft className="size-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Article</h1>
                    <p className="text-muted-foreground mt-1">
                        Update your article content and settings
                    </p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-xl">Article Content</CardTitle>
                                    <CardDescription>
                                        Craft your article with our rich text editor.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Article Title</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g., The Future of AI in Finance"
                                                        className="text-lg font-medium h-12"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid gap-2">
                                        <FormField
                                            control={form.control}
                                            name="slug"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>URL Slug</FormLabel>
                                                    <div className="flex gap-2">
                                                        <FormControl>
                                                            <Input placeholder="article-url-slug" {...field} />
                                                        </FormControl>
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            onClick={() => {
                                                                const titleValue = form.getValues("title");
                                                                const slug = slugify(titleValue, {
                                                                    lower: true,
                                                                    strict: true,
                                                                });
                                                                form.setValue("slug", slug, {
                                                                    shouldValidate: true,
                                                                });
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
                                        name="content"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Content</FormLabel>
                                                <FormControl>
                                                    <div className="min-h-[500px] border rounded-md overflow-hidden">
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
                                        name="thumbnailKey"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Thumbnail Image</FormLabel>
                                                <FormControl>
                                                    <div className="aspect-video bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                                                        <MediaUploader
                                                            allowedTypes={["image"]}
                                                            maxSizeMB={2}
                                                            intent={UploadIntent.ARTICLE_THUMBNAIL}
                                                            uploadParams={{ articleId: article.id }}
                                                            existingMedia={
                                                                field.value
                                                                    ? [{ url: constructUrl(field.value), key: field.value, type: "IMAGE" }]
                                                                    : []
                                                            }
                                                            onChange={(files) => {
                                                                if (files.length > 0 && files[0].key) {
                                                                    field.onChange(files[0].key);
                                                                } else {
                                                                    field.onChange("");
                                                                }
                                                            }}
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
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {articleCategories.map((category) => (
                                                            <SelectItem key={category} value={category}>
                                                                {category}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="DRAFT">Draft</SelectItem>
                                                        <SelectItem value="PUBLISHED">Published</SelectItem>
                                                        <SelectItem value="ARCHIVED">Archived</SelectItem>
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
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full md:w-1/3 font-semibold text-lg px-8"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <>
                                    Saving...
                                    <Loader2 className="animate-spin ml-2" />
                                </>
                            ) : (
                                <>
                                    Save Changes
                                    <Save className="ml-2" size={18} />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div >
    );
}
