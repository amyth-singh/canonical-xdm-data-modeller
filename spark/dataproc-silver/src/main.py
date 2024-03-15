from pyspark.sql import SparkSession
from pyspark.sql.functions import col
import json
import os

def read_last_timestamp(local_state_path):
    """
    Read the last processed timestamp from a local file.
    """
    if not os.path.exists(local_state_path):
        # Explicitly handle the scenario where the state file does not exist
        return "no_file"

    try:
        with open(local_state_path, 'r') as file:
            last_timestamp = json.load(file)
        return last_timestamp.get('last_processed_timestamp', None)
    except Exception as e:
        # Handle other exceptions here, if needed
        return None

def write_last_timestamp(local_state_path, timestamp):
    """
    Write the last processed timestamp to a local file.
    """
    with open(local_state_path, 'w') as file:
        json.dump({"last_processed_timestamp": timestamp}, file)

def ingest_data_to_delta_table(bigquery_table, timestamp_field, local_delta_path, delta_table_name, local_state_path):

    # Initialize Spark Session with Delta support
    spark = SparkSession.builder \
        .appName("BigQuery to Delta Table Ingestion") \
        .config("spark.jars.packages", "io.delta:delta-core_2.13:2.4.0") \
        .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
        .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
        .getOrCreate()
    
    spark.conf.set("viewsEnabled","true")
    spark.conf.set("materializationDataset","r247_trigger_events")

    # Read last processed timestamp from local file
    last_timestamp = read_last_timestamp(local_state_path)

    query = f"SELECT * FROM `{bigquery_table}` LIMIT 10"

    # # Construct the SQL query
    # if last_timestamp == "no_file":
    #     # Handle the initial run when state file does not exist
    #     # You can set a very early date or handle differently as needed
    #     initial_timestamp = "1970-01-01T00:00:00Z"  # adjust as needed
    #     query = f"SELECT * FROM `{bigquery_table}` WHERE `{timestamp_field}` >= '{initial_timestamp}'"
    # elif last_timestamp:
    #     query = f"SELECT * FROM `{bigquery_table}` WHERE `{timestamp_field}` >= '{last_timestamp}'"
    # else:
    #     # Handle scenarios where the timestamp couldn't be read
    #     raise Exception("Unable to read the last processed timestamp")


    # Read data from BigQuery using the query
    df = spark.read \
        .format("bigquery") \
        .option("parentProject", "xfuze-crew-dev") \
        .option("query", query) \
        .load()
    
    # Sample a small portion of the data to infer schema
    sample_json = df.select("DomainEvent").limit(100).rdd.map(lambda x: x.DomainEvent).collect()
    
    # Infer schema from the sampled data
    sample_schema_rdd = spark.sparkContext.parallelize(sample_json)
    sample_schema_df = spark.read \
                      .option("inferTimestamp", "true") \
                      .option("timestampFormat", "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'") \
                      .json(sample_schema_rdd)

    sample_schema_df.printSchema()

    # # Parse the entire column using the inferred schema
    # df = df.withColumn("parsedDomainEvent", from_json(col("DomainEvent"), inferred_schema))
    
    # # Show result
    # sample_schema_df.show()

    # # Write to Delta Table in local storage
    # df.write.format("delta").mode("append").save(f"file:///{local_delta_path}/{delta_table_name}")

    # # Update last processed timestamp in local file
    # latest_timestamp = df.agg({timestamp_field: "max"}).collect()[0][0]
    # write_last_timestamp(local_state_path, latest_timestamp)

# Example usage
local_state_path = "/app/state.json"
local_delta_path = "/app/delta"

ingest_data_to_delta_table(
    bigquery_table="xfuze-crew-dev.r247_trigger_events.product_xdm_entity_latest",
    timestamp_field="AnalyticsIngestTimestampUTC",
    local_delta_path=local_delta_path,
    delta_table_name="product_delta_latest",
    local_state_path=local_state_path
)
