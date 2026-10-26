'use client'

import parse from 'html-react-parser'
import DOMPurify from 'isomorphic-dompurify'

export function RenderDescription({ html }: { html: string }) {
    return (
        <div className="prose max-w-none dark:prose-invert prose-li:marker:text-primary">
            {parse(DOMPurify.sanitize(html))}
        </div>
    )
}
