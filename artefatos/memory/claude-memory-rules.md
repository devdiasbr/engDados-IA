# CLAUDE.md, Rules e Memory

## CLAUDE.md
- Arquivo Markdown usado para guardar instrucoes persistentes.
- Pode existir no projeto e no usuario.

## Rules
- Sao as regras escritas dentro do `CLAUDE.md`.
- Opcionalmente, podem ficar em `rules.md` e serem importadas no `CLAUDE.md`.
- Exemplos:
  - `spec first`
  - `nao assumir schema`
  - `sempre responder com plano de validacao e rollback`

## Memory
- E o mecanismo usado pelo Claude para carregar essas instrucoes.
- Opcionalmente, um `memory.md` do time pode ser importado no `CLAUDE.md` para centralizar decisoes recorrentes.
- Comando util: `/memory`
- Comando util para bootstrap do projeto: `/init`

## Regra pratica
- Use `./CLAUDE.md` para regras do repositorio.
- Use `~/.claude/CLAUDE.md` para preferencias pessoais.
- Mantenha o arquivo curto e acionavel.
