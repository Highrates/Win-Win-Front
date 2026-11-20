/** @vitest-environment jsdom */
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRef } from "react";
import type { Editor } from "@tiptap/react";
import { richBlockStrings } from "@/lib/richBlockI18n";
import { useRichBlockUpload } from "./useRichBlockUpload";

const strings = richBlockStrings("ru");

function wrapUpload(
  uploadMedia?: (file: File, type: "image" | "video") => Promise<string>,
) {
  return renderHook(() => {
    const editorRef = useRef<Editor | null>(null);
    const onChangeRef = useRef(vi.fn());
    return useRichBlockUpload({
      editorRef,
      uploadMedia,
      value: "",
      onChangeRef,
      strings,
    });
  });
}

describe("useRichBlockUpload base64 guard", () => {
  it("rejects file insert without uploadMedia (no FileReader path)", async () => {
    const onUploadError = vi.fn();
    const { result } = renderHook(() => {
      const editorRef = useRef<Editor | null>(null);
      const onChangeRef = useRef(vi.fn());
      return useRichBlockUpload({
        editorRef,
        value: "",
        onChangeRef,
        onUploadError,
        strings,
      });
    });

    const file = new File(["x"], "a.png", { type: "image/png" });
    act(() => {
      result.current.insertImage(file);
    });

    await waitFor(() => {
      expect(result.current.uploadError).toMatch(/uploadMedia|data URL/i);
    });
    expect(onUploadError).toHaveBeenCalled();
    expect(result.current.canInsertMedia).toBe(false);
    expect(result.current.showFilePickers).toBe(false);
  });

  it("uploads via uploadMedia when provided", async () => {
    const uploadMedia = vi.fn(async () => "https://cdn.example/a.png");
    const { result } = wrapUpload(uploadMedia);

    expect(result.current.canInsertMedia).toBe(true);
    expect(result.current.showFilePickers).toBe(true);

    const file = new File(["x"], "a.png", { type: "image/png" });
    await act(async () => {
      result.current.insertImage(file);
    });

    await waitFor(() => {
      expect(uploadMedia).toHaveBeenCalledWith(file, "image");
    });
  });
});
