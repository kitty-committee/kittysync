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
    resolve: vi.fn((id: string) => (id === "/app/(authenticated)/landing" ? "/app/landing" : id)),
}));

vi.mock("#lib", () => ({
    fetchApi: vi.fn(),
}));

async function renderSignupPage() {
    vi.resetModules();

    const { default: signup } = await import("../signup/Signup.svelte");
    const api = await import("#lib");
    const navigation = await import("$app/navigation");
    const fetchApi = vi.mocked(api.fetchApi);
    const goto = vi.mocked(navigation.goto);
    fetchApi.mockClear();
    goto.mockClear();

    render(signup);

    return { fetchApi, goto };
}

async function fillSignupCredentials(username: string, password: string, repeatPassword: string) {
    await page.getByPlaceholder("Enter Username").fill(username);
    await page.getByPlaceholder("Enter Password").nth(0).fill(password);
    await page.getByPlaceholder("Enter Password").nth(1).fill(repeatPassword);
}

describe("signup form", () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it("signs up without validation errors", async () => {
        const { fetchApi, goto } = await renderSignupPage();
        fetchApi.mockResolvedValue(new Response(null, { status: 201 }));

        await fillSignupCredentials("kitten", "cat-password", "cat-password");
        await page.getByRole("button", { name: "Sign Up" }).click();

        await vi.waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith("auth/user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username: "kitten", password: "cat-password" }),
            });
            expect(goto).toHaveBeenCalledWith("/app/login");
        });
        await expect.element(page.getByRole("listitem")).not.toBeInTheDocument();
    });

    it("shows validation errors when signing up with invalid values", async () => {
        const { fetchApi } = await renderSignupPage();

        await fillSignupCredentials("cat", "pw", "pw");
        await page.getByRole("button", { name: "Sign Up" }).click();

        await expect.element(page.getByText(/^username -/)).toBeInTheDocument();
        await expect.element(page.getByText(/^password -/)).toBeInTheDocument();
        expect(fetchApi).not.toHaveBeenCalled();
    });
});
