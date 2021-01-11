
# jidoyuro

1. Install gcloud cli

   https://cloud.google.com/sdk/gcloud/

2) Deploy

gcloud functions deploy ynab --source=gcf-ynab --trigger-http --runtime=nodejs10 --memory=1024mb

## Inital setup

https://firebase.google.com/docs/functions/get-started


## Running locally

firebase functions:config:get | ac .runtimeconfig.json



## Using Google Cloud Run

The new ynab imported will use cloud run. For this the code will actually be dockerized.

https://nielskersic.medium.com/automatic-monitoring-application-with-nodejs-playwright-and-google-sheets-a62875b1ce98

### Locally

Create a copy of the enviroment/sample with the name local.json and fill the configs

run $ npm start
