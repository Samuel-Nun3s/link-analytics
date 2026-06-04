import { useState } from "react";
import { useForm } from "react-hook-form";
import { ApiException } from "../lib/api";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Modal } from "./ui/Modal";
import type { CreateLinkInput } from "../types/api";

type FormValues = {
  originalUrl: string;
  slug?: string;
  expiresAt?: string;
  maxClicks?: string; // string porque input type=number devolve string
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateLinkInput) => Promise<unknown>;
};

export function CreateLinkModal({ open, onClose, onCreate }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const input: CreateLinkInput = {
        originalUrl: values.originalUrl,
        slug: values.slug || undefined,
        expiresAt: values.expiresAt
          ? new Date(values.expiresAt).toISOString()
          : undefined,
        maxClicks: values.maxClicks ? Number(values.maxClicks) : undefined,
      };
      await onCreate(input);
      reset();
      onClose();
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.code === "CONFLICT") {
          setServerError("Esse slug já está em uso");
        } else if (err.code === "VALIDATION_ERROR") {
          const details = err.details as Array<{ path: string; message: string }>;
          setServerError(details?.[0]?.message ?? err.message);
        } else {
          setServerError(err.message);
        }
      } else {
        setServerError("Erro ao criar link");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo link">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="URL original *"
          type="url"
          placeholder="https://exemplo.com"
          autoFocus
          error={errors.originalUrl?.message}
          {...register("originalUrl", { required: "URL obrigatória" })}
        />

        <Input
          label="Slug (opcional)"
          placeholder="meulink (vazio = auto-gerado)"
          error={errors.slug?.message}
          {...register("slug", {
            pattern: {
              value: /^[a-zA-Z0-9_-]{3,30}$/,
              message: "3-30 caracteres: letras, números, _ ou -",
            },
          })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Expira em (opcional)"
            type="datetime-local"
            {...register("expiresAt")}
          />
          <Input
            label="Máx. cliques (opcional)"
            type="number"
            min={1}
            placeholder="100"
            {...register("maxClicks")}
          />
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
            {serverError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Criando..." : "Criar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
