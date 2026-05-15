# Kindred Skills

A collection of Claude Code skills for accelerating development workflows. Each skill is a self-contained directory with SKILL.md, templates, references, and test cases.

## Skills

| Skill | Description |
|-------|-------------|
| [tailwind-saas-patterns](./tailwind-saas-patterns) | Tailwind CSS styling patterns & project scaffolding for SaaS projects |

## Structure

Each skill follows this convention:

```
skill-name/
├── SKILL.md            # Main instructions — two modes: scaffold & reference
├── templates/          # File templates for scaffolding
│   ├── theme.css
│   ├── globals.css
│   ├── tailwind.config.ts
│   ├── lib/
│   └── blocks/         # Demo component templates
├── references/         # Reference docs for query mode
│   ├── topic-one.md
│   └── topic-two.md
└── evals/              # Test cases for validation
    └── evals.json
```

## How to Use

Skills are loaded by Claude Code when the conversation topic matches their description. To install:

```bash
# Add to ~/.claude/settings.json skills list, or
claude-code-skills add /path/to/skill-name
```

## Adding a New Skill

1. Create a new directory: `mkdir skill-name`
2. Write `skill-name/SKILL.md` with name & description in frontmatter
3. Add templates, references, evals as needed
4. Update this README's table

## Author

Created by [Kindred Wu](https://github.com/kindredwu)
