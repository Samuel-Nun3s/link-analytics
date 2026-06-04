import { formatNumber, formatShortUrl, truncateMiddle } from "../../lib/format";

type Item = { slug: string; originalUrl: string; clicks: number };

type Props = {
  data: Item[];
};

export function TopLinksTable({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-slate-500">Sem links no período</div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
          <th className="pb-2 pr-4 font-medium">Slug</th>
          <th className="pb-2 pr-4 font-medium">Destino</th>
          <th className="pb-2 font-medium text-right">Cliques</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.slug} className="border-b border-slate-100 last:border-0">
            <td className="py-2 pr-4">
              <a
                href={formatShortUrl(row.slug)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-indigo-600 hover:underline"
              >
                /{row.slug}
              </a>
            </td>
            <td className="py-2 pr-4 text-slate-600 text-xs">
              {truncateMiddle(row.originalUrl, 60)}
            </td>
            <td className="py-2 text-right font-medium tabular-nums">
              {formatNumber(row.clicks)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
