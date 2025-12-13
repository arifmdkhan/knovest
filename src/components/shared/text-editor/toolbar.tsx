"use client";

import { type Editor } from "@tiptap/react";
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Link as LinkIcon,
    Image as ImageIcon,
    Undo,
    Redo,
    Heading1,
    Heading2,
    Heading3,
    Pilcrow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { LinkModal } from "./link-modal";

interface EditorToolbarProps {
    editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [, forceUpdate] = useState({});

    useEffect(() => {
        if (!editor) return;

        const onUpdate = () => forceUpdate({});
        editor.on("transaction", onUpdate);
        editor.on("selectionUpdate", onUpdate);

        return () => {
            editor.off("transaction", onUpdate);
            editor.off("selectionUpdate", onUpdate);
        };
    }, [editor]);

    if (!editor) {
        return null;
    }

    const addImage = () => {
        const url = window.prompt("URL");
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const setLink = (url: string) => {
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();
    };

    return (
        <TooltipProvider>
            <div className="border-b p-2 flex flex-wrap gap-1 items-center bg-background sticky top-0 z-10">
                <LinkModal
                    isOpen={isLinkModalOpen}
                    onClose={() => setIsLinkModalOpen(false)}
                    onSubmit={setLink}
                    initialUrl={editor.getAttributes("link").href}
                />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="sm"
                            variant={editor.isActive("bold") ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            aria-label="Toggle bold"
                            className="h-8 w-8 p-0"
                        >
                            <Bold className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bold</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="sm"
                            variant={editor.isActive("italic") ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            aria-label="Toggle italic"
                            className="h-8 w-8 p-0"
                        >
                            <Italic className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Italic</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="sm"
                            variant={editor.isActive("underline") ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            aria-label="Toggle underline"
                            className="h-8 w-8 p-0"
                        >
                            <Underline className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Underline</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="sm"
                            variant={editor.isActive("strike") ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            aria-label="Toggle strikethrough"
                            className="h-8 w-8 p-0"
                        >
                            <Strikethrough className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Strikethrough</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="sm"
                            variant={editor.isActive("paragraph") ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().setParagraph().run()}
                            aria-label="Paragraph"
                            className="h-8 w-8 p-0"
                        >
                            <Pilcrow className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Paragraph</TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="sm"
                            variant={editor.isActive("heading", { level: 1 }) ? "default" : "ghost"}
                            onClick={(e) => {
                                e.preventDefault();
                                editor.chain().focus().toggleHeading({ level: 1 }).run();
                            }}
                            aria-label="Heading 1"
                            className="h-8 w-8 p-0"
                        >
                            <Heading1 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Heading 1</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="sm"
                            variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
                            onClick={(e) => {
                                e.preventDefault();
                                editor.chain().focus().toggleHeading({ level: 2 }).run();
                            }}
                            aria-label="Heading 2"
                            className="h-8 w-8 p-0"
                        >
                            <Heading2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Heading 2</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="sm"
                            variant={editor.isActive("heading", { level: 3 }) ? "default" : "ghost"}
                            onClick={(e) => {
                                e.preventDefault();
                                editor.chain().focus().toggleHeading({ level: 3 }).run();
                            }}
                            aria-label="Heading 3"
                            className="h-8 w-8 p-0"
                        >
                            <Heading3 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Heading 3</TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="sm"
                            variant={editor.isActive("bulletList") ? "default" : "ghost"}
                            onClick={(e) => {
                                e.preventDefault();
                                editor.chain().focus().toggleBulletList().run();
                            }}
                            aria-label="Bullet list"
                            className="h-8 w-8 p-0"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bullet List</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="sm"
                            variant={editor.isActive("orderedList") ? "default" : "ghost"}
                            onClick={(e) => {
                                e.preventDefault();
                                editor.chain().focus().toggleOrderedList().run();
                            }}
                            aria-label="Ordered list"
                            className="h-8 w-8 p-0"
                        >
                            <ListOrdered className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ordered List</TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="sm"
                            variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"}
                            onClick={() =>
                                editor.chain().focus().setTextAlign("left").run()
                            }
                            aria-label="Align left"
                            className="h-8 w-8 p-0"
                        >
                            <AlignLeft className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Align Left</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="sm"
                            variant={editor.isActive({ textAlign: "center" }) ? "default" : "ghost"}
                            onClick={() =>
                                editor.chain().focus().setTextAlign("center").run()
                            }
                            aria-label="Align center"
                            className="h-8 w-8 p-0"
                        >
                            <AlignCenter className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Align Center</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="sm"
                            variant={editor.isActive({ textAlign: "right" }) ? "default" : "ghost"}
                            onClick={() =>
                                editor.chain().focus().setTextAlign("right").run()
                            }
                            aria-label="Align right"
                            className="h-8 w-8 p-0"
                        >
                            <AlignRight className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Align Right</TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant={editor.isActive("link") ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setIsLinkModalOpen(true)}
                            aria-label="Add link"
                            className="h-8 w-8 p-0"
                        >
                            <LinkIcon className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Link</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={addImage}
                            aria-label="Add image"
                            className="h-8 w-8 p-0"
                        >
                            <ImageIcon className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Image</TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => editor.commands.undo()}
                            disabled={!editor.can().undo()}
                            aria-label="Undo"
                            className="h-8 w-8 p-0"
                        >
                            <Undo className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Undo</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => editor.commands.redo()}
                            disabled={!editor.can().redo()}
                            aria-label="Redo"
                            className="h-8 w-8 p-0"
                        >
                            <Redo className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Redo</TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}
