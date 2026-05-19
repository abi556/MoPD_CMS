```markdown
# MoPD_CMS Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the MoPD_CMS TypeScript codebase. It covers file naming, import/export styles, commit message conventions, and testing patterns. While no specific frameworks or automated workflows are detected, this guide provides best practices and command suggestions for consistent development.

## Coding Conventions

### File Naming
- **Style:** kebab-case  
  **Example:**  
  ```
  user-profile.ts
  data-service.ts
  ```

### Import Style
- **Mixed usage:** Both default and named imports are used.
  **Examples:**
  ```typescript
  import UserService from './user-service';
  import { getUser, updateUser } from './user-utils';
  ```

### Export Style
- **Mixed usage:** Both default and named exports are present.
  **Examples:**
  ```typescript
  // Default export
  export default function UserProfile() { ... }

  // Named export
  export function getUser() { ... }
  export const USER_ROLE = 'admin';
  ```

### Commit Message Conventions
- **Type:** Conventional Commits
- **Prefix:** `feat` (feature)
- **Average Length:** 73 characters
  **Example:**
  ```
  feat: add user authentication to login endpoint
  ```

## Workflows

### Create a New Feature
**Trigger:** When adding a new feature or module  
**Command:** `/create-feature`

1. Create a new file using kebab-case (e.g., `new-feature.ts`).
2. Use appropriate import/export style as per codebase.
3. Write code and include relevant tests in a corresponding `*.test.*` file.
4. Commit changes using the `feat` prefix and a descriptive message.

### Write and Run Tests
**Trigger:** When verifying code functionality  
**Command:** `/run-tests`

1. Create or update test files matching the pattern `*.test.*`.
2. Use the project's preferred (unknown) testing framework.
3. Run tests using the project's test runner (refer to project documentation or package scripts).

### Make a Conventional Commit
**Trigger:** When committing any code changes  
**Command:** `/commit-conventional`

1. Write commit messages using the `feat` prefix for new features.
2. Keep the message concise and under 73 characters.
3. Example:
   ```
   feat: implement data caching for dashboard
   ```

## Testing Patterns

- **File Pattern:** Test files follow the `*.test.*` naming convention (e.g., `user-service.test.ts`).
- **Framework:** Not explicitly detected; refer to project documentation.
- **Example:**
  ```typescript
  // user-service.test.ts
  import { getUser } from './user-service';

  test('should fetch user by ID', () => {
    expect(getUser(1)).toEqual({ id: 1, name: 'Alice' });
  });
  ```

## Commands

| Command             | Purpose                                    |
|---------------------|--------------------------------------------|
| /create-feature     | Scaffold and implement a new feature/module|
| /run-tests          | Run all test files in the codebase         |
| /commit-conventional| Make a commit using the conventional format|
```
