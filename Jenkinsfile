pipeline {
    agent any

    environment {
        IMAGE_NAME = 'samdocker33/kk-flask-app'
        KUBECONFIG = credentials('kubeconfig-cred-id')
        AWS_CREDENTIALS = credentials('tuhin-aws-access-key-secret')
    }

    options { skipDefaultCheckout() }

    stages {
        stage('Checkout') {
            steps {
                    git url: 'https://github.com/devops051033/jenkins-project.git', branch: 'appCodeDocarize'
                    sh "ls -ltr"
                    echo "The current commit hash is: ${env.GIT_COMMIT}"

                    // Manually retrieve the commit hash
                script {
                    def gitCommit = sh(script: "git rev-parse HEAD", returnStdout: true).trim()
                    echo "The current commit hash is: ${gitCommit}"

                    // Set IMAGE_TAG dynamically based on the commit hash
                    def imageTag = "${IMAGE_NAME}:${gitCommit}"
                    echo "The image tag is: ${imageTag}"

                    // Use the imageTag variable in subsequent stages
                    env.IMAGE_TAG = imageTag
                }
            }
        }

        stage('Setup') {    
            steps {
                sh '''#!/bin/bash
                python3 -m venv venv  # Create virtual environment
                source venv/bin/activate
                pip install -r requirements.txt  # Install dependencies
                ls -la $KUBECONFIG
                chmod 644 $KUBECONFIG
                ls -la $KUBECONFIG
                '''
            }
        }
    


        stage('Test') {
            steps {
                sh "bash -c 'source venv/bin/activate && pytest'" // Activate and run tests
                sh "whoami"
            }
        }

        stage('Login to docker hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-cred',
                usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]) {
                    sh 'echo ${PASSWORD} | docker login -u ${USERNAME} --password-stdin'
                    }
                echo 'Login successfully'
            }
        }

        stage('Build Docker Image'){
            steps
            {
                sh 'docker build -t ${IMAGE_TAG} .'
                echo "Docker image build successfully"
                sh 'docker image ls'
                
            }
        }

        stage('Push Docker Image'){
            steps
            {
                sh 'docker push ${IMAGE_TAG}'
                echo "Docker image push successfully"
            }
        }

        stage('Deploy to Staging'){
            steps {
                sh 'kubectl config use-context mamun@stgc.us-east-1.eksctl.io'
                sh 'kubectl config current-context'
                sh "kubectl set image deployment/flask-app flask-app=${IMAGE_TAG}"
            }
        }

        stage('Acceptance Test'){
            steps {

                script {

                    def service = sh(script: "kubectl get svc flask-app-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}:{.spec.ports[0].port}'", returnStdout: true).trim()
                    echo "${service}"

                    sh "k6 run -e SERVICE=${service} acceptance-test.js"
                }
            }
        }
            
    }
}