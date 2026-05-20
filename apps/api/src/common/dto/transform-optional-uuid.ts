import { Transform } from 'class-transformer';

/** Strips Swagger UI placeholders and blanks so @IsOptional() UUID fields stay unset. */
export function TransformOptionalUuid(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value !== 'string') {
      return value;
    }
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === 'string') {
      return undefined;
    }
    return trimmed;
  });
}
