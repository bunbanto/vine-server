# API Docs (Redocly + OpenAPI)

## Files

- `docs/openapi.yaml` - OpenAPI (Swagger) specification
- `redocly.yaml` - Redocly config
- `docs/index.html` - generated static docs (created by build command)

## Commands

- `npm run docs:lint` - validate OpenAPI spec
- `npm run docs:preview` - run local preview at `http://localhost:8081`
- `npm run docs:build` - generate static documentation file `docs/index.html`
