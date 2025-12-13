"use client";

import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash } from "lucide-react";
import { useTransition } from "react";
import { DeleteArticle } from "@/server/actions/articles/delete-article";
import { tryCatch } from "@/helper/try-catch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeleteArticleButtonProps {
    articleId: string;
    articleTitle: string;
}

export function DeleteArticleButton({ articleId, articleTitle }: DeleteArticleButtonProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    function onDelete() {
        startTransition(async () => {
            const { data: result, error } = await tryCatch(DeleteArticle(articleId));
            if (error) {
                toast.error("An unexpected error occurred.");
                return;
            }
            if (result.status === "success") {
                toast.success(result.message);
                router.refresh();
            } else if (result.status === "error") {
                toast.error(result.message);
            }
        });
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isPending}>
                    <Trash className="w-4 h-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Article?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        article "{articleTitle}".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
