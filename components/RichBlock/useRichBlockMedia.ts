"use client";

import type { Editor } from "@tiptap/react";
import type { MutableRefObject } from "react";
import type { RichBlockStrings } from "@/lib/richBlockI18n";
import type {
  RichBlockPickMediaFromLibrary,
  RichBlockUploadMedia,
} from "./richBlockTypes";
import { useRichBlockMediaPresets } from "./useRichBlockMediaPresets";
import { useRichBlockUpload } from "./useRichBlockUpload";

type Args = {
  editorRef: MutableRefObject<Editor | null>;
  allowMedia: boolean;
  uploadMedia?: RichBlockUploadMedia;
  pickMediaFromLibrary?: RichBlockPickMediaFromLibrary;
  onUploadError?: (message: string) => void;
  value: string;
  onChangeRef: MutableRefObject<(value: string) => void>;
  mediaToolbarClass: string;
  formatToolbarClass: string;
  proseMirrorClass: string;
  strings: RichBlockStrings;
};

/** Фасад: upload + presets/selection. */
export function useRichBlockMedia(args: Args) {
  const upload = useRichBlockUpload({
    editorRef: args.editorRef,
    uploadMedia: args.uploadMedia,
    pickMediaFromLibrary: args.pickMediaFromLibrary,
    onUploadError: args.onUploadError,
    value: args.value,
    onChangeRef: args.onChangeRef,
    strings: args.strings,
  });

  const presets = useRichBlockMediaPresets({
    editorRef: args.editorRef,
    allowMedia: args.allowMedia,
    mediaToolbarClass: args.mediaToolbarClass,
    formatToolbarClass: args.formatToolbarClass,
    proseMirrorClass: args.proseMirrorClass,
  });

  return {
    ...presets,
    uploadError: upload.uploadError,
    runUploadRef: upload.runUploadRef,
    syncSelectionRef: presets.syncSelectionRef,
    captureInsertCursor: upload.captureInsertCursor,
    pickImageFromLibrary: upload.pickImageFromLibrary,
    pickVideoFromLibrary: upload.pickVideoFromLibrary,
    insertImage: upload.insertImage,
    insertVideo: upload.insertVideo,
    addCaptionToSelectedImage: presets.addCaptionToSelectedImage,
    setSelectedImageAlt: presets.setSelectedImageAlt,
    deleteSelectedMedia: presets.deleteSelectedMedia,
    selectedImageAlt: presets.selectedImageAlt,
    selectedIsImage: presets.selectedIsImage,
    busy: upload.busy,
    uploadBusy: upload.uploadBusy,
    useLibraryPicker: upload.useLibraryPicker,
    canInsertMedia: upload.canInsertMedia,
    showFilePickers: upload.showFilePickers,
  };
}
