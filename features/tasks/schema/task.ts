import { z } from "zod";

const TaskTitleSchema = z
  .string()
  .min(1, "最低1文字以上入力してください")
  .max(100, "最大100文字まで入力してください");

export const CreateTaskSchema = z.object({
  title: TaskTitleSchema,
});

export const UpdateTaskSchema = z.object({
  id: z.number(),
  title: TaskTitleSchema,
  completed: z.boolean(),
  pending: z.boolean().nullish(),
});

export const DeleteTaskSchema = z.object({
  id: z.number(),
});
