import { procedure } from "@/utils/trpc/factories";

import { CreateTaskSchema } from "../schema";

export const createTask = procedure
  .input(CreateTaskSchema)
  .mutation(async ({ input, ctx: { db, revalidate } }) => {
    await db.task.create({ data: input });

    revalidate("/");
  });
