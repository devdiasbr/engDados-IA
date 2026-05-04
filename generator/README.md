# faker-lakehouse

Gerador de dados de e-commerce (dimensões + stream de eventos) para servir como
fonte concreta dos pipelines de exemplo do repositório.

## Instalação

cd generator
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -e ".[dev]"

## Uso

faker-lakehouse seed                                    # popula data/seed/
faker-lakehouse run --start 2026-04-01 --days 7         # 7 dias de eventos

Veja `faker-lakehouse --help` para todas as opções.
