#!/usr/bin/env bash
set -euo pipefail

RG_NAME="ai-agent-demo-rg"

echo "⚠️ Deleting resource group: $RG_NAME"
az group delete -n "$RG_NAME" --yes --no-wait

echo "🧹 Delete started. Check status in Azure Portal."