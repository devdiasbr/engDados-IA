# rules.md (convencao de time)

## Objetivo
Padronizar comportamento do Claude para engenharia de dados no Databricks.

## Regras de trabalho
- Spec first: nao implementar antes de confirmar objetivo, fonte, alvo e grain.
- Nao assumir schema sem validar.
- Sempre explicitar impacto downstream.
- Toda entrega precisa de plano de validacao e rollback.

## Regras de implementacao
- Preferir artefatos versionados em bundle.
- Usar Unity Catalog para nomes de objetos.
- Separar responsabilidades entre bronze, silver e gold.
- Evitar logica implicita em transformacoes SQL/PySpark.

## Regras de qualidade
- Incluir checks de nulidade e unicidade quando aplicavel.
- Definir regra de reconciliacao com a fonte.
- Declarar criterios de aceite objetivos.
