import { mergeAttributes, Node } from "@tiptap/core";
import Image from "@tiptap/extension-image";

export type RichAlign = "left" | "center" | "right" | "wrap" | "wrap-end";
export type RichSize = "small" | "medium" | "full";

const SIZE_CLASS: Record<RichSize, string> = {
  small: "case-media-small",
  medium: "case-media-medium",
  full: "case-media-full",
};

const ALIGN_CLASS: Record<RichAlign, string> = {
  left: "case-media-left",
  center: "case-media-center",
  right: "case-media-right",
  wrap: "case-media-wrap",
  "wrap-end": "case-media-wrap-end",
};

function parseAlignFromEl(el: HTMLElement): RichAlign | null {
  const data = el.getAttribute("data-align")?.trim();
  if (
    data === "left" ||
    data === "center" ||
    data === "right" ||
    data === "wrap" ||
    data === "wrap-end"
  ) {
    return data;
  }
  for (const [align, cls] of Object.entries(ALIGN_CLASS) as [
    RichAlign,
    string,
  ][]) {
    if (el.classList.contains(cls)) return align;
  }
  return null;
}

function parseSizeFromEl(el: HTMLElement): RichSize | null {
  const data = el.getAttribute("data-size")?.trim();
  if (data === "small" || data === "medium" || data === "full") return data;
  for (const [size, cls] of Object.entries(SIZE_CLASS) as [RichSize, string][]) {
    if (el.classList.contains(cls)) return size;
  }
  return null;
}

function imageClassList(align: RichAlign | null, size: RichSize | null): string {
  const parts = ["case-rich-media-image"];
  if (size) parts.push(SIZE_CLASS[size]);
  if (align) parts.push(ALIGN_CLASS[align]);
  return parts.join(" ");
}

/**
 * Legacy HTML contract: те же data-* / case-media-* классы, что уже лежат в БД
 * и стилизует публичный `.rich-content` — без миграции контента.
 */
export const CaseImage = Image.extend({
  name: "image",

  addOptions() {
    return {
      ...this.parent?.(),
      inline: false,
      allowBase64: true,
      HTMLAttributes: {},
      resize: false as const,
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: "",
      },
      title: {
        default: null,
      },
      align: {
        default: null as RichAlign | null,
        parseHTML: (el) => parseAlignFromEl(el as HTMLElement),
        renderHTML: (attrs) =>
          attrs.align ? { "data-align": attrs.align as string } : {},
      },
      size: {
        default: null as RichSize | null,
        parseHTML: (el) => parseSizeFromEl(el as HTMLElement),
        renderHTML: (attrs) =>
          attrs.size ? { "data-size": attrs.size as string } : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]:not([src^="data:"])',
      },
      {
        tag: 'img[src^="data:"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const align = (node.attrs.align as RichAlign | null) ?? null;
    const size = (node.attrs.size as RichSize | null) ?? null;
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: imageClassList(align, size),
        alt: node.attrs.alt || "",
      }),
    ];
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    caseVideo: {
      setCaseVideo: (options: { src: string }) => ReturnType;
    };
  }
}

export const CaseVideo = Node.create({
  name: "caseVideo",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute("src"),
        renderHTML: (attrs) => (attrs.src ? { src: attrs.src as string } : {}),
      },
    };
  },

  parseHTML() {
    return [
      { tag: "video.case-rich-media-video" },
      { tag: "video[src]" },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(
        { class: "case-rich-media-video", controls: "true" },
        HTMLAttributes,
      ),
    ];
  },

  addCommands() {
    return {
      setCaseVideo:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { src: options.src },
          }),
    };
  },
});

export const ImageCaption = Node.create({
  name: "imageCaption",
  group: "block",
  content: "inline*",
  defining: true,

  addOptions() {
    return {
      placeholder: "Подпись к изображению…",
    };
  },

  addAttributes() {
    return {
      align: {
        default: null as RichAlign | null,
        parseHTML: (el) => parseAlignFromEl(el as HTMLElement),
        renderHTML: (attrs) =>
          attrs.align ? { "data-align": attrs.align as string } : {},
      },
      size: {
        default: null as RichSize | null,
        parseHTML: (el) => parseSizeFromEl(el as HTMLElement),
        renderHTML: (attrs) =>
          attrs.size ? { "data-size": attrs.size as string } : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        /** Выше default paragraph (50), иначе legacy HTML теряет класс подписи. */
        tag: "p.case-rich-image-caption",
        priority: 60,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "p",
      mergeAttributes(
        {
          class: "case-rich-image-caption",
          "data-placeholder": this.options.placeholder,
        },
        HTMLAttributes,
      ),
      0,
    ];
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        if (!editor.isActive(this.name)) return false;
        const { $from } = editor.state.selection;
        const after = $from.after();
        return editor
          .chain()
          .insertContentAt(after, { type: "paragraph" })
          .setTextSelection(after + 1)
          .focus()
          .run();
      },
    };
  },
});
