import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { CaseImage, CaseVideo, ImageCaption } from "./caseRichExtensions";
import type { RichBlockVariant } from "./richBlockTypes";

export type CreateRichEditorOptions = {
  placeholder?: string;
  /** account: только H2/H3 (не конкурировать с page H1). */
  variant?: RichBlockVariant;
  /** i18n placeholder пустой imageCaption. */
  captionPlaceholder?: string;
};

/** Общий набор расширений RichBlock — для редактора и smoke-тестов. */
export function createRichEditorExtensions(
  placeholderOrOpts: string | CreateRichEditorOptions = "",
) {
  const opts: CreateRichEditorOptions =
    typeof placeholderOrOpts === "string"
      ? { placeholder: placeholderOrOpts }
      : placeholderOrOpts;
  const placeholder = opts.placeholder ?? "";
  const headingLevels =
    opts.variant === "account" ? ([2, 3] as const) : ([1, 2, 3] as const);

  return [
    StarterKit.configure({
      heading: { levels: [...headingLevels] },
      underline: false,
      link: false,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { rel: "noopener noreferrer nofollow" },
    }),
    Underline,
    TextAlign.configure({
      types: ["heading", "paragraph"],
      /** left/center/right в тулбаре; justify не предлагаем. */
      alignments: ["left", "center", "right"],
    }),
    Placeholder.configure({
      placeholder,
    }),
    CaseImage,
    CaseVideo,
    ImageCaption.configure({
      placeholder:
        opts.captionPlaceholder ?? "Подпись к изображению…",
    }),
  ];
}

/** В ЛК H1 из legacy HTML → H2, чтобы не терять текст при schema без level 1. */
export function normalizeAccountRichHtml(html: string): string {
  if (!html) return html;
  return html
    .replace(/<h1(\s[^>]*)?>/gi, "<h2$1>")
    .replace(/<\/h1>/gi, "</h2>");
}
