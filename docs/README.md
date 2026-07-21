# AntCoder Documentation

Built with [Mintlify](https://mintlify.com).

## Development

```bash
# Install Mintlify CLI
npm i -g mintlify

# Run locally
mint dev

# View at http://localhost:3000
```

## Structure

```
docs/
├── docs.json          # Mintlify config
├── introduction.mdx
├── getting-started.mdx
├── installation.mdx
├── quickstart.mdx
├── configuration.mdx
├── concepts/
│   ├── local-llm.mdx
│   ├── leader-workers.mdx
│   ├── models.mdx
│   └── privacy.mdx
├── cli/
│   ├── overview.mdx
│   ├── commands.mdx
│   ├── options.mdx
│   └── config.mdx
├── desktop/
│   ├── overview.mdx
│   └── installation.mdx
├── models/
│   └── overview.mdx
├── api-reference/
│   ├── introduction.mdx
│   ├── provider.mdx
│   ├── llama-server.mdx
│   └── models.mdx
├── logo/
│   ├── antcoder-light.svg
│   └── antcoder-dark.svg
└── favicon.svg
```

## Deployment

1. Connect GitHub repo to Mintlify dashboard
2. Push to main branch
3. Auto-deploys to `antcoder.mintlify.app`

## Custom Domain

Configure in Mintlify dashboard: `docs.antcoder.ai`