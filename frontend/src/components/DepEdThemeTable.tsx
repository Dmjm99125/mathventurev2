import { Card } from '@/components/ui';
import type { DepEdTheme } from '@/data/depedThemes';

interface DepEdThemeTableProps {
  theme?: DepEdTheme;
}

export function DepEdThemeTable({ theme }: DepEdThemeTableProps) {
  if (!theme) {
    return (
      <Card className="w-full max-w-4xl border-4 border-dashed border-primary/20 p-6 text-center">
        <p className="font-bold text-muted-foreground">Theme information unavailable</p>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl border-4 border-primary/20 p-4 shadow-xl sm:p-6">
      <div
        className="overflow-x-auto rounded-xl"
        tabIndex={0}
        aria-label={`${theme.title} DepEd curriculum theme table`}
      >
        <table className="w-full min-w-[42rem] border-collapse text-left">
          <caption className="sr-only">{theme.title} DepEd curriculum theme</caption>
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="w-1/3 px-4 py-3 text-sm font-extrabold uppercase tracking-wide" scope="col">
                Field
              </th>
              <th className="px-4 py-3 text-sm font-extrabold uppercase tracking-wide" scope="col">
                Content
              </th>
            </tr>
          </thead>
          <tbody>
            {theme.rows.map((row) => (
              <tr key={row.field} className="border-b border-border last:border-b-0 even:bg-muted/30">
                <th className="align-top px-4 py-4 text-sm font-extrabold text-foreground" scope="row">
                  {row.field}
                </th>
                <td className="px-4 py-4 text-sm font-medium leading-6 text-muted-foreground">
                  {row.content}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
