import { AdminLayout } from "@/components/AdminLayout";
import { Layout } from "@/components/Layout";
import { ThemeToggle } from "@/components/ThemeToggle";
import { THEME_STORAGE_KEY, ThemeProvider } from "@/hooks/useTheme";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createMockState } from "./mockBackend";
import { renderWithProviders } from "./renderWithProviders";

/**
 * Coverage for the icon-only sun/moon theme control and the app-wide light
 * theme it switches to.
 *
 * The control is exercised through the real `ThemeProvider` and the real
 * `Layout` / `AdminLayout` chrome, so this proves the toggle's placement, its
 * accessible label, the `dark` class it flips on <html>, and the persisted
 * choice — not the deployed CSS. `index.css` and the pre-paint script in
 * `index.html` are not loaded by jsdom, so the actual light/dark token values
 * are outside this suite's reach.
 */

/** Reset the class the provider writes so tests do not leak into each other. */
afterEach(() => {
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "";
});

describe("ThemeToggle", () => {
  it("is an icon-only button labelled with the action it performs", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    // The provider starts from the <html> class; with no `dark` class that is
    // light, so the button offers to switch to dark.
    const button = screen.getByRole("button", { name: "Switch to dark theme" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    // Icon-only: the accessible name comes from the label, not visible text.
    expect(button).toHaveTextContent("");

    await user.click(button);

    const toggled = screen.getByRole("button", {
      name: "Switch to light theme",
    });
    expect(toggled).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("persists the chosen theme and restores it on the next mount", async () => {
    const user = userEvent.setup();
    const first = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    );
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    first.unmount();
    // Simulate a reload: the pre-paint script would have applied the stored
    // theme to <html> before React mounts, so seed that class here.
    document.documentElement.classList.add("dark");

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});

describe("public Layout theme control", () => {
  it("renders the theme button next to the Admin link in the desktop nav", async () => {
    renderWithProviders(<Layout>content</Layout>, { state: createMockState() });

    const adminLink = await screen.findByTestId("nav.admin_link");
    const toggle = screen.getByTestId("nav.theme_toggle");
    expect(toggle).toBeInTheDocument();
    // The desktop nav holds both, and the toggle follows the Admin link.
    const nav = adminLink.closest("nav");
    expect(nav).not.toBeNull();
    expect(nav).toContainElement(toggle);
    expect(
      adminLink.compareDocumentPosition(toggle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("offers the theme button inside the mobile menu and closes the menu on toggle", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Layout>content</Layout>, { state: createMockState() });

    // The router resolves asynchronously, so the first query must await. The
    // mobile menu is closed, so only the desktop toggle is mounted.
    await screen.findByTestId("nav.menu_toggle");
    expect(screen.getAllByTestId("nav.theme_toggle")).toHaveLength(1);

    await user.click(screen.getByTestId("nav.menu_toggle"));
    const toggles = screen.getAllByTestId("nav.theme_toggle");
    expect(toggles).toHaveLength(2);
    const mobileToggle = toggles[1] as HTMLElement;
    expect(mobileToggle).toBeInTheDocument();

    await user.click(mobileToggle);
    // The mobile toggle closes the menu after flipping the theme.
    expect(
      screen.queryByTestId("nav.mobile_admin_link"),
    ).not.toBeInTheDocument();
    expect(document.documentElement).toHaveClass("dark");
  });
});

describe("admin theme control", () => {
  it("renders the theme button in the admin chrome", async () => {
    renderWithProviders(
      <AdminLayout username="Midhu" onLogout={() => {}}>
        admin content
      </AdminLayout>,
      { state: createMockState(), initialEntries: ["/admin"] },
    );

    expect(await screen.findByTestId("nav.theme_toggle")).toBeInTheDocument();
  });
});

describe("theme provider storage fallback", () => {
  it("still applies the theme when localStorage is unavailable", async () => {
    const user = userEvent.setup();
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("storage disabled");
      });

    try {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      await user.click(
        screen.getByRole("button", { name: "Switch to dark theme" }),
      );
      // The in-memory theme still applies even though persistence failed.
      expect(document.documentElement).toHaveClass("dark");
    } finally {
      setItem.mockRestore();
    }
  });
});
