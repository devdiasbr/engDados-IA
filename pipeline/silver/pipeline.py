"""
pipeline/silver/pipeline.py
Lakeflow Declarative Pipeline — camada Silver

Lê bronze.commerce_events, consolida 1 linha por order_id com
último estado válido, agrega itens e deriva paid_at/last_event_at.

Configuração via pipeline config (databricks.yml):
  pipeline.catalog       — Unity Catalog catalog (default: main)
  pipeline.bronze_schema — schema da camada bronze (default: bronze)
"""
import dlt
from pyspark.sql import functions as F
from pyspark.sql.window import Window

# Status finais aceitos na silver (exclui 'created' puro e 'cancelled')
VALID_FINAL_STATUSES = ["paid", "shipped", "delivered", "refunded"]


@dlt.table(
    name="orders",
    comment="Pedidos consolidados — 1 linha por order_id, último estado válido",
)
def silver_orders():
    catalog = spark.conf.get("pipeline.catalog", "main")
    bronze_schema = spark.conf.get("pipeline.bronze_schema", "bronze")
    bronze = spark.read.table(f"{catalog}.{bronze_schema}.commerce_events")

    orders = bronze.filter(F.col("_entity") == "orders")
    items  = bronze.filter(F.col("_entity") == "order_items")

    # Janela para pegar o evento mais recente por order_id
    w_last = Window.partitionBy("order_id").orderBy(F.desc("received_at"))

    # Estado mais recente por order_id (filtra apenas status finais válidos)
    last_event = (
        orders
        .withColumn("rn", F.row_number().over(w_last))
        .filter(F.col("rn") == 1)
        .filter(F.col("status").isin(VALID_FINAL_STATUSES))
        .drop("rn")
        .withColumnRenamed("received_at", "last_event_at")
        .withColumnRenamed("occurred_at", "created_at")
    )

    # paid_at = occurred_at do primeiro evento order.paid
    w_paid = Window.partitionBy("order_id").orderBy("occurred_at")
    paid_at = (
        orders
        .filter(F.col("event_type") == "order.paid")
        .withColumn("rn", F.row_number().over(w_paid))
        .filter(F.col("rn") == 1)
        .select(
            F.col("order_id"),
            F.col("occurred_at").alias("paid_at"),
        )
    )

    # Agregação de itens por order_id
    items_agg = (
        items
        .groupBy("order_id")
        .agg(
            F.sum("quantity").alias("total_items_qty"),
            F.sum("line_total").alias("total_items_amount"),
        )
    )

    return (
        last_event
        .join(paid_at,   "order_id", "left")
        .join(items_agg, "order_id", "left")
        .withColumn("_updated_at", F.current_timestamp())
    )
