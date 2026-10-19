import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";

vi.mock("$app/forms", () => ({
    enhance: (
        form: HTMLFormElement,
        submit: (options: { formData: FormData; cancel: () => void }) => void | Promise<void>,
    ) => {
        const handleSubmit = (event: SubmitEvent) => {
            event.preventDefault();
            void submit({ formData: new FormData(form), cancel: () => {} });
        };

        form.addEventListener("submit", handleSubmit);
        return { destroy: () => form.removeEventListener("submit", handleSubmit) };
    },
}));

vi.mock("$app/navigation", () => ({
    goto: vi.fn(),
}));

vi.mock("$app/paths", () => ({
    match: vi.fn(async (path: string) => {
        const routes: Record<string, string> = {
            "/app/example": "/app/(authenticated)/example",
            "/app/landing": "/app/(authenticated)/landing",
        };
        const id = routes[path];
        return id ? { id } : undefined;
    }),
    resolve: vi.fn((id: string) => {
        const routes: Record<string, string> = {
            "/app/(authenticated)/example": "/app/example",
            "/app/(authenticated)/landing": "/app/landing",
        };
        return routes[id] ?? id;
    }),
}));

vi.mock("#lib", () => ({
    fetchApi: vi.fn(),
}));

async function renderLoginPage(returnPage?: string) {
    sessionStorage.clear();
    if (returnPage !== undefined) {
        sessionStorage.setItem("return-page", returnPage);
    }

    vi.resetModules();

    const { default: login } = await import("../login/Login.svelte");
    const api = await import("#lib");
    const navigation = await import("$app/navigation");
    const paths = await import("$app/paths");

    const fetchApi = vi.mocked(api.fetchApi);
    const goto = vi.mocked(navigation.goto);
    const match = vi.mocked(paths.match);
    const resolve = vi.mocked(paths.resolve);
    fetchApi.mockClear();
    goto.mockClear();
    match.mockClear();
    resolve.mockClear();

    render(login);

    return { fetchApi, goto, match, resolve };
}

async function fillLoginCredentials(username: string, password: string) {
    await page.getByPlaceholder("Enter Username").fill(username);
    await page.getByPlaceholder("Enter Password").fill(password);
}

describe("login form", () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it("logs in without validation errors", async () => {
        const { fetchApi } = await renderLoginPage();
        fetchApi.mockResolvedValue(new Response(null, { status: 200 }));

        await fillLoginCredentials("kitten", "cat-password");
        await page.getByRole("button", { name: "Login" }).click();

        await vi.waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith("auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: "kitten", password: "cat-password" }),
            });
        });
        await expect.element(page.getByRole("listitem")).not.toBeInTheDocument();
    });

    it("shows an error when login credentials are incorrect", async () => {
        const { fetchApi } = await renderLoginPage();
        fetchApi.mockResolvedValue(new Response(null, { status: 401 }));

        await fillLoginCredentials("kitten", "wrong-password");
        await page.getByRole("button", { name: "Login" }).click();

        await expect.element(page.getByText("Invalid password, please try again.")).toBeInTheDocument();
    });

    it("shows validation errors when logging in with invalid values", async () => {
        const { fetchApi } = await renderLoginPage();

        await fillLoginCredentials("cat", "pw");
        await page.getByRole("button", { name: "Login" }).click();

        await expect.element(page.getByText(/^username -/)).toBeInTheDocument();
        await expect.element(page.getByText(/^password -/)).toBeInTheDocument();
        expect(fetchApi).not.toHaveBeenCalled();
    });

    it("redirects to the return page after a successful login", async () => {
        const { fetchApi, goto, match, resolve } = await renderLoginPage("/app/example");
        fetchApi.mockResolvedValue(new Response(null, { status: 200 }));

        await fillLoginCredentials("kitten", "cat-password");
        await page.getByRole("button", { name: "Login" }).click();

        await vi.waitFor(() => {
            expect(match).toHaveBeenCalledWith("/app/example");
            expect(resolve).toHaveBeenCalledWith("/app/(authenticated)/example");
            expect(goto).toHaveBeenCalledWith("/app/example");
        });
    });
});
