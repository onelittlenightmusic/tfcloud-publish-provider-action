const axios = require('axios')
const fs = require('fs')
const FormData = require('form-data')
const { env } = require('process')

// Function to write version.json
function writeVersionJson() {
  const versionData = {
    data: {
      type: 'registry-provider-versions',
      attributes: {
        version: version,
        'key-id': '3576820E3EEA5A1C',
        protocols: ['5.0']
      }
    }
  }

  fs.writeFileSync('version.json', JSON.stringify(versionData))
}

// Function to make a POST request
async function postVersion() {
  try {
    const url = `https://app.terraform.io/api/v2/organizations/${ORG_NAME}/registry-providers/private/${ORG_NAME}/${providerName}/versions`
    const headers = {
      Authorization: `Bearer ${TFTOKEN}`,
      'Content-Type': 'application/vnd.api+json'
    }

    const data = fs.readFileSync('version.json')
    const response = await axios.post(url, data, { headers })
    fs.writeFileSync('version.out', JSON.stringify(response.data))
    return response.data
  } catch (error) {
    console.error('Error in POST request:', error)
    process.exit(1)
  }
}

// Function to download files from GitHub
async function downloadFile(repo, fileName) {
  const downloadUrl = `https://api.github.com/repos/${repo}/releases/latest/assets`
  const headers = {
    Authorization: `token ${GHTOKEN}`,
    Accept: 'application/octet-stream'
  }

  try {
    const response = await axios.get(downloadUrl, { headers })
    for (const asset of response.data) {
      if (asset.name === fileName) {
        const downloadResponse = await axios.get(asset.url, {
          headers,
          responseType: 'stream'
        })
        const fileStream = fs.createWriteStream(fileName)
        downloadResponse.data.pipe(fileStream)
        return new Promise((resolve, reject) => {
          fileStream.on('finish', resolve)
          fileStream.on('error', reject)
        })
      }
    }
  } catch (error) {
    console.error(`Error downloading file ${fileName}:`, error)
    process.exit(1)
  }
}

// Function to upload files
async function uploadFile(filePath, uploadUrl) {
  try {
    const form = new FormData()
    form.append('file', fs.createReadStream(filePath))

    const response = await axios.put(uploadUrl, form, {
      headers: form.getHeaders()
    })
    console.log(`Upload successful for ${filePath}`)
  } catch (error) {
    console.error(`Error uploading file ${filePath}:`, error)
    process.exit(1)
  }
}

// Main function to coordinate the process
async function createVersion(
  version,
  keyid,
  githubRepo,
  providerName,
  tftoken,
  ghtoken
) {
  writeVersionJson(version)
  const fileHeader = 'terraform-provider-' + providerName
  const versionData = await postVersion()

  const sumFileName = `${fileHeader}_${version}_SHA256SUMS`
  const sigFileName = `${sumFileName}.sig`

  await downloadFile(githubRepo, sumFileName)
  await downloadFile(githubRepo, sigFileName)

  const shasumsUploadUrl = versionData.data[-1].links['shasums-upload']
  const shasumsSigUploadUrl = versionData.data[-1].links['shasums-sig-upload']

  await uploadFile(sumFileName, shasumsUploadUrl)
  await uploadFile(sigFileName, shasumsSigUploadUrl)
}

// createVersion().catch(err => console.error(err));
