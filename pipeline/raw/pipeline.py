"""
pipeline/raw/pipeline.py
Lakeflow Declarative Pipeline — camada Raw

Lê eventos JSONL da landing zone via Auto Loader e publica
raw.commerce_events como streaming table append-only.

Configuração via pipeline config (databricks.yml):
  pipeline.landing_path    — caminho dos arquivos JSONL (default: data/landing)
  pipeline.schema_location — onde o Auto Loader persiste o schema inferido
"""
import dlt
from pyspark.sql import functions as F


@dlt.table(
    name="commerce_events",
    comment="Eventos brutos da landing zone — append-only, sem transformação",
    partition_cols=["_partition_date", "_entity"],
)
@dlt.expect("event_id not null", "event_id IS NOT NULL")
@dlt.expect("received_at not null", "received_at IS NOT NULL")
def raw_commerce_events():
    landing_path = spark.conf.get("pipeline.landing_path", "data/landing")
    schema_location = spark.conf.get(
        "pipeline.schema_location", "/tmp/schema/raw_commerce"
    )

    return (
        spark.readStream.format("cloudFiles")
            .option("cloudFiles.format", "json")
            .option("cloudFiles.schemaLocation", schema_location)
            .option("cloudFiles.inferColumnTypes", "true")
            .load(f"{landing_path}/*/*/*.jsonl")
            .withColumn(
                "_entity",
                F.regexp_extract(F.input_file_name(), r"/landing/(\w+)/", 1),
            )
            .withColumn("_ingested_at", F.current_timestamp())
            .withColumn("_partition_date", F.to_date("received_at"))
            .withColumn("_source_file", F.input_file_name())
    )
