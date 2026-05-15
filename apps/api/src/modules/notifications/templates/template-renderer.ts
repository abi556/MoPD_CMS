export type TemplateVariables = Record<string, string | number | boolean>;

/**
 * Simple mustache-style {{var}} substitution for notification bodies.
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables,
): string {
  return template.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (_, key: string) => {
      const value = variables[key];
      if (value === undefined || value === null) {
        return '';
      }
      return String(value);
    },
  );
}
