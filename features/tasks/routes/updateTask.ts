import { procedure } from "@/utils/trpc/factories";

import { UpdateTaskSchema } from "../schema";

export const updateTask = procedure
  .input(UpdateTaskSchema)
  .mutation(async ({ input, ctx: { db, revalidate } }) => {
    await db.task.update({ where: { id: input.id }, data: input });

    revalidate("/");
  });
