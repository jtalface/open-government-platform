#!/usr/bin/env bash
set -euo pipefail

REGION="af-south-1"
ASG_NAME="ogp-asg"
TARGET_GROUP_NAME="ogp-tg"
BRANCH="${1:-main}"

echo "Getting InService instances from ASG: ${ASG_NAME}"
INSTANCE_IDS=$(aws autoscaling describe-auto-scaling-groups \
  --region "${REGION}" \
  --auto-scaling-group-names "${ASG_NAME}" \
  --query "AutoScalingGroups[0].Instances[?LifecycleState=='InService'].InstanceId" \
  --output text)

if [[ -z "${INSTANCE_IDS}" ]]; then
  echo "No InService instances found in ASG ${ASG_NAME}"
  exit 1
fi

echo "Deploying branch '${BRANCH}' to: ${INSTANCE_IDS}"

COMMAND_ID=$(aws ssm send-command \
  --region "${REGION}" \
  --instance-ids ${INSTANCE_IDS} \
  --document-name "AWS-RunShellScript" \
  --comment "OGP app-only deploy (${BRANCH})" \
  --parameters "commands=[
    \"set -eu\",
    \"export HOME=/root PM2_HOME=/root/.pm2 NODE_ENV=production PORT=4000\",
    \"cd /opt/ogp/app\",
    \"git fetch --all\",
    \"git checkout ${BRANCH}\",
    \"git reset --hard origin/${BRANCH}\",
    \"bash scripts/apply-ssm-env-to-web.sh\",
    \"pnpm install --frozen-lockfile=false\",
    \"pnpm db:generate\",
    \"pnpm --filter @ogp/web build\",
    \"cd /opt/ogp/app/apps/web\",
    \"pm2 restart ogp-web --update-env || pm2 start pnpm --name ogp-web -- start\",
    \"pm2 save\",
    \"curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4000/\"
  ]" \
  --query "Command.CommandId" \
  --output text)

echo "SSM Command ID: ${COMMAND_ID}"
echo "Checking command status..."
aws ssm list-command-invocations \
  --region "${REGION}" \
  --command-id "${COMMAND_ID}" \
  --details \
  --query "CommandInvocations[].{Instance:InstanceId,Status:Status}" \
  --output table

TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
  --region "${REGION}" \
  --names "${TARGET_GROUP_NAME}" \
  --query "TargetGroups[0].TargetGroupArn" \
  --output text)

echo "Target health:"
aws elbv2 describe-target-health \
  --region "${REGION}" \
  --target-group-arn "${TARGET_GROUP_ARN}" \
  --query "TargetHealthDescriptions[].{Id:Target.Id,State:TargetHealth.State,Reason:TargetHealth.Reason}" \
  --output table

