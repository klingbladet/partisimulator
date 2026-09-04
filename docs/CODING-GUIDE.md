# Coding guidelines

## Naming

1. Use kebab-case for files and folders
2. Use camelCase for variables, functions, and methods
3. Use PascalCase for class names and constructors
4. Use SCREAMING_SNAKE_CASE for named constants, like fixed primitive values (numbers, strings, and booleans)
5. Use descriptive names for all identifiers
6. Never use single-letter or abbreviated names like `e`, `err`, `cb`, `res`, or `req` (or similar)

## Code structure

1. Use single-responsibility functions (each function should do one thing only)
2. Use guard clauses and early returns: place a logical NOT before the condition, and return early instead of nesting
3. Always define functions before their first use (no hoisting)
4. Use explicit if-else logic
5. Avoid ternaries and compact expressions
6. If you can write it with if-else, do that instead
7. Avoid duplicate code: extract logic used in more than one place into a single shared function
8. Put that function in the appropriate folder, for example utils/, services/, middleware/, et cetera

## Readability

1. Write code so clear that even a non-developer can follow the broad logic
2. Write code as if the reader has no prior experience with the codebase
3. Prefer clarity over cleverness, always
4. Avoid hacky, clever, or "magic" solutions
5. If a solution needs a comment to explain why it works, rewrite it
6. Aim to write clean, readable, and self-documenting code, as self-explanatory as possible
7. Use comments when the logic is non-obvious
8. Keep comments brief and to the point

## Error handling

1. Use try-catch for operations that can fail
2. Always use `throw new Error("message")` instead of `throw "message"`

## TypeScript

1. Use interface instead of type when possible
2. Use explicit return types on exported functions, adding `: type` after the parameters, to show what we're exporting
3. Define types and interfaces that multiple files share in the types/ folder
4. Keep types used by only one file defined in that same file
