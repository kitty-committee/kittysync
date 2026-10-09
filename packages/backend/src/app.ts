import Fastify from "fastify";

export const app = Fastify({
	logger: true,
});

// Declare a route
app.get("/", function (_, reply) {
	reply.send({ hello: "world" });
});
