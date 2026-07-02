import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { vi } from "vitest";
import testPrisma from "./setup.js";

// Mock the prisma singleton to use the test client
vi.mock("../../lib/prisma.js", () => ({
	default: testPrisma,
}));

// Import app AFTER mocking prisma
const { default: app } = await import("../../app.js");
import request from "supertest";

const seedTask = {
	title: "Seed Task",
	description: "Seed Description",
};

describe("Task API E2E Tests", () => {
	beforeEach(async () => {
		// Clean up database between tests
		await testPrisma.task.deleteMany();
	});

	afterAll(async () => {
		await testPrisma.$disconnect();
	});

	describe("GET /api/tasks", () => {
		it("should return 200 with an empty array when no tasks exist", async () => {
			const res = await request(app).get("/api/tasks");

			expect(res.status).toBe(200);
			expect(res.body).toEqual([]);
		});

		it("should return 200 with all tasks", async () => {
			await testPrisma.task.create({ data: seedTask });

			const res = await request(app).get("/api/tasks");

			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(1);
			expect(res.body[0].title).toBe(seedTask.title);
		});
	});

	describe("GET /api/tasks/:id", () => {
		it("should return 200 with the task when found", async () => {
			const created = await testPrisma.task.create({ data: seedTask });

			const res = await request(app).get(`/api/tasks/${created.id}`);

			expect(res.status).toBe(200);
			expect(res.body.id).toBe(created.id);
			expect(res.body.title).toBe(seedTask.title);
		});

		it("should return 404 when task does not exist", async () => {
			const res = await request(app).get("/api/tasks/99999");

			expect(res.status).toBe(404);
			expect(res.body).toEqual({ error: "Task not found" });
		});

		it("should return 400 for a non-numeric id", async () => {
			const res = await request(app).get("/api/tasks/abc");

			expect(res.status).toBe(400);
			expect(res.body).toEqual({ error: "Invalid task ID" });
		});
	});

	describe("POST /api/tasks", () => {
		it("should create a new task and return 201", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({ title: "E2E Task", description: "E2E Description" });

			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty("id");
			expect(res.body.title).toBe("E2E Task");
			expect(res.body.description).toBe("E2E Description");
			expect(res.body.completed).toBe(false);
		});

		it("should create a task without description", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({ title: "No Description Task" });

			expect(res.status).toBe(201);
			expect(res.body.title).toBe("No Description Task");
		});

		it("should return 400 when title is missing", async () => {
			const res = await request(app).post("/api/tasks").send({});

			expect(res.status).toBe(400);
			expect(res.body).toEqual({
				error: "Title is required and must be a non-empty string",
			});
		});

		it("should return 400 when title is an empty string", async () => {
			const res = await request(app).post("/api/tasks").send({ title: "   " });

			expect(res.status).toBe(400);
			expect(res.body).toEqual({
				error: "Title is required and must be a non-empty string",
			});
		});

		it("should return 400 when title is not a string", async () => {
			const res = await request(app).post("/api/tasks").send({ title: 123 });

			expect(res.status).toBe(400);
			expect(res.body).toEqual({
				error: "Title is required and must be a non-empty string",
			});
		});
	});

	describe("PUT /api/tasks/:id", () => {
		it("should update and return the task with 200", async () => {
			const created = await testPrisma.task.create({ data: seedTask });

			const res = await request(app)
				.put(`/api/tasks/${created.id}`)
				.send({ title: "Updated Title", completed: true });

			expect(res.status).toBe(200);
			expect(res.body.title).toBe("Updated Title");
			expect(res.body.completed).toBe(true);
		});

		it("should return 400 for a non-numeric id", async () => {
			const res = await request(app)
				.put("/api/tasks/abc")
				.send({ title: "Updated" });

			expect(res.status).toBe(400);
			expect(res.body).toEqual({ error: "Invalid task ID" });
		});

		it("should return 404 when task does not exist", async () => {
			const res = await request(app)
				.put("/api/tasks/99999")
				.send({ title: "Updated" });

			expect(res.status).toBe(404);
			expect(res.body).toEqual({ error: "Task not found" });
		});
	});

	describe("DELETE /api/tasks/:id", () => {
		it("should delete the task and return 204", async () => {
			const created = await testPrisma.task.create({ data: seedTask });

			const res = await request(app).delete(`/api/tasks/${created.id}`);

			expect(res.status).toBe(204);

			const found = await testPrisma.task.findUnique({ where: { id: created.id } });
			expect(found).toBeNull();
		});

		it("should return 400 for a non-numeric id", async () => {
			const res = await request(app).delete("/api/tasks/abc");

			expect(res.status).toBe(400);
			expect(res.body).toEqual({ error: "Invalid task ID" });
		});

		it("should return 404 when task does not exist", async () => {
			const res = await request(app).delete("/api/tasks/99999");

			expect(res.status).toBe(404);
			expect(res.body).toEqual({ error: "Task not found" });
		});
	});
});
