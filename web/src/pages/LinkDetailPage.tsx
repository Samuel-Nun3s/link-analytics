import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { CategoryBreakdown } from "../components/charts/CategoryBreakdown";
import { ClicksOverTime } from "../components/charts/ClicksOverTime";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { RangeSelector } from "../components/ui/RangeSelector";
import { useAnalytics } from "../hooks/useAnalytics";
import { useLinkDetail } from "../hooks/useLinkDetail";
import { ApiException } from "../lib/api";
import { formatDate, formatNumber, formatShortUrl } from "../lib/format";
import type { RangeKey, UpdateLinkInput } from "../types/api";

function bucketFor(range: RangeKey): "hour" | "day" {
  return range === "24h" || range === "7d" ? "hour" : "day";
}

type EditForm = {
  originalUrl: string;
  slug: string;
};

export function LinkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeKey>("7d");
  const [includeBots, setIncludeBots] = useState(false);

  const { data: link, loading: linkLoading, error: linkError, update, deactivate } = useLinkDetail(id);
  const { data: analytics, loading: aLoading, error: aError } = useAnalytics({
    range,
    includeBots,
    linkId: id,
  });

  if (linkLoading && !link) {
    return <div className="text-slate-500">Carregando...</div>;
  }
  if (linkError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
        {linkError}
      </div>
    );
  }
  if (!link) return null;

  return (
    <div>
      <button
        onClick={() => navigate("/links")}
        className="text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        ← Voltar pra lista
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 mb-1">
            /{link.slug}
          </h1>
          <a
            href={formatShortUrl(link.slug)}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-indigo-600 hover:underline"
          >
            {formatShortUrl(link.slug)}
          </a>
        </div>
        <span
          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
            link.active
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {link.active ? "Ativo" : "Desativado"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Filtros */}
          <div className="flex items-center justify-end gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={includeBots}
                onChange={(e) => setIncludeBots(e.target.checked)}
                className="rounded border-slate-300"
              />
              Incluir bots
            </label>
            <RangeSelector value={range} onChange={setRange} />
          </div>

          {aError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
              {aError}
            </div>
          )}

          {aLoading && !analytics ? (
            <div className="text-center text-slate-500 py-12">Carregando analytics...</div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Cliques no período" value={formatNumber(analytics.totals.clicks)} />
                <StatCard label="IPs únicos" value={formatNumber(analytics.totals.uniqueIps)} />
              </div>

              <Card title="Cliques no tempo">
                <ClicksOverTime data={analytics.timeSeries} bucket={bucketFor(range)} />
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Por país">
                  <CategoryBreakdown
                    data={analytics.byCountry.map((c) => ({
                      name: c.country ?? "Desconhecido",
                      clicks: c.clicks,
                    }))}
                  />
                </Card>
                <Card title="Por dispositivo">
                  <CategoryBreakdown
                    data={analytics.byDeviceType.map((d) => ({
                      name: d.deviceType,
                      clicks: d.clicks,
                    }))}
                  />
                </Card>
              </div>
            </>
          ) : null}
        </div>

        {/* Sidebar com info + edição */}
        <div className="space-y-6">
          <Card title="Informações">
            <dl className="text-sm space-y-2">
              <Info label="Total de cliques" value={formatNumber(link.clickCount)} />
              <Info label="Criado em" value={formatDate(link.createdAt)} />
              <Info label="Atualizado em" value={formatDate(link.updatedAt)} />
              <Info
                label="Expira em"
                value={link.expiresAt ? formatDate(link.expiresAt) : "—"}
              />
              <Info
                label="Máx. cliques"
                value={link.maxClicks !== null ? formatNumber(link.maxClicks) : "—"}
              />
              <Info label="Slug custom" value={link.customSlug ? "Sim" : "Não"} />
            </dl>
          </Card>

          <EditForm
            currentSlug={link.slug}
            currentUrl={link.originalUrl}
            onSubmit={update}
          />

          {link.active && (
            <Card>
              <Button
                variant="danger"
                className="w-full"
                onClick={async () => {
                  if (confirm("Desativar este link? Cliques históricos serão preservados.")) {
                    await deactivate();
                  }
                }}
              >
                Desativar link
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="text-xs uppercase text-slate-500 mb-2">{label}</div>
      <div className="text-2xl font-semibold text-slate-800 tabular-nums">{value}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-800 font-medium text-right">{value}</dd>
    </div>
  );
}

function EditForm({
  currentSlug,
  currentUrl,
  onSubmit,
}: {
  currentSlug: string;
  currentUrl: string;
  onSubmit: (input: UpdateLinkInput) => Promise<unknown>;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<EditForm>({
    defaultValues: { originalUrl: currentUrl, slug: currentSlug },
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function handle(values: EditForm) {
    setServerError(null);
    setSubmitting(true);
    try {
      const payload: UpdateLinkInput = {};
      if (values.originalUrl !== currentUrl) payload.originalUrl = values.originalUrl;
      if (values.slug !== currentSlug) payload.slug = values.slug;
      if (Object.keys(payload).length === 0) {
        setServerError("Nenhuma mudança");
      } else {
        await onSubmit(payload);
        setSavedAt(Date.now());
      }
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.code === "CONFLICT") setServerError("Slug já está em uso");
        else if (err.code === "VALIDATION_ERROR") {
          const details = err.details as Array<{ path: string; message: string }>;
          setServerError(details?.[0]?.message ?? err.message);
        } else setServerError(err.message);
      } else setServerError("Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="Editar">
      <form onSubmit={handleSubmit(handle)} className="space-y-3">
        <Input
          label="URL"
          type="url"
          error={errors.originalUrl?.message}
          {...register("originalUrl", { required: "URL obrigatória" })}
        />
        <Input
          label="Slug"
          error={errors.slug?.message}
          {...register("slug", {
            required: "Slug obrigatório",
            pattern: {
              value: /^[a-zA-Z0-9_-]{3,30}$/,
              message: "3-30 caracteres: letras, números, _ ou -",
            },
          })}
        />
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-md">
            {serverError}
          </div>
        )}
        {savedAt && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 rounded-md">
            Salvo
          </div>
        )}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Salvando..." : "Salvar mudanças"}
        </Button>
      </form>
    </Card>
  );
}
