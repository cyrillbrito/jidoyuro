
# jidoyuro

1. Install gcloud cli

   https://cloud.google.com/sdk/gcloud/

2) Deploy

gcloud functions deploy ynab --source=gcf-ynab --trigger-http --runtime=nodejs10 --memory=1024mb

## Inital setup

https://firebase.google.com/docs/functions/get-started


## Running locally

Run time config is not working
firebase functions:config:get > .runtimeconfig.json

