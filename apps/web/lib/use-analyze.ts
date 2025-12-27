"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useState } from "react";
import { createAnalysis } from "./api";

type FormState = {
  name: string;
  age: string;
  description: string;
};

export const useAnalyze = () => {
  const [form, setForm] = useState<FormState>({
    name: "",
    age: "",
    description: "",
  });
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onChange =
    (field: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setRequestId(null);

      const payload = {
        name: form.name.trim(),
        age: Number(form.age),
        description: form.description.trim(),
      };

      if (!payload.name || !payload.description || Number.isNaN(payload.age)) {
        setError("Please fill name, age, and description.");
        return;
      }

      setSubmitting(true);
      try {
        const data = await createAnalysis(payload);
        setRequestId(data.requestId);
        setForm({ name: "", age: "", description: "" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Network error";
        setError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [form]
  );

  return {
    form,
    requestId,
    error,
    submitting,
    onChange,
    onSubmit,
  };
};
