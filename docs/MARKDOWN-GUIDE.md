# Markdown guide

This document contains preferences for markdown.

Reference this document when writing, editing, or viewing any markdown file.

This project uses [markdownlint](https://github.com/davidanson/markdownlint) by David Anson.

Special markdown linting rules live in ".markdownlint.jsonc" (in the project's root).

Use ["writing-for-interfaces"](skills/writing-for-interfaces/SKILL.md) when reviewing or improving text.

## General rules

### Language

- Use American English
- Use the serial comma
- Spell out Latin expressions: "for example", "that is", "and so on"
- Never shorten words, though established acronyms such as TCI, MIDI, and DAW are fine

### Characters

- Never use emoji
- Never use em dashes or en dashes
- Never use a double hyphen (in prose)
- Never use curly or "smart" quotes, and use a straight quote for an apostrophe

### Formatting

- Never use italics, bold, strikethrough, or highlighting
- Never use blockquotes
- Show syntax samples in straight quotes, and in backticks if they would otherwise render

## Structure

- Keep text short and to the point
- Write one sentence per line
- Keep sentences under 20 words

## Headings

You can use up to six heading levels by writing "#" (number sign) at the start of a line.

Each number sign adds one level of heading depth.

Use sentence case for both headings and sub-headings.

## Sectioning content

Never use horizontal rules or separation lines to section content.

Use clear headings and sub-headings to distinguish parts of a document.

## Lists

- Never open a bullet with a bold label acting as a fake heading
- Never use full stops after a single-sentence bullet point

### Ordered lists

1. Ordered list item
2. Ordered list item
3. Ordered list item

### Unordered lists

Create a bulleted list by using a "-" (hyphen) followed by a space.

- Bulleted list item
- Bulleted list item
- Bulleted list item

### Task lists

- Use "- [ ]" for bulleted/unordered task lists
- Use "1. [ ]" for numbered task lists

Adding an "x" between the square brackets will tick off a task list item.

### Nesting lists

You can nest lists several levels deep, and combine them.

Indent nested list items with four spaces or a tab.

- First level
    - Second level

1. First level
    1. Second level

- First level unordered list item
    1. Second level ordered list item

## Images

Never use images.

## Links

Use links when needed, in this format: [text to link](https://example.com/)

## Tables

Avoid tables for anything other than pure tabular data that needs quick scanning.
Use lists and subheadings instead.

If a table is absolutely warranted, display it in a copy-paste-friendly format.

Not all data benefits from tabular display.

Align pipe characters vertically, a style sometimes called padded or non-compact.
Never create tables that are more than two columns wide.

### Good example

| Character | Meaning |
| --------- | ------- |
| Y         | Yes     |
| N         | No      |

### Bad example

| Character | Meaning | Column 3 |
| --------- | ------- | -------  |
| Y         | Yes     | Value    |
| N         | No      | Value    |

## Code

- Use a single backtick to indicate code within a line
- Use three backticks to create a fenced code block
- Tag fenced code blocks with a language

## Math

- Never use math, for example LaTeX expressions
- Never use superscript or subscript

## Metadata

Never use metadata or front matter in any markdown file, except SKILL.md files.
