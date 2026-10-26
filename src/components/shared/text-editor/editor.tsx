"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { EditorToolbar } from "./toolbar";

export function TextEditor({ field }: { field: { value?: string; onChange: (value: string) => void } }) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                link: false,
                underline: false,
                heading: {
                    levels: [1, 2, 3],
                },
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            }),
            Image,
            Link.configure({
                openOnClick: false,
            }),
            Underline,
            Placeholder.configure({
                placeholder: "Start writing your beautiful article...",
            }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
        ],
        content: field.value ?? "",
        onUpdate: ({ editor }) => {
            field.onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class:
                    "prose prose-sm sm:prose-base m-5 focus:outline-none max-w-none dark:prose-invert",
            },
        },
    });

    return (
        <div className="border rounded-md shadow-sm bg-card min-h-[500px] flex flex-col">
            <EditorToolbar editor={editor} />
            <div className="flex-1 p-4 cursor-text max-h-[500px] overflow-y-auto" onClick={() => editor?.commands.focus()}>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
