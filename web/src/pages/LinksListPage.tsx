import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateLinkModal } from "../components/CreateLinkModal";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { useLinks } from "../hooks/useLinks";
import {
  formatDate,
  formatNumber,
  formatShortUrl,
  truncateMiddle,
} from "../lib/format";
import type { Link } from "../types/api";

const PAGE_SIZE = 20;

export function LinksListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, loading, error, createLink } = useLinks({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Links</h1>
        <Button onClick={() => setModalOpen(true)}>+ Novo link</Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <Card>
        {loading && !data ? (
          <div className="text-center text-slate-500 py-8">Carregando...</div>
        ) : (
          <>
            <Table<Link>
              columns={[
                {
                  key: "slug",
                  header: "Slug",
                  render: (l) => (
                    <a
                      href={formatShortUrl(l.slug)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-mono text-xs text-indigo-600 hover:underline"
                    >
                      /{l.slug}
                    </a>
                  ),
                },
                {
                  key: "originalUrl",
                  header: "Destino",
                  render: (l) => (
                    <span className="text-xs text-slate-600">
                      {truncateMiddle(l.originalUrl, 60)}
                    </span>
                  ),
                },
                {
                  key: "clicks",
                  header: "Cliques",
                  className: "text-right tabular-nums",
                  render: (l) => formatNumber(l.clickCount),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (l) => (
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        l.active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {l.active ? "Ativo" : "Desativado"}
                    </span>
                  ),
                },
                {
                  key: "createdAt",
                  header: "Criado em",
                  className: "text-xs text-slate-500",
                  render: (l) => formatDate(l.createdAt),
                },
              ]}
              rows={data?.items ?? []}
              rowKey={(l) => l.id}
              onRowClick={(l) => navigate(`/links/${l.id}`)}
              empty="Nenhum link criado ainda"
            />

            {data && totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200 text-sm">
                <span className="text-slate-500">
                  Página {page + 1} de {totalPages} ({data.total} no total)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page + 1 >= totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <CreateLinkModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={createLink}
      />
    </div>
  );
}
