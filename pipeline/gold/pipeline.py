"""
pipeline/gold/pipeline.py
Lakeflow Declarative Pipeline — camada Gold

Lê silver.orders e agrega por (customer_id, currency, summary_date)
para consumo por dashboards e APIs.

Configuração via pipeline config (databricks.yml):
  pipeline.catalog        — Unity Catalog catalog (default: main)
  pipeline.silver_schema  — schema da camada silver (default: silver)
"""
import dlt
from pyspark.sql import functions as F


@dlt.table(
    name="orders_summary",
    comment="Resumo de pedidos pagos por cliente, moeda e data",
    partition_cols=["summary_date"],
)
def gold_orders_summary():
    catalog = spark.conf.get("pipeline.catalog", "main")
    silver_schema = spark.conf.get("pipeline.silver_schema", "silver")
    silver = spark.read.table(f"{catalog}.{silver_schema}.orders")

    return (
        silver
        .filter(F.col("status").isin("paid", "shipped", "delivered"))
        .withColumn("summary_date", F.to_date("paid_at"))
        .filter(F.col("summary_date").isNotNull())
        .groupBy("customer_id", "currency", "summary_date")
        .agg(
            F.countDistinct("order_id").alias("total_orders"),
            F.sum("total_amount").alias("total_revenue"),
            (F.sum("total_amount") / F.countDistinct("order_id"))
                .cast("decimal(18,2)")
                .alias("avg_order_value"),
            F.current_timestamp().alias("_updated_at"),
        )
    )
