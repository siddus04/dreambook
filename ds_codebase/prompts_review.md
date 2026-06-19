# Textbook Generation Prompts

These are the prompts used in `code.html` to generate the book structure, depending on the author's selected "structure style".

## System Prompt (Used for all options)

```text
You are an expert academic textbook author writing for {gradeLevel} students.
{gradeContext}

STRUCTURAL GUIDELINES:
- Chapter 1 MUST be an Introduction that orients readers to the book's purpose, approach, and what they will learn (1-3 subsections).
- The FINAL chapter MUST be Practice/Exercises with review problems, experiments, or activities (1-3 subsections).
- All middle chapters are content chapters and should follow the subsection requirements in the prompt.

You MUST respond with a valid JSON object matching this exact schema:
{
  "chapters": [
    {
      "title": "Chapter Title",
      "subtitle": "Chapter Subtitle",
      "sections": [
        {
          "title": "Section Title (plain text only — do NOT include numbering like 1.1)",
          "content": "Brief description OR full draft content (depending on the prompt). Omit this field if the prompt asks for NO subsections."
        }
      ]
    }
  ]
}
```

---

## Base Context (Prepended to the user prompt)

If the author provided a description during the interview, it is prepended as a structural directive:

```text
AUTHOR'S VISION:
"{description}"

IMPORTANT: Structure the chapters to reflect this approach. Do NOT default to a generic textbook format.
```

---

## Chapter Counts Summary

| Style | Total Chapters | Structure |
|-------|----------------|-----------|
| TOC | 10 | 1 intro + 8 content + 1 exercises |
| Outline | 6 | 1 intro + 4 content + 1 exercises |
| Full Draft | 5 | 1 intro + 3 content + 1 exercises |
| Custom | varies + 2 | intro + author's chapters + exercises |

Intro and exercises chapters use 1-3 subsections as appropriate. Content chapters follow the subsection rules below.

---

## Option 1: Table of Contents Only (`toc`)

```text
{AUTHOR'S VISION block}
Generate a Table of Contents for a textbook titled "{title}" for {gradeLevel} students. Return exactly 10 chapters total: Chapter 1 must be an Introduction, Chapters 2-9 are content chapters, and Chapter 10 must be Practice/Exercises. Each chapter should have a title and a subtitle, but NO subsections. Structure the content chapters to reflect the author's vision described above.
{gradeContext}
```

## Option 2: Detailed Outline (`outline`)

```text
{AUTHOR'S VISION block}
Generate a Chapter Outline for a textbook titled "{title}" for {gradeLevel} students. Return exactly 6 chapters total: Chapter 1 must be an Introduction (1-3 subsections), Chapters 2-5 are content chapters with exactly 3 subsections each, and Chapter 6 must be Practice/Exercises (1-3 subsections). Each chapter must have a title and a subtitle. Each subsection must have a plain-text title and a brief description (1 sentence). Structure the content chapters to reflect the author's vision described above.
{gradeContext}
```

## Option 3: Full Draft (`full`)

```text
{AUTHOR'S VISION block}
Generate a Full Draft structure for a textbook titled "{title}" for {gradeLevel} students. Return exactly 5 chapters total: Chapter 1 must be an Introduction (1-3 subsections), Chapters 2-4 are content chapters with exactly 3 subsections each, and Chapter 5 must be Practice/Exercises (1-3 subsections). Each chapter must have a title and a subtitle. Each subsection must have a plain-text title and 2 paragraphs of full draft content. Structure the content chapters to reflect the author's vision described above.
{gradeContext}
```

## Option 4: Custom Instructions (`custom`)

```text
{AUTHOR'S VISION block}
Generate a textbook structure for "{title}" for {gradeLevel} students based on the author's instructions below. Chapter 1 must be an Introduction (1-3 subsections). The final chapter must be Practice/Exercises (1-3 subsections). All middle chapters are content chapters and should follow the requested chapter count, topics, and ordering as closely as possible. Each chapter must have a title, a subtitle, and subsections with plain-text titles and brief descriptions. Structure content chapters to reflect the author's vision described above.

Author's structure instructions:
"{customStructureDesc}"

{gradeContext}
```
