import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { RichBlock } from "./RichBlock";

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  // jsdom: ProseMirror scrollToSelection → getClientRects
  if (!(Range.prototype as { getClientRects?: () => DOMRectList }).getClientRects) {
    Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
  }
  if (
    !(Element.prototype as { getClientRects?: () => DOMRectList }).getClientRects
  ) {
    Element.prototype.getClientRects = () => [] as unknown as DOMRectList;
  }
});

vi.mock("@/components/admin/AdminModal/AdminModal", () => ({
  AdminModal: ({
    open,
    title,
    children,
    footer,
  }: {
    open: boolean;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
        {footer}
      </div>
    ) : null,
}));

vi.mock("@/components/AdminCompactBtn/AdminCompactBtn", () => ({
  AdminCompactBtn: ({
    children,
    onClick,
    type = "button",
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
    variant?: string;
    className?: string;
  }) => (
    <button type={type} onClick={onClick}>
      {children}
    </button>
  ),
}));

describe("RichBlock UI", () => {
  it("opens link dialog instead of window.prompt and validates URL", async () => {
    const promptSpy = vi.spyOn(window, "prompt");
    const onChange = vi.fn();
    render(
      <RichBlock
        value="<p>hello</p>"
        onChange={onChange}
        allowMedia={false}
        variant="admin"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTitle(/^Ссылка/)).toBeEnabled();
    });

    fireEvent.click(screen.getByTitle(/^Ссылка/));
    expect(promptSpy).not.toHaveBeenCalled();

    const dialog = await screen.findByRole("dialog", { name: "Ссылка" });
    expect(dialog).toBeInTheDocument();

    const input = screen.getByLabelText("URL");
    fireEvent.change(input, { target: { value: "javascript:alert(1)" } });
    fireEvent.click(screen.getByRole("button", { name: "Применить" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/http\(s\)|Некорректный|Только/);
    promptSpy.mockRestore();
  });

  it("underline toolbar button becomes active after toggle", async () => {
    const onChange = vi.fn();
    render(
      <RichBlock
        value="<p>hello</p>"
        onChange={onChange}
        allowMedia={false}
        variant="account"
      />,
    );

    const btn = await waitFor(() => {
      const el = screen.getByTitle(/^Подчёркивание/);
      expect(el).toBeEnabled();
      return el;
    });

    fireEvent.click(btn);

    await waitFor(() => {
      expect(btn).toHaveAttribute("aria-pressed", "true");
      expect(btn.className).toMatch(/richToolBtnActive|Active/);
    });
  });
});
