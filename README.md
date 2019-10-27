# jidoyuro

1. Install gcloud cli

   https://cloud.google.com/sdk/gcloud/

2) Deploy

gcloud functions deploy ynab --source=gcf-ynab --trigger-http --runtime=nodejs10 --memory=1024mb
