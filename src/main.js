const core = require('@actions/core')
const { createVersion } = require('./create-version')
const { upload } = require('./upload-releases')
const fs = require('fs')
const path = require('path')
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const tftoken = process.env.TFTOKEN // Set Terraform API token
    const ghtoken = process.env.GHTOKEN // Set GitHub API token
    const orgName = core.getInput('orgName', { required: true })
    const providerName = core.getInput('providerName', { required: true })
    // const githubRepo = core.getInput('githubRepo', { required: true })

    const version = core.getInput('version', { required: true })
    const keyid = core.getInput('keyid', { required: true })

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Version = ${version}`)
    core.debug(`Key id = ${keyid}`)

    // Current directory
    const directoryPath = path.join(__dirname)
    // List all files in the directory
    const files = fs.readdirSync(directoryPath)
    // Print all files
    files.forEach(function (file) {
      core.debug(file)      
    })



    // Log the current timestamp, wait, then log the new timestamp
    // core.debug("Started creating a version")
    // await createVersion(version, keyid, githubRepo, orgName, providerName, tftoken, ghtoken)
    // core.debug("Ended creating a version")
    // core.debug("Started uploading releases")
    // await upload(version, tftoken, ghtoken)
    // core.debug("Ended uploading releases")

    // Set outputs for other workflow steps to use
    core.setOutput('version', version)
    core.setOutput('files', files)
    core.setOutput('pwd', __dirname)
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
