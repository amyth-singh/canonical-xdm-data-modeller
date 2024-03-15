# Define the variables
PROJECT_ID := xfuze-crew-dev
REGION := europe-west2
SUBNET := eu-xfuze-crew-dev-private
BUCKET := eu-xfuze-crew-dev-dataproc-batch-artifacts
GCLOUD_CONFIG := xiatech-crew 

set-gcloud-config:
	gcloud config configurations activate $(GCLOUD_CONFIG)

run-remote: set-gcloud-config
	gcloud dataproc batches submit pyspark \
	--project $(PROJECT_ID) --region $(REGION) \
	./src/depsCheck.py \
	--subnet=$(SUBNET) \
	--deps-bucket=$(BUCKET) \
	--version=2.1

run-local: set-gcloud-config
	docker run --rm \
	-v $(HOME)/.config/gcloud:/home/spark/.config/gcloud \
	-e GOOGLE_APPLICATION_CREDENTIALS=/home/spark/.config/gcloud/application_default_credentials.json \
	-v $(PWD)/src:/app \
	-w /app \
	dataproc_serverless_spark_runtime_2.1.27 python main.py

run-interactive:
	docker run -it --rm \
	-v $(HOME)/.config/gcloud:/home/spark/.config/gcloud \
	-e GOOGLE_APPLICATION_CREDENTIALS=/home/spark/.config/gcloud/application_default_credentials.json \
	-v $(PWD)/src:/app \
	-w /app \
	dataproc_serverless_spark_runtime_2.1.27 bash


build-image:
	docker build \
	--build-arg INCLUDE_SPARK_JRE_LOCAL=true \
	-t dataproc_serverless_spark_runtime_2.1.27 \
	-f ../../docker/sparkruntime2.1.27 \
	../../docker