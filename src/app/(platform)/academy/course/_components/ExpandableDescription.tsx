"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RenderDescription } from "@/components/shared/text-editor/RenderDescription";

interface ExpandableDescriptionProps {
  html: string;
  limit?: number;
}

export function ExpandableDescription({ html, limit = 200 }: ExpandableDescriptionProps) {
  const [expanded, setExpanded] = useState(false);

  const fullText = useMemo(() => {
    // Strip HTML tags to get plain text
    return html.replace(/<[^>]*>?/gm, "");
  }, [html]);

  const isLong = fullText.length > limit;

  const preview = isLong ? fullText.slice(0, limit) + "..." : fullText;

  if (!isLong) {
    return <RenderDescription html={html} />;
  }

  return (
    <div className="space-y-3">
      {expanded ? (
        <RenderDescription html={html} />
      ) : (
        <p className="text-muted-foreground leading-relaxed text-base">
          {preview}
        </p>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="p-0 h-auto text-primary"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? "Show less" : "Show more"}
      </Button>
    </div>
  );
}
