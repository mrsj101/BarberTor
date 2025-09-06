export function renderTemplate(template: string, params: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? '');
}
