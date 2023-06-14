pipeline {
 agent any
 environment {
 AWS_ACCOUNT_ID="192182953222"
 AWS_DEFAULT_REGION="us-east-1" 
 IMAGE_REPO_NAME="jenkins-pipeline-build-demo"
 IMAGE_TAG="latest"
 REPOSITORY_URI = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${IMAGE_REPO_NAME}"
 CLUSTER_NAME = "ecs-cluster"
 TASKDEF_NAME = "ecs_terraform_task_def"
 SERVICE_NAME = "ecs_terraform_service"
 }
 
 stages {
 
 stage('Logging into AWS ECR') {
 steps {
 script {
 sh "aws ecr get-login-password --region ${AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com"
 }
 
 }
 }
 
 stage('Cloning Git') {
 steps {
//  checkout([$class: 'GitSCM', branches: [[name: '*/master']], doGenerateSubmoduleConfigurations: false, extensions: [], submoduleCfg: [], userRemoteConfigs: [[credentialsId: '', url: 'https://github.com/sd031/aws_codebuild_codedeploy_nodeJs_demo.git']]])
checkout scmGit(branches: [[name: '*/main']], extensions: [], userRemoteConfigs: [[url: 'https://github.com/sahilj713/react-portfolio.git']])
 }
 }
 
 // Building Docker images
 stage('Building image') {
 steps{
 script {
 dockerImage = docker.build "${IMAGE_REPO_NAME}:${IMAGE_TAG}"
 }
 }
 }
 
 // Uploading Docker images into AWS ECR
 stage('Pushing to ECR') {
 steps{ 
 script {
 sh "docker tag ${IMAGE_REPO_NAME}:${IMAGE_TAG} ${REPOSITORY_URI}:$IMAGE_TAG"
 sh "docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${IMAGE_REPO_NAME}:${IMAGE_TAG}"
 }
 }
 }
  
  stage('deploy to ecs') {
  steps{
  script {
//   sh "sudo apt-get install jq -y"
//   sh "jq --version"
  sh "aws ecs describe-task-definition --task-definition ${ TASKDEF_NAME } > task-def.json"
  sh "jq .taskDefinition task-def.json > taskdefinition.json"
  sh "jq 'del(.taskDefinitionArn)' taskdefinition.json | jq 'del(.revision)' | jq 'del(.status)' | jq 'del(.requiresAttributes)' | jq 'del(.compatibilities)' | jq 'del(.registeredAt)'| jq 'del(.registeredBy)' > container-definition.json"
  sh "aws ecs register-task-definition --cli-input-json file://container-definition.json"  
  sh "aws ecs update-service --cluster  ${ CLUSTER_NAME } --service  ${ SERVICE_NAME } --task-definition  ${ TASKDEF_NAME }"
    }
   }
  } 
 }
}
