const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const readline = require('readline')
const { spawn } = require('child_process')

let version, ghtoken, tftoken

function upload(shasum, filename) {
  const fileHeader = 'terraform-provider-slim'
  const orgName = 'hal-ipsl' // Set organization name
  const provider = 'slim' // Set provider name

  let os, arch
  try {
    ;[, , os, arch] = filename.split('_')
    arch = arch.split('.')[0]
  } catch (error) {
    console.error(`Error: ${filename} is not supported. Skipped`)
    return
  }

  console.log(os, arch)

  const payload = {
    data: {
      type: 'registry-provider-version-platforms',
      attributes: {
        os,
        arch,
        shasum,
        filename
      }
    }
  }

  // Create JSON file
  fs.writeFileSync(`payload_${filename}.json`, JSON.stringify(payload, null, 2))

  // Send POST request to Terraform API
  const headers = {
    Authorization: `Bearer ${tftoken}`,
    'Content-Type': 'application/vnd.api+json'
  }
  const url = `https://app.terraform.io/api/v2/organizations/${orgName}/registry-providers/private/${orgName}/${provider}/versions/${version}/platforms`

  axios
    .post(url, payload, { headers })
    .then(response => {
      if (response.status === 201) {
        const uploadLink = response.data.data.links['provider-binary-upload']
        const fileStream = fs.createReadStream(filename)
        axios
          .put(uploadLink, fileStream)
          .catch(error => console.error(`Error uploading file: ${error}`))
      } else {
        console.error(`Error: ${response.status}`)
      }
    })
    .catch(error => console.error(`Error in POST request: ${error}`))
}

async function main(version) {
  ghtoken = process.env.GHTOKEN // Set GitHub API token
  tftoken = process.env.TFTOKEN // Set Terraform API token

  const shasumFile = `terraform-provider-slim_${version}_SHA256SUMS`
  const fileStream = fs.createReadStream(shasumFile)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  for await (const line of rl) {
    const [shasum, filename] = line.split(/\s+/)
    console.log(filename)

    // Run external script (equivalent to subprocess.run in Python)
    spawn('sh', [
      '../gh_download.sh',
      ghtoken,
      'hal-rd-tomoe/terraform-provider-slim',
      filename,
      'latest'
    ])

    upload(shasum, filename)
  }
}

// main()
