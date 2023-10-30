<h1 align="center"> CI/CD Workflow </h1> <br>

## Description
<p>This repository contains the configuration for GitHub Actions CI/CD workflows. It automates the build, test, and deployment processes.</p>

## Workflow Overview

There are three workflows:

- CI.yml -
This workflow is triggered on every push to the dev branch. The workflow runs the test suite to ensure the code is functioning correctly. If the code passes all tests then a docker image is build with a proper image tag consisting of two tags which are 'latest' and of the format 'environment_name-commit_id' (ex: dev-dcd3a033) and then finally this image is pushed to the AWS ECR(Elastic Container Repository).

- CD.yml -
This file contains the workflow configuration for deployment.A manual action is required to trigger this workflow. We need to provide the 'Image_tag' input for its successful execution whose default value is 'latest'. Once this workflow is manually triggered by providing the input 'Image_tag' it is then deployed to the  AWS ECS(Elastic Container Service) for a specific environment.

- PR.yml -
This workflow is triggered on every pull requests to the dev branch. The workflow runs the test suite to ensure the code is functioning correctly.


## Usage

Provide instructions on how to use the CI/CD workflows. Include any prerequisites and setup steps. For example:

- Make sure you have access to the repository and appropriate permissions to trigger GitHub Actions workflows.

- Push changes to the main branch or create pull requests. The workflow will automatically start.

- A manual action is required to trigger the deployment workflow. We need to provide the 'Image_tag' input for its successful execution whose default value is 'latest'  


## workflow configuration

### CI.yml

This workflow is triggered on every push to the dev branch.

The various steps involved in this workflow are :
- Cache Maven dependencies -
Caching is a good fit for saving and reusing files that don’t change too often such as third-party dependencies. It cache your package manager dependencies in your GitHub Actions rather than download fresh packages for every workflow you run.

    ```hcl
    - name: Cache Maven dependencies
          uses: actions/cache@v2
          with:
            path: ~/.m2/repository  # Location where Maven stores its dependencies
            key: ${{ runner.os }}-maven-${{ hashFiles('**/*.xml') }}
            restore-keys: |
                ${{ runner.os }}-maven-    
    ```

- Install maven dependencies -
This steps basically install the dependencies and runs the test suite to ensure the code is functioning correctly.

- configure AWS Creds -
This step is for configuration of AWS which requires credentials like 'aws-access-key-id' and 'aws-secret-access-key' whose secret values are stored in the github repository secrets.

    ```hcl
    - name: Configure AWS Creds
          uses: aws-actions/configure-aws-credentials@v1
          with:
            aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
            aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
            aws-region: ${{ env.AWS_DEFAULT_REGION }}
    ```

- Login to Amazon ECR -
This step is to login into the AWS ECR so that the image can be pushed to the ECR repository.

- Build, tag, and push image to Amazon ECR -
This step builds a docker image with a proper image tag consisting of two tags which are 'latest' and of the format 'environment_name-commit_id' (ex: dev-dcd3a033) and then finally this image is pushed to the AWS ECR(Elastic Container Repository)

    ```hcl
    - name: Build, tag, and push image to Amazon ECR
          env:
            ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
            IMAGE_TAG: dev-$(echo ${{ github.sha }} | cut -c 1-8)
          run: |
            docker build -t $ECR_REGISTRY/${{ env.ECR_REPOSITORY }}:${{ env.IMAGE_TAG }} -t $ECR_REGISTRY/${{ 
            env.ECR_REPOSITORY }}:latest -f Dockerfile.ECS .
            # docker push $ECR_REGISTRY/${{ env.ECR_REPOSITORY }}:${{ env.IMAGE_TAG }}
            docker push --all-tags $ECR_REGISTRY/${{ env.ECR_REPOSITORY }}
            echo ${{ env.IMAGE_TAG }}
    ```


### CD.yml

This file contains the workflow configuration for deployment.A manual action is required to trigger this workflow.

```hcl
on:
  workflow_dispatch:
    inputs:
      Image_tag:
        description: 'Image_tag'
        required: true
        default: 'latest'
        type: string
```
We need to provide the 'Image_tag' input for its successful execution whose default value is 'latest'. Once this workflow is manually triggered by providing the input 'Image_tag' it is then deployed to the  AWS ECS(Elastic Container Service) for a specific environment.

In this we have provided different envs like 'CLUSTER_NAME' , 'TASKDEF_NAME' , 'SERVICE_NAME' , 'AWS_DEFAULT_REGION' , 'ECR_REPOSITORY' , 'CONTAINER_NAME' which are used for the deployment of the service in the ECS.

The various steps involved in this workflow are :

- configure AWS Creds -
This step is for configuration of AWS which requires credentials like 'aws-access-key-id' and 'aws-secret-access-key' whose secret values are stored in the github repository secrets.

- Login to Amazon ECR -
This step is to login into the AWS ECR so that the image can be pushed to the ECR repository.

- Download task definition -
This step basically downloads the task definition of the service so that we can update the revision number and image id for every new deployment of the service.

    ```hcl
    - name: Download task definition
        run: |
            aws ecs describe-task-definition --task-definition $TASKDEF_NAME > task-def.json
            jq .taskDefinition task-def.json > taskdefinition.json
            jq 'del(.taskDefinitionArn)' taskdefinition.json | jq 'del(.revision)' | jq 'del(.status)' | jq 'del(.requiresAttributes)' | jq 'del(.compatibilities)' | jq 'del(.registeredAt)'| jq 'del(.registeredBy)' > container-definition.json
    ```

- Fill in the new image ID in the Amazon ECS task definition -
This step involves an AWS action which updates the image id with the latest value provided by the input 'Image_tag'

    ```hcl
    - name: Fill in the new image ID in the Amazon ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: container-definition.json
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ env.image }}
    ```

- Deploy Amazon ECS task definition -
This step involves an AWS action which will deploy the service in the ECS using the envs values specified in the workflow.
Also this step makes sure that the workflow will get completed successfully only when the deployed service has reached a steady state and wait for the service stability for 5 minutes. If within 5 minutes the service has not reached the steady state then the workflow will get fail.

    ```hcl
    - name: Deploy Amazon ECS task definition
            uses: aws-actions/amazon-ecs-deploy-task-definition@v1
            with:
              task-definition: ${{ steps.task-def.outputs.task-definition }}
              service: ${{ env.SERVICE_NAME }}
              cluster: ${{ env.CLUSTER_NAME }}
              wait-for-service-stability: true
              wait-for-minutes: 5
    ```


### PR.yml

This workflow is triggered on every pull requests to the dev branch. The workflow runs the test suite to ensure the code is functioning correctly.

The workflow runs the test suite to ensure the code is functioning correctly and integrates it to the sonarqube which is a code quality assurance tool that performs in-depth code analysis and generates an analysis report to ensure code reliability

```hcl
- name: Install maven dependencies
      run: |  
          mvn clean install
          mvn wrapper:wrapper
    - name: Sonar Scan
      run: |
         sudo mvn clean org.sonarsource.scanner.maven:sonar-maven-plugin:3.9.0.2155:sonar -Dsonar.projectKey=presto-order-service -Dsonar.projectName=presto-order-service -Dsonar.sources=. -Dsonar.java.binaries=target/sonar/* -Dsonar.exclusions=src/test/**/*  -Dsonar.host.url=https://sonarscan.seguesolutions.org -Dsonar.login=.............................
```
