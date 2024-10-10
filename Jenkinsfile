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
                    git url: 'https://github.com/devops051033/Jenkins-project-k8s.git', branch: 'main'
                    sh "ls -ltr"
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

        stage('Setup env in jenkins container') {    
            steps {
                sh '''#!/bin/bash
                python3 -m venv venv 
                source venv/bin/activate
                pip install -r requirements.txt
                ls -la $KUBECONFIG
                chmod 644 $KUBECONFIG
                ls -la $KUBECONFIG
                echo "Displaying the content of KUBECONFIG:"
                cat $KUBECONFIG  
                '''
            }
        }

        stage('Test') {
            steps {
                sh "bash -c 'source venv/bin/activate && pytest'" 
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
                script {
                    // Fetch the current Kubernetes context from the uploaded KUBECONFIG
                    def kubeContext = sh(
                        script: 'kubectl config current-context',
                        returnStdout: true
                    ).trim()

                    echo "Using Kubernetes context: ${kubeContext}"

                // Install gettext for envsubst command (if not already installed)
                //sh 'sudo apt-get update && apt-get install -y gettext'
                // Substitute the IMAGE_TAG variable and deploy the updated YAML
                sh '''
                envsubst < flask-app-deployment.yaml | kubectl apply -f -
                '''
                }
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