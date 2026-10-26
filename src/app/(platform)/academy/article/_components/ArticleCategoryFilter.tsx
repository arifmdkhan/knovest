'use client';

import { Suspense, useCallback } from 'react';
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "@/components/NavigationProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { articleCategories } from "@/features/articles/schemas";

const categories = articleCategories;

function CategoryFilterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const currentCategory = searchParams.get('category');

    const createQueryString = useCallback(
        (name: string, value: string | null) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === null) {
                params.delete(name);
            } else {
                params.set(name, value);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleCategoryChange = (category: string) => {
        const newCategory = category === "all" ? null : category;
        router.push(pathname + '?' + createQueryString('category', newCategory));
    };

    return (
        <div className="flex justify-end mb-8">
            <Select
                value={currentCategory || "all"}
                onValueChange={handleCategoryChange}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                            {category}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

export function ArticleCategoryFilter() {
    return (
        <Suspense fallback={<div className="h-10 w-[200px] mx-auto animate-pulse bg-muted/20 rounded-md"></div>}>
            <CategoryFilterContent />
        </Suspense>
    )
}
