import { afterAll, expect, test } from "vitest";
import supertest from "supertest";
import { app } from "./app.ts";

test("with HTTP injection", async () => {
	const response = await app.inject({
		method: "GET",
		url: "/",
	});

	expect(response.statusCode).toBe(200);
	expect(JSON.parse(response.payload)).toStrictEqual({ hello: "world" });
});

test("with a running server", async () => {
	await app.ready();

	const response = await supertest(app.server).get("/").expect(200);

	expect(response.body).toStrictEqual({ hello: "world" });
});

test("with fetch", async () => {
	await app.listen();
	await app.ready();

	const address = app.server.address();
	const port = typeof address === "string" ? address : address?.port;

	const response = await fetch(`http://localhost:${port}/`).then((r) => r.json());

	expect(response).toStrictEqual({ hello: "world" });
});

afterAll(async () => {
	await app.close();
});
