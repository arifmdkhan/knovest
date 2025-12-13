import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function TrendingTopicsSkeleton() {
  return (
    <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="w-8 h-8 rounded-md" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i}>
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

const TRENDING_DATA = [
  { id: 1, topic: "Nifty 50", posts: "12.5k" },
  { id: 2, topic: "#BankNifty", posts: "8.2k" },
  { id: 3, topic: "Reliance", posts: "5.1k" },
  { id: 4, topic: "#StockMarketCrash", posts: "3.4k" },
  { id: 5, topic: "HDFC Bank", posts: "2.9k" },
];

export function TrendingTopics() {
  return (
    <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm hover:shadow-md mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-primary/10 rounded-md">
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-lg">Trending</h3>
      </div>

      <div className="space-y-4">
        {TRENDING_DATA.map((item) => (
          <div key={item.id} className="group cursor-pointer">
            <p className="text-sm font-semibold group-hover:text-primary transition-colors">
              {item.topic}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.posts} posts
            </p>
          </div>
        ))}
      </div>

      <button className="w-full text-center text-xs text-primary hover:underline mt-4">
        Show more
      </button>
    </div>
  );
}