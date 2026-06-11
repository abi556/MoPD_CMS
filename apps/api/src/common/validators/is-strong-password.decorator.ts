import { registerDecorator, type ValidationOptions } from 'class-validator';
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from './password-policy';

export function IsStrongPassword(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: String(propertyName),
      options: {
        message: PASSWORD_POLICY_MESSAGE,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && isStrongPassword(value);
        },
        defaultMessage(): string {
          return (
            (typeof validationOptions?.message === 'string'
              ? validationOptions.message
              : undefined) ?? PASSWORD_POLICY_MESSAGE
          );
        },
      },
    });
  };
}
