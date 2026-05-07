# faker-lakehouse

Gerador de dados de e-commerce (dimensões + stream de eventos) para servir como
fonte concreta dos pipelines de exemplo do repositório.

## Instalação

```cmd
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
pip install .
```

## Uso

Configure `lakehouse.yaml` na raiz do projeto e rode:

```cmd
faker-lakehouse seed   # popula data/seed/ com dimensões
faker-lakehouse run    # gera eventos conforme lakehouse.yaml
```

Override pontual:

```cmd
faker-lakehouse run --start 2026-04-01 --days 7 --orders-per-day 100
```

Veja `faker-lakehouse --help` para todas as opções.
