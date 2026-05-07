"""
pipeline/bronze/pipeline.py
Lakeflow Declarative Pipeline — camada Bronze

Lê raw.commerce_events, parseia payload JSON por _entity,
deduplica por event_id via APPLY CHANGES, envia rejeições para quarentena.

Configuração via pipeline config (databricks.yml):
  pipeline.catalog     — Unity Catalog catalog (default: main)
  pipeline.raw_schema  — schema da camada raw (default: raw)
"""
import dlt
from pyspark.sql import functions as F
from pyspark.sql.types import (
    DecimalType,
    IntegerType,
    StringType,
    StructField,
    StructType,
)

# Schema do payload JSON — colunas possíveis para todas as entidades
PAYLOAD_SCHEMA = StructType([
    StructField("order_id", StringType()),
    StructField("order_item_id", StringType()),
    StructField("customer_id", StringType()),
    StructField("product_id", StringType()),
    StructField("payment_id", StringType()),
    StructField("currency", StringType()),
    StructField("total_amount", DecimalType(18, 2)),
    StructField("quantity", IntegerType()),
    StructField("unit_price", DecimalType(18, 2)),
    StructField("line_total", DecimalType(18, 2)),
    StructField("amount", DecimalType(18, 2)),
    StructField("method", StringType()),
    StructField("status", StringType()),
])

# Condição SQL que define um registro válido
VALID_CONDITION = (
    "event_id IS NOT NULL"
    " AND received_at IS NOT NULL"
    " AND _entity IN ('orders', 'order_items', 'payments')"
    " AND event_type IN ("
    "  'order.created', 'order.paid', 'order.shipped', 'order.delivered',"
    "  'order.cancelled', 'order.refunded', 'order_item.created', 'payment.captured'"
    ")"
)


def _parse_payload(df):
    """Expande o campo payload (string JSON) em colunas tipadas."""
    p = F.from_json(F.col("payload"), PAYLOAD_SCHEMA)
    return (
        df
        .withColumn("_p", p)
        .withColumn("order_id",      F.col("_p.order_id"))
        .withColumn("order_item_id", F.col("_p.order_item_id"))
        .withColumn("customer_id",   F.col("_p.customer_id"))
        .withColumn("product_id",    F.col("_p.product_id"))
        .withColumn("payment_id",    F.col("_p.payment_id"))
        .withColumn("currency",      F.col("_p.currency"))
        .withColumn("total_amount",  F.col("_p.total_amount"))
        .withColumn("quantity",      F.col("_p.quantity"))
        .withColumn("unit_price",    F.col("_p.unit_price"))
        .withColumn("line_total",    F.col("_p.line_total"))
        .withColumn("amount",        F.col("_p.amount"))
        .withColumn("method",        F.col("_p.method"))
        .withColumn("status",        F.col("_p.status"))
        .withColumn("_raw_payload",  F.col("payload"))
        .withColumn("event_date",    F.to_date("received_at"))
        .drop("_p", "payload")
    )


@dlt.view(name="raw_events_parsed")
def raw_events_parsed():
    """Lê raw.commerce_events de fora desta pipeline e parseia o payload."""
    catalog = spark.conf.get("pipeline.catalog", "main")
    raw_schema = spark.conf.get("pipeline.raw_schema", "raw")
    raw = spark.readStream.format("delta").table(
        f"{catalog}.{raw_schema}.commerce_events"
    )
    return _parse_payload(raw)


@dlt.view(name="events_valid")
def events_valid():
    """Registros que passam todas as DQ rules."""
    return dlt.read_stream("raw_events_parsed").filter(VALID_CONDITION)


@dlt.table(
    name="commerce_events_quarantine",
    comment="Registros rejeitados por falha de DQ — preservados para auditoria",
)
def quarantine():
    """Registros que falham em qualquer DQ rule."""
    return dlt.read_stream("raw_events_parsed").filter(f"NOT ({VALID_CONDITION})")


# Target da deduplicação — criado via apply_changes (não usa @dlt.table)
dlt.create_streaming_table(
    name="commerce_events",
    comment="Eventos de comércio estruturados e deduplicados — 1 linha por event_id",
    partition_cols=["event_date", "_entity"],
)

# MERGE por event_id, mantendo o registro com maior received_at
dlt.apply_changes(
    target="commerce_events",
    source="events_valid",
    keys=["event_id"],
    sequence_by=F.col("received_at"),
    stored_as_scd_type=1,  # SCD Tipo 1 = sobrescreve versão anterior
)
