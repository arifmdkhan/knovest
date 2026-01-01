"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Loader2, User as UserIcon, BookOpen, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { searchGlobal } from "@/features/search/actions/search.action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface GlobalSearchInputProps {
    className?: string;
}

import { User, Course, Article } from "@/generated/prisma/client";

interface SearchResults {
    users: Partial<User>[];
    courses: (Partial<Course> & { isSaved?: boolean })[];
    articles: Partial<Article>[];
}

export function GlobalSearchInput({ className }: GlobalSearchInputProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState(searchParams.get("q") || "");
    const [results, setResults] = useState<SearchResults | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync with URL
    useEffect(() => {
        const urlQuery = searchParams.get("q") || "";
        if (inputRef.current && inputRef.current.value !== urlQuery) {
            inputRef.current.value = urlQuery;
            setQuery(urlQuery);
        }
    }, [searchParams]);

    // Debounce Search
    useEffect(() => {
        if (query.length < 2) {
            setResults(null);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(() => {
            startTransition(async () => {
                const res = await searchGlobal(query);
                if (res.status === "success" && res.data) {
                    setResults(res.data);
                    setIsOpen(true);
                } else {
                    setResults(null);
                    setIsOpen(false);
                }
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current && !inputRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setIsOpen(false);
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    const clearSearch = () => {
        setQuery("");
        if (inputRef.current) {
            inputRef.current.value = "";
            inputRef.current.focus();
        }
        setResults(null);
        setIsOpen(false);
        if (window.location.pathname === "/search") {
            router.push("/search");
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    const handleFocus = () => {
        if (query.length >= 2 && results) {
            setIsOpen(true);
        }
    };

    return (
        <div className={cn("relative w-full max-w-sm flex items-center bg-muted/50 rounded-md border border-transparent transition-colors focus-within:bg-background focus-within:ring-1 focus-within:ring-ring", className)}>
            <form onSubmit={handleSearch} className="relative w-full h-full flex items-center">
                <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    ref={inputRef}
                    value={query}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    placeholder="Search..."
                    className="pl-9 pr-8 h-full w-full bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                />
                {query ? (
                    <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-3 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3 w-3" />
                    </button>
                ) : null}
            </form>

            {isOpen && results && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-md shadow-lg overflow-hidden z-50 max-h-[80vh] overflow-y-auto"
                >
                    {isPending && (
                        <div className="p-4 flex justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {!isPending && (
                        <>
                            {results.users.length === 0 && results.courses.length === 0 && results.articles.length === 0 && (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No results found.
                                </div>
                            )}

                            {results.users.length > 0 && (
                                <div className="py-2">
                                    <h3 className="px-4 text-xs font-semibold text-muted-foreground mb-2">People</h3>
                                    {results.users.map((user) => (
                                        <Link
                                            key={user.id}
                                            href={`/profile/${user.username}`}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors"
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.image || ""} />
                                                <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{user.name}</span>
                                                <span className="text-xs text-muted-foreground">@{user.username}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {results.courses.length > 0 && (
                                <div className="py-2 border-t">
                                    <h3 className="px-4 text-xs font-semibold text-muted-foreground mb-2 mt-2">Courses</h3>
                                    {results.courses.map((course) => (
                                        <Link
                                            key={course.id}
                                            href={`/academy/course/${course.slug}`}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                                                <BookOpen className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="text-sm font-medium truncate">{course.title}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {results.articles.length > 0 && (
                                <div className="py-2 border-t">
                                    <h3 className="px-4 text-xs font-semibold text-muted-foreground mb-2 mt-2">Articles</h3>
                                    {results.articles.map((article) => (
                                        <Link
                                            key={article.id}
                                            href={`/academy/article/${article.slug}`} // Assuming article link
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                                                <FileText className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="text-sm font-medium truncate">{article.title}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
