import { procedure } from "@/utils/trpc/factories";

import { DeleteTaskSchema } from "../schema";

export const deleteTask = procedure
  .input(DeleteTaskSchema)
  .mutation(async ({ input, ctx: { db, revalidate } }) => {
    await db.task.delete({ where: { id: input.id } });

    revalidate("/");
  });
