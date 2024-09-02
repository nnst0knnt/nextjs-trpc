import type { Task as Model } from "@prisma/client";
import type { z } from "zod";

import type {
  CreateTaskSchema,
  DeleteTaskSchema,
  UpdateTaskSchema,
} from "../schema";

export type Task = Model;

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export type DeleteTaskInput = z.infer<typeof DeleteTaskSchema>;
