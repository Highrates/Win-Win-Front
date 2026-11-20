/** @vitest-environment jsdom */
import { Editor } from "@tiptap/core";
import { afterEach, describe, expect, it } from "vitest";
import {
  createRichEditorExtensions,
  normalizeAccountRichHtml,
} from "./createRichEditorExtensions";

function makeEditor(content = "<p></p>") {
  return new Editor({
    extensions: createRichEditorExtensions(),
    content,
  });
}

describe("RichBlock TipTap HTML contract", () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  it("serializes image data-size / data-align and case-media classes", () => {
    editor = makeEditor();
    editor
      .chain()
      .setImage({ src: "https://cdn.example/img.jpg", alt: "" })
      .run();

    let imgPos: number | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "image" && imgPos == null) {
        imgPos = pos;
        return false;
      }
      return undefined;
    });
    expect(imgPos).not.toBeNull();

    editor
      .chain()
      .command(({ tr, dispatch }) => {
        if (!dispatch || imgPos == null) return false;
        const node = tr.doc.nodeAt(imgPos);
        if (!node) return false;
        tr.setNodeMarkup(imgPos, undefined, {
          ...node.attrs,
          size: "small",
          align: "wrap",
        });
        return true;
      })
      .run();

    const html = editor.getHTML();
    expect(html).toContain('data-size="small"');
    expect(html).toContain('data-align="wrap"');
    expect(html).toContain("case-rich-media-image");
    expect(html).toContain("case-media-small");
    expect(html).toContain("case-media-wrap");
  });

  it("parses legacy image HTML and round-trips caption node", () => {
    editor = makeEditor(
      [
        '<img class="case-rich-media-image case-media-medium" src="https://cdn.example/b.jpg" data-align="center" data-size="medium" alt="" />',
        '<p class="case-rich-image-caption" data-align="center" data-size="medium">Подпись</p>',
      ].join(""),
    );

    const html = editor.getHTML();
    expect(html).toContain('data-size="medium"');
    expect(html).toContain('data-align="center"');
    expect(html).toContain("case-rich-image-caption");
    expect(html).toContain("Подпись");

    let captionPos: number | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "imageCaption" && captionPos == null) {
        captionPos = pos;
        return false;
      }
      return undefined;
    });
    expect(captionPos).not.toBeNull();
    editor.commands.setTextSelection((captionPos as number) + 1);
    expect(editor.isActive("imageCaption")).toBe(true);
  });

  it("inserts caption node with attrs after image", () => {
    editor = makeEditor();
    editor.commands.setImage({ src: "https://cdn.example/c.jpg", alt: "" });
    let imgPos: number | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "image" && imgPos == null) {
        imgPos = pos;
        return false;
      }
      return undefined;
    });
    expect(imgPos).not.toBeNull();
    const after = (imgPos as number) + editor.state.doc.nodeAt(imgPos as number)!.nodeSize;
    editor
      .chain()
      .insertContentAt(after, {
        type: "imageCaption",
        attrs: { align: "left", size: "full" },
        content: [{ type: "text", text: "cap" }],
      })
      .run();
    const html = editor.getHTML();
    expect(html).toContain("case-rich-image-caption");
    expect(html).toContain('data-align="left"');
    expect(html).toContain('data-size="full"');
    expect(html).toContain("cap");
  });

  it("toggles underline mark", () => {
    editor = makeEditor("<p>hello</p>");
    editor.commands.selectAll();
    expect(editor.isActive("underline")).toBe(false);
    editor.commands.toggleUnderline();
    expect(editor.isActive("underline")).toBe(true);
    expect(editor.getHTML()).toMatch(/<u>hello<\/u>|<u[^>]*>hello<\/u>/);
  });

  it("account variant demotes H1 and only allows H2/H3", () => {
    expect(normalizeAccountRichHtml("<h1 class=\"x\">Hi</h1>")).toBe(
      '<h2 class="x">Hi</h2>',
    );
    editor = new Editor({
      extensions: createRichEditorExtensions({ variant: "account" }),
      content: normalizeAccountRichHtml("<h1>Title</h1><p>body</p>"),
    });
    expect(editor.getHTML()).toContain("<h2>");
    expect(editor.getHTML()).not.toContain("<h1>");
    expect(editor.can().toggleHeading({ level: 1 })).toBe(false);
    expect(editor.can().toggleHeading({ level: 2 })).toBe(true);
  });
});
