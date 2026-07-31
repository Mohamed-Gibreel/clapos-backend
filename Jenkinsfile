pipeline {
  agent { label 'docker-agent' }
  environment {
    REGISTRY = "PLACEHOLDER_REGISTRY_URL"
    IMAGE_TAG = "PLACEHOLDER_IMAGE_NAME"
  }
  triggers {
    GenericTrigger(
     genericVariables: [
     [key: 'ref', value: '$.ref'],
      [key: 'deleted', value: '$.deleted']
     ],

     causeString: 'Triggered on $ref',

     token: 'abc123',
     tokenCredentialId: '',

     printContributedVariables: true,
     printPostContent: true,

     silentResponse: false,
     
     shouldNotFlatten: false,

     regexpFilterText: '$ref',
     regexpFilterExpression: 'refs/heads/' + BRANCH_NAME
    )
  }
  stages {

    stage('Check for branch deletion') {
      steps {
        script {
          if (params.deleted?.toBoolean()) {
            echo "Branch was deleted — skipping build."
            currentBuild.result = 'ABORTED'
            env.SKIP_BUILD = 'true'
            return
          }
        }
      }
    }

    stage('Check for Changes') {
      steps {
        script {
          // Get the current commit hash
          def currentCommit = sh(script: "git rev-parse HEAD", returnStdout: true).trim()

          // Get the last successful build
          def lastBuild = currentBuild.previousSuccessfulBuild
          def lastCommit = null

          if (lastBuild?.description) {
            def matcher = (lastBuild.description =~ /LastCommit: ([a-f0-9]+)/)
            if (matcher) {
             lastCommit = matcher[0][1]
            }
          }

          // Compare commit hashes
          if (lastCommit && lastCommit == currentCommit) {
            echo "No changes since last successful build. Aborting..."
            currentBuild.result = 'ABORTED'
            env.SKIP_BUILD = 'true'
            return
          }

          // Save the commit hash into the build description
          currentBuild.description = "LastCommit: ${currentCommit}"
        }
      }
    }

    stage('Set Image Tag') {
      when {
        expression { env.SKIP_BUILD != 'true' } 
      }
      steps {
        script {
          def branchName = env.BRANCH_NAME
          def postfix = ""

          if (branchName == "dev") {
              postfix = "dev"
          } else if (branchName.startsWith("release/")) {
              postfix = "uat"
          } else if (branchName == "master") {
              postfix = ""
          } else {
              postfix = branchName.replaceAll('/', '-')
          }

          env.IMAGE_POSTFIX = postfix  // update env for future stages
          echo "Branch: ${branchName} → Image tag: ${postfix} Image Postfix: ${env.IMAGE_POSTFIX}" 
        }
      }
    }

    stage('Checkout with Tags') {
      when {
        expression { env.SKIP_BUILD != 'true' } 
      }
      steps {
        script {
          checkout([
            $class: 'GitSCM',
            branches: [[name: "*/${env.BRANCH_NAME}"]],
            userRemoteConfigs: [[
              url: 'PLACEHOLDER_REPO_URL',
              credentialsId: 'PLACEHOLDER_CREDENTIALS_ID'
            ]],
            extensions: [
              [$class: 'CloneOption', shallow: false, noTags: false, depth: 0]
            ]
          ])
        }
      }
    }

    stage('Build docker image') {
      when {
        expression { env.SKIP_BUILD != 'true' } 
      }
      steps {
        script {
          echo "Image Postfix: ${env.IMAGE_POSTFIX}" 
          def gitVersion = sh(script: 'git describe --tags --always', returnStdout: true).trim()

          // Build the full tag with optional postfix
          def versionTag = env.IMAGE_POSTFIX ? "${gitVersion}-${env.IMAGE_POSTFIX}" : "${gitVersion}"
          def latestTag = env.IMAGE_POSTFIX ? "latest-${env.IMAGE_POSTFIX}" : "latest"

          // Main app image
          sh """
              docker build -t ${REGISTRY}/${env.IMAGE_TAG}:${versionTag} -t ${REGISTRY}/${env.IMAGE_TAG}:${latestTag} -f Dockerfile.app .
              docker push ${REGISTRY}/${env.IMAGE_TAG}:${versionTag}
              docker push ${REGISTRY}/${env.IMAGE_TAG}:${latestTag}
          """

          // Migration image (optional)
          sh """
              docker build --target migration -t ${REGISTRY}/${env.IMAGE_TAG}-migration:${latestTag} -t ${REGISTRY}/${env.IMAGE_TAG}-migration:${versionTag} -f Dockerfile.migration .
              docker push ${REGISTRY}/${env.IMAGE_TAG}-migration:${latestTag}
              docker push ${REGISTRY}/${env.IMAGE_TAG}-migration:${versionTag}
          """
        }
      }
    }
  }
}
