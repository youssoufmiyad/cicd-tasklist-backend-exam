import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import type { Task } from "@prisma/client";

vi.mock("../../services/task.service.js", () => ({
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	remove: vi.fn(),
}));

import * as taskService from "../../services/task.service.js";
import app from "../../app.js";

const mockService = vi.mocked(taskService);

const mockTask: Task = {
	id: 1,
	title: "Test Task",
	description: "Test description",
	completed: false,
	createdAt: new Date("2026-01-01T00:00:00.000Z"),
	updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("app", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("applies CORS headers to responses", async () => {
		mockService.findAll.mockResolvedValue([]);

		const res = await request(app).get("/api/tasks");

		expect(res.headers["access-control-allow-origin"]).toBe("*");
	});

	it("returns 404 for routes outside /api/tasks", async () => {
		const res = await request(app).get("/unknown");

		expect(res.status).toBe(404);
	});
});
