'use client';

import { Suspense, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { courseCategories } from "@/features/courses/schemas";

const categories = courseCategories;

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
        // If "all" is selected or the same category, remove the filter
        const newCategory = category === "all" ? null : category;
        router.push(pathname + '?' + createQueryString('category', newCategory));
    };

    return (
        <div className="flex justify-end mb-8">
            <Select
                value={currentCategory || "all"}
                onValueChange={handleCategoryChange}
            >
                <SelectTrigger className="w-[180px]">
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

export function CategoryFilter() {
    return (
        <Suspense fallback={<div className="h-10 w-[180px] mx-auto animate-pulse bg-muted/20 rounded-md"></div>}>
            <CategoryFilterContent />
        </Suspense>
    )
}
