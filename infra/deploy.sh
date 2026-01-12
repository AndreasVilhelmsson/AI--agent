#!/usr/bin/env bash
set -e

RG="ai-agent-rg"
LOCATION="westeurope"

APP_NAME="ai-agent-api-$RANDOM"
PLAN_NAME="ai-agent-plan"
PLAN_SKU="B1"

OPENAI_API_KEY="sk-xxxx"
OPENAI_MODEL="gpt-4o-mini"
PORT=5168

echo "== Create Resource Group =="
az group create \
  --name $RG \
  --location $LOCATION

echo "== Deploy Bicep =="
az deployment group create \
  --resource-group $RG \
  --template-file infra/main.bicep \
  --parameters \
    appName="$APP_NAME" \
    location="$LOCATION" \
    planName="$PLAN_NAME" \
    planSkuName="$PLAN_SKU" \
    openAiApiKey="$OPENAI_API_KEY" \
    openAiModel="$OPENAI_MODEL" \
    port="$PORT"

echo "== Done =="