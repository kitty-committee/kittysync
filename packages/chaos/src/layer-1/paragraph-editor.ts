import { Collaboration } from "@tiptap/extension-collaboration";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { Editor } from "@tiptap/core";
import * as Y from "yjs";

export type ParagraphEdit =
    { type: "insert"; offset: number; text: string } | { type: "delete"; offset: number; length: number };

export function createParagraphEditor(document: Y.Doc): Editor {
    return new Editor({
        extensions: [
            StarterKit.configure({ undoRedo: false }),
            Collaboration.configure({ document, field: "content" }),
            Markdown,
        ],
    });
}

export function applyParagraphEdit(editor: Editor, edit: ParagraphEdit): void {
    const paragraph = editor.state.doc.firstChild;
    if (paragraph === null || paragraph.type.name !== "paragraph") {
        throw new Error("Generated edit requires a paragraph at the document start");
    }

    const textLength = paragraph.content.size;
    if (edit.type === "insert") {
        const offset = Math.min(edit.offset, textLength);
        editor.commands.insertContentAt(offset + 1, edit.text);
        return;
    }

    if (textLength === 0) return;

    const from = Math.min(edit.offset, textLength - 1);
    const to = Math.min(from + edit.length, textLength);
    editor.commands.deleteRange({ from: from + 1, to: to + 1 });
}

export function editorSnapshot(editor: Editor): { json: unknown; markdown: string } {
    return {
        json: editor.getJSON(),
        markdown: editor.getMarkdown(),
    };
}
