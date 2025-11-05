import Papa from 'papaparse';

export interface SheetIdea {
  raw: Record<string, string>;
  title: string;
  description: string;
  tags: string[];
}

export const fetchIdeas = async (sheetUrl?: string) => {
  if (!sheetUrl) {
    return [] as SheetIdea[];
  }
  const normalized = normalizeSheetUrl(sheetUrl);
  const response = await fetch(normalized);
  if (!response.ok) {
    throw new Error(`Failed to load sheet: ${response.status}`);
  }
  const csv = await response.text();
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true
  });
  if (parsed.errors?.length) {
    console.warn(parsed.errors);
  }
  return parsed.data.map((row) => {
    const title = row.title ?? row.idea ?? row.Topic ?? Object.values(row)[0] ?? 'Untitled Idea';
    const description =
      row.description ?? row.Details ?? row.Story ?? row.Body ?? row.Content ?? row.Synopsis ?? title;
    const tags = (row.tags ?? row.keywords ?? '')
      .split(/[,#]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
    return { raw: row, title, description, tags } satisfies SheetIdea;
  });
};

const normalizeSheetUrl = (input: string) => {
  if (input.includes('gviz/tq')) {
    return input.replace(/gviz\/tq.*$/, 'gviz/tq?tqx=out:csv');
  }
  if (input.includes('/export?')) {
    return input.replace(/export\?.*$/, 'export?format=csv');
  }
  if (input.endsWith('/edit') || input.endsWith('/edit#gid=0')) {
    return input.replace(/\/edit.*$/, '/export?format=csv');
  }
  return input;
};
