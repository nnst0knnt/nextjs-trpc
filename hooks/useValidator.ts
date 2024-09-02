"use client";

import { useCallback, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { isEqual } from "lodash";
import {
  type ArrayPath,
  type FieldErrors,
  useFieldArray,
  useForm,
  type UseFormProps,
} from "react-hook-form";
import type { z, ZodObject, ZodRawShape } from "zod";

type SchemaObject<T extends ZodRawShape> = ZodObject<T>;

type Schema<T extends ZodRawShape> = z.infer<SchemaObject<T>>;

type ValidateProps<T extends ZodRawShape> = {
  onSuccess: (data: Schema<T>) => unknown;
  onError?: (errors: FieldErrors<SchemaObject<T>>) => unknown;
};

type UseValidatorProps<T extends ZodRawShape> = UseFormProps<Schema<T>> & {
  schema: SchemaObject<T>;
};

export const useValidator = <T extends ZodRawShape>({
  schema,
  defaultValues,
  ...props
}: UseValidatorProps<T>) => {
  const { formState, getValues, reset, trigger, ...form } = useForm<Schema<T>>({
    ...props,
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isEqual(formState?.defaultValues, defaultValues)) return;

    reset(defaultValues as Schema<T>);
  }, [defaultValues, reset, formState?.defaultValues]);

  const validate = useCallback(
    async ({ onSuccess, onError }: ValidateProps<T>) => {
      const isSuccess = await trigger();

      if (isSuccess) {
        onSuccess(getValues());
        return;
      }

      if (onError) {
        onError(formState.errors);
        return;
      }
    },
    [trigger, getValues, formState.errors],
  );

  const asArray = useCallback(
    (name: ArrayPath<Schema<T>>) => {
      const { fields, ...rest } = useFieldArray({
        control: form.control,
        name,
        keyName: "uuid",
      });

      const currentFields = fields.length
        ? fields
        : defaultValues && name in defaultValues
          ? defaultValues?.[name as keyof typeof defaultValues]
          : [];

      return {
        ...rest,
        ...({ [name]: currentFields } as {
          [K in typeof name]: typeof currentFields;
        }),
      };
    },
    [defaultValues, form.control],
  );

  return {
    ...{
      ...form,
      formState,
    },
    validate,
    asArray,
  };
};
