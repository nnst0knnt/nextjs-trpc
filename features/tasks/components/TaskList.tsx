import { useCallback, useRef } from "react";

import { Transition } from "@headlessui/react";
import {
  Checkbox,
  CloseButton,
  Flex,
  Paper,
  Text,
  TextInput,
} from "@mantine/core";
import { useTimeout, useTimeoutFn } from "react-use";

import { useValidator } from "@/hooks";
import { trpc } from "@/utils/trpc/client";
import { asArray } from "@/utils/zod";

import { UpdateTaskSchema } from "../schema";
import type { DeleteTaskInput, Task, UpdateTaskInput } from "../types";

type TaskListProps = {
  tasks: Task[];
};

export const TaskList = ({ tasks = [] }: TaskListProps) => {
  const utils = trpc.useUtils();
  const mutations = {
    update: trpc.tasks.update.useMutation(),
    delete: trpc.tasks.delete.useMutation(),
  };
  const validator = useValidator({
    schema: asArray(UpdateTaskSchema, "tasks"),
    defaultValues: {
      tasks,
    },
  });
  const validatorAsArray = validator.asArray("tasks");

  const deletedTask = useRef<number | null>(null);
  const [, , animatingDeleted] = useTimeoutFn(async () => {
    await utils.tasks.list.invalidate();
    deletedTask.current = null;
  }, 500);
  const [animatingAdded] = useTimeout(500);

  const pendingTask = useCallback(
    (index: number, task: UpdateTaskInput) =>
      validatorAsArray.update(index, { ...task, pending: true }),
    [validatorAsArray.update],
  );

  const fixedTask = useCallback(
    (index: number, task: UpdateTaskInput) =>
      validatorAsArray.update(index, { ...task, pending: false }),
    [validatorAsArray.update],
  );

  const updateTask = useCallback(
    async (index: number, { pending: _pending, ...task }: UpdateTaskInput) =>
      validator.validate({
        onSuccess: async () => {
          fixedTask(index, task);

          mutations.update.mutate(task, {
            onSuccess: async () => {
              await utils.tasks.list.invalidate();
            },
          });
        },
      }),
    [mutations.update, validator, utils.tasks.list, fixedTask],
  );

  const deleteTask = useCallback(
    (task: DeleteTaskInput) =>
      mutations.delete.mutate(task, {
        onSuccess: () => {
          deletedTask.current = task.id;
          animatingDeleted();
        },
      }),
    [mutations.delete, animatingDeleted],
  );

  return (
    <Flex direction="column" gap="lg">
      {validatorAsArray.tasks.map((task, index) => (
        <Transition
          key={task.id}
          show={!deletedTask.current || task.id !== deletedTask.current}
          appear={!!animatingAdded()}
          enter="transition-all ease-in-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition-all ease-in-out duration-300"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Paper
            key={task.id}
            shadow="sm"
            p="md"
            radius="md"
            mah={68}
            withBorder
            classNames={{
              root: `!cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-6 hover:shadow-md ${
                validator.formState.errors.tasks?.[index]?.title?.message
                  ? "!border-red-400 !border-2 "
                  : ""
              }${
                task.pending
                  ? "!border-blue-400 !border-2 hover:!bg-transparent"
                  : ""
              }`,
            }}
            onClick={() =>
              !task.completed && !task.pending && pendingTask(index, task)
            }
          >
            <Flex justify="space-between" align="center">
              <Flex align="center" gap="md" className="!flex-1 overflow-hidden">
                <Checkbox
                  size="md"
                  classNames={{ input: "!cursor-pointer" }}
                  checked={task.completed}
                  {...validator.register(`tasks.${index}.completed`, {
                    onChange: (e) => {
                      e.stopPropagation();
                      updateTask(index, {
                        ...task,
                        completed: e.target.checked,
                      });
                    },
                  })}
                />
                {task.completed && (
                  <Text
                    size="lg"
                    truncate
                    className="!line-through !text-[#888] font-bold"
                  >
                    {task.title}
                  </Text>
                )}
                {!task.completed && (
                  <Flex
                    h={36}
                    align="center"
                    className="overflow-hidden !w-full"
                  >
                    {task.pending && (
                      <TextInput
                        className="!w-full"
                        variant="unstyled"
                        classNames={{
                          input:
                            "!max-h-[36px] !text-[1.15rem] font-bold !text-[#333] !w-full",
                        }}
                        {...validator.register(`tasks.${index}.title`, {
                          onBlur: (e) => {
                            e.stopPropagation();

                            if (e.target.value !== task.title) {
                              updateTask(index, {
                                ...task,
                                title: e.target.value,
                              });
                            } else {
                              fixedTask(index, task);
                            }
                          },
                        })}
                        autoFocus
                      />
                    )}
                    {!task.pending && (
                      <Text
                        size="lg"
                        truncate
                        className="!text-[#333] !w-full font-bold"
                      >
                        {task.title}
                      </Text>
                    )}
                  </Flex>
                )}
              </Flex>
              <CloseButton
                size="lg"
                className="hover:!bg-gray-200 dark:!hover:bg-dark-6"
                disabled={
                  mutations.delete.isPending || deletedTask.current === task.id
                }
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTask({ id: task.id });
                }}
              />
            </Flex>
          </Paper>
        </Transition>
      ))}
    </Flex>
  );
};
