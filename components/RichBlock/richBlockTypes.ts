export type RichBlockUploadMedia = (
  file: File,
  type: "image" | "video",
) => Promise<string>;

/** Выбор уже загруженного файла из медиатеки (админ). Возвращает публичный URL или null при отмене. */
export type RichBlockPickMediaFromLibrary = (
  kind: "image" | "video",
) => Promise<string | null>;

export type RichBlockVariant = "admin" | "account";
