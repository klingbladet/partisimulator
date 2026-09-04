# Partisimulator

A user can ask questions to a panel of Swedish political parties (LLMs) via a web chat interface.
Each party answers only from its own election manifesto, embedded and retrieved per party with RAG.
This keeps each voice grounded in its own source and distinct from the others.

## Good to know

This project uses LLMs (Large Language Models) to impersonate different Swedish political party candidates.
Each LLM gets a made-up personality and its party's election manifesto.
That manifesto is the basis for its answers in this application.

This is an experiment in what AI can do.
It's purely a school project, built for fun and games, not a production application.
That means it can get a bit over-the-top.

A notice about this must appear both globally and after each LLM response.

## Tech stack

### Frontend and backend

- Next.js (App Router)
- React
- Tailwind CSS

### Data and retrieval

- Supabase (Postgres with pgvector)
- Vercel AI SDK, with Anthropic and OpenAI providers

## Writing prose or comments

- Always refer to [the project's writing guide](../docs/TONE-OF-VOICE.md)
- Always refer to [the project's markdown guide](../docs/MARKDOWN-GUIDE.md)
- Keep comments to one line by default
- Write comments that explain the non-obvious why
- Never restate the code in a comment

## Writing code

There is no clarity in complexity.
No band aids, no quick fixes, and never hand-roll anything.
Skip custom utility types and manual API type definitions.
Don't build anything to solve constraints that built-in types or modern APIs can't handle.

Use only established patterns.
Don't use suppression comments to satisfy the linter.
Find real fixes instead.

Always refer to [the project's coding guide](../docs/CODING-GUIDE.md).

### Key principles for achieving high-quality code

- Quality above all
- Meaningful naming
- Simplicity and clarity
- Modularity
- Consistency
- Correctness and testing
- Modern

### General preferences

Always read and understand existing code before modifying it.
Don't refactor, rename, or "improve" code unrelated to the current task unless someone explicitly asks.
Fit new code seamlessly into existing patterns.

- Reuse components, utilities, and logic already in place
- Make only minimal and necessary changes
- Always run regression tests after changes to confirm existing functionality still works
- Each function should be testable in isolation
- Always present what you recommend and why

## Generating output in the chat

Don't compress an answer into a quick summary.
Only summarize when someone explicitly asks for it.
Otherwise, use short sentences and bullet points.

Respond concisely, and omit needless words.
Only answer the specific question asked.

## Execution and reasoning standards

### Deconstruct before generating

For complex or multi-step instructions, never attempt to solve the problem in one go.
You must explicitly break the task down into a serialized, step-by-step execution plan before generating any production code.

### Mandatory self-correction scratchpad

Before finalizing any response, run an internal verification pass.
Check your progress against the original prompt requirements (and your generated code/solution).
If you detect a logical flaw, edge case failure, or missed detail, explicitly pivot.
Correct the path in your reasoning, and don't double down on an incorrect assumption.

### No shortcut phrasing

Don't gloss over edge cases or skip steps using placeholders.
Address the core underlying problem completely.

### Iterative validation

Treat complex tasks as a series of checkpoints.
Validate the accuracy of step N before proceeding to step N+1.
Prioritize absolute logical consistency and detail retention over speed.

### Measure, do not estimate

Don't assert a fact without checking it first.
Examples include line counts, build warnings, whether a rule fires, how long something takes, and whether an API exists.
Run it, read it, count it.
An estimate presented as a measurement is worse than no answer, because the next decision builds on it.
Report what the measurement said, including when it contradicts what you expected or shows the work isn't finished.

## Using git

Never combine, chain, or batch multiple commands in a single response when using git commands.
Don't use shell operators such as &&, ;, ||, or | to do this.

Git is only allowed with "read-only" commands.

## Where to start?

See the [TODO list](../TODO.md)

## After each change and before a commit

Write to the [Changlog](../CHANGELOG.md)
