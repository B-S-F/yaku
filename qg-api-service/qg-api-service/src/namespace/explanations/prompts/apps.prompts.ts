import { Autopilots } from '../types'

const generalFewShotExamples: {
  input: string
  output: string
}[] = [
  {
    input: `#### Code Section ####
  title: >-
      Service Level Agreement is available for BPC deployment.
      Comment: 
      No SLA for OnPrem deployment, since we do not operate the service for the OnPrem customers. Support and Updates are part part of the OnPrem contract (see 1.2)
      https://bosch.sharepoint.com/:w:/r/sites/msteams_6298865/Shared%20Documents/General/60_Customers/Legal_Documents/Contract%20SaaS/English%20(not%20approved)/Service%20Level%20Agreement%20EN.docx?    d=wfa6fec680d9a42cb96a6cbb32a5b09df&csf=1&web=1&e=Aa2BT6
  run: |
        set -ex
        sharepoint-fetchers
        sharepoint-evaluator
      config:
        - sharepoint-file-check.yaml
      env:
        SHAREPOINT_FETCHER_PROJECT_SITE: https://bosch.sharepoint.com/sites/msteams_6298865
        SHAREPOINT_FETCHER_IS_CLOUD: 'True'
        SHAREPOINT_FETCHER_TENANT_ID: \${{ secrets.SHAREPOINT_TENANT_ID }}
        SHAREPOINT_FETCHER_CLIENT_ID: \${{ secrets.SHAREPOINT_CLIENT_ID }}
        SHAREPOINT_FETCHER_CLIENT_SECRET: \${{ secrets.SHAREPOINT_CLIENT_SECRET}}
        SHAREPOINT_EVALUATOR_CONFIG_FILE: ./sharepoint-file-check.yaml
        SHAREPOINT_FETCHER_FILENAME: Service Level Agreement EN.docx
        SHAREPOINT_FETCHER_PROJECT_PATH: Shared Documents/General/60_Customers/Legal_Documents/Contract SaaS/English (not approved)/Service Level Agreement EN.docx
  - sharepoint-file-check.yaml:
    rules:
      - property: "lastModifiedDateTime"
        is-not-older-than: "1 year"
  #### Autopilots Section ####
  - sharepoint-fetcher: If you are storing documents on SharePoint or want to upload your QG report to a SharePoint site, the SharePoint autopilots are the thing you want: download files or folders from a SharePoint site (on-premise or cloud instance), filter files by path or file properties, use custom defined SharePoint file properties, check downloaded files for required file properties, e.g. security classes, [planned] upload a QG report to a SharePoint site. With the Sharepoint fetcher and evaluator, you can fetch files from a SharePoint site that you have access to and subsequently evaluate them based on their SharePoint-related properties (last modified date, revision status, archiving period etc.). It can be used to check if a SharePoint site is accessible, if a document library contains a specific document, or if a list contains a certain number of items. The SharePoint Evaluator autopilot is a versatile tool that can be used to perform a wide range of checks on SharePoint data.
  - sharepoint-evaluator: The SharePoint evaluator is usually being used together with the sharepoint-fetcher in order to evaluate file properties of files stored on SharePoint sites. The evaluator reads rules for validating SharePoint files from a config file (given by SHAREPOINT_EVALUATOR_CONFIG_FILE) and then looks for those files in the evidence directory (given by the evidence_path environment variable, which is set by the QG main program) and validates the rules.`,
    output: `
    The following Autopilot runs the following steps:
      1. It sets the environment variables that determine the SharePoint site and credentials to use.
      2. The Sharepoint fetcher downloads the "Service Level Agreement EN.docx" file from the specified Sharepoint site.
      3. The SharePoint evaluator uses the file's properties to validate the "is-not-older-than" rule, ensuring that the file has been modified within the last year.
    In summary, this Autopilot fetches a file from a Sharepoint site and validates that the file was modified in the past year.`,
  },
  {
    input: `#### Code Section ####  
    title: >-
      Requirements in product roadmap for milestone \${{ env.PIS }} are closed.
      https://github.com/orgs/B-S-F/projects/80
    run: |
          set -ex
          # get features from https://github.com/orgs/B-S-F/projects/80
          ISSUES_FILENAME=issues_pi_\${{ env.PI }}.json
          PARSED_ISSUES_FILENAME=parsed_issues_pi_\${{ env.PI }}.json
          gh project item-list 80 --owner B-S-F --limit=1000 --format json | jq '.items | map(select(.status == "PI-\${{ env.PI }}" and .content.type!="DraftIssue" and .labels and ([.labels[] | contains("type:feature")]| any)))' > $ISSUES_FILENAME
          issue_numbers=$(cat $ISSUES_FILENAME | jq -r '.[].content.number')
          for issue_number in $issue_numbers
          do
            echo "Getting issue $issue_number"
            issue=$(gh issue view $issue_number --json state,closed,number,url,title,milestone -R B-S-F/project-management)
            issue_details+=("$issue")
          done
          printf '%s\n' "\${issue_details[@]}" | jq -s . > $PARSED_ISSUES_FILENAME
          if [[ $(cat $PARSED_ISSUES_FILENAME | jq 'length > 0') == false ]]; then
            echo '{ "status": "RED", "reason": "There are no features in column PI-\${{ env.PI }} of the [Yaku Product Roadmap](https://github.com/orgs/B-S-F/projects/80)"}'
            echo '{"result": {"criterion": "There are features in column PI-\${{ env.PI }} of the [Yaku Product Roadmap](https://github.com/orgs/B-S-F/projects/80)", "justification": "List of fetched features is empty", "fulfilled": false}}' 
            exit 0
          else
            echo '{"result": {"criterion": "There are features in column PI-\${{ env.PI }} of the [Yaku Product Roadmap](https://github.com/orgs/B-S-F/projects/80)", "justification": "List of fetched features is not empty", "fulfilled": true}}' 
          fi
          export JSON_INPUT_FILE=parsed_issues_pi_\${{ env.PI }}.json
          json-evaluator
        config:
          - roadmap-milestone-check.yaml
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          JSON_CONFIG_FILE: roadmap-milestone-check.yaml
          PI: '2401'
    - roadmap-milestone-check.yaml: file: "\${{ env.SHAREPOINT_FETCHER_FILENAME }}"
      rules:
        - property: "lastModifiedDateTime"
          is-not-older-than: "1 year"
    #### Autopilots Section ####
    - json-evaluator: Because JSON data format is so common, we have got a JSON autopilot for you! It can evaluate generic json files by defining conditions for required values. The JSON Evaluator autopilot is used to evaluate JSON data. It can be used to check if the JSON data contains certain values or structures or for example we can do checks on the data such that it meets certain criteria. The JSON Evaluator autopilot is a versatile tool that can be used to perform a wide range of checks on JSON data.`,
    output: `
    The following Autopilot runs the following steps:
      1.It fetches a list of issues from a Github project board, where the issues have the label 'type:feature' and are in a specific PI column.
      2.The fetched issues are written to a JSON file.
      3.If the JSON file contains no data, it returns a RED status with a message, else it returns a success message.
      4.The JSON evaluator is then used to evaluate the JSON file against a "is-not-older-than 1 year" rule.
    In summary, this Autopilot fetches a list of issues from a Github project board, filters out issues not labeled 'type:feature' or not in the specified PI column, writes the filtered issues to a JSON file, and then evaluates the file against a "is-not-older-than 1 year" rule.`,
  },
  {
    input: `#### Code Section #### 
    title: >- 
        SBOM (Software Bill of Materials) is available for core api.
    run: |
          set -ex
          curl -L \
            -H 'Accept: application/vnd.github.v3.raw' \
            -H "Authorization: Bearer \${{ secrets.GITHUB_TOKEN}}" \
            -H "X-GitHub-Api-Version: 2022-11-28" \
            -O \
            https://api.github.com/repos/B-S-F/\${{ env.SBOM_REPO }}/contents/\${{ env.SBOM_PATH }}
          gh api -H "Accept: application/vnd.github+json" "/repos/B-S-F/\${{ env.SBOM_REPO }}/commits?path=\${{ env.SBOM_PATH }}" > sbom_commits.json
          node sbom-check.js
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          SBOM_REPO: qg-api-service
          SBOM_PATH: qg-api-service/oss/YakuCoreApi-SBOM.json
    #### Autopilots Section ####
    - *see bash script*`,
    output: `
    The following Autopilot runs the following steps:
      1.It fetches a file from a Github repository and saves it locally.
      2.It fetches the commit history for the file and saves it to a JSON file.
      3.It runs a Node.js script (sbom-check.js) to check the downloaded SBOM (Software Bill of Materials) file.
    In summary, this Autopilot fetches a file from a Github repository, fetches the commit history of the file, and checks the file using a Node.js script`,
  },
]

const autopilots: Autopilots = {
  'ado-work-items-evaluator': {
    context: `You are tracking task items in Azure DevOps? You want to know if all bugs are fixed and all feature requests closed? Then, the Azure DevOps autopilots are for you: Run queries on Azure DevOps to get the list of open issues or work items, Validate that there are no open bugs or feature requests, …etc. With the ado fetcher and evaluator, you can fetch tickets/work items from an ado project of your organization and subsequently check, whether their properties meet certain conditions.`,
    fewshotExamples: [],
  },

  'ado-work-items-fetcher': {
    context: `You are tracking task items in Azure DevOps? You want to know if all bugs are fixed and all feature requests closed? Then, the Azure DevOps autopilots are for you: Run queries on Azure DevOps to get the list of open issues or work items, Validate that there are no open bugs or feature requests, …etc. With the ado fetcher and evaluator, you can fetch tickets/work items from an ado project of your organization and subsequently check, whether their properties meet certain conditions.`,
    fewshotExamples: [],
  },

  'artifactory-fetcher': {
    context: `You store code analysis reports, PDF documents or any other artifacts that you need to gather before a software new version release? Use the Artifactory fetcher to: Download artifacts from jFrog Artifactory, Perform an SHA256 Checksum check on the downloaded artifact and stops if there is an error. The fetcher makes a request against jFrog Artifactory REST API, downloads the specified artifact and stores it in the evidence path. It performs an SHA256 Checksum check on the downloaded artifact and stops if there is an error. The evidence path is set during the execution of a run and read as an environment variable by any evaluator used to evaluate the data fetched by artifactory-fetcher.`,
    fewshotExamples: [],
  },

  'defender-for-cloud': {
    context: `Do you wish to retrieve the alerts from Microsoft Defender for Cloud, along with their metadata? Do you wish to filter these alerts based on certain aspects, such as the alert type, the compromised entity's name, or even just by searching certain keywords in the alert's name and description? Defender for Cloud autopilot can do that for you!`,
    fewshotExamples: [],
  },

  'docupedia-fetcher': {
    context: `If you need to collect and check wiki pages that contain new release information before releasing the new software version, the Docupedia autopilot can do that for you! The Docupedia Fetcher Autopilot is a tool that allows you to download the content along with the metadata of a Docupedia page. The fetcher will store in the evidence path three types of content: a simple html file, a metadata file and a styled html version along with all its assets(images, css styles, fonts, js, etc).`,
    fewshotExamples: [],
  },

  'git-fetcher': {
    context: `You are developing on Bitbucket or GitHub and want to make sure that the development is going to be ready in time? Use the Git autopilot to: Get a list of pull-requests of a specific project, Ensure that all PRs have the conditions you define, Check which content of a file has been modified, Get the metadata about each commit that changed a file. Git Fetcher Autopilot is a tool that allows you to fetch pull requests from a specified project and resource of your organization on GitHub or Bitbucket platforms.`,
    fewshotExamples: [],
  },

  'ilm-evaluator': {
    context: `Important note: ILM is a Bosch-specific implementation. Do you wish to retrieve the WorkOn status for a specific SharePoint file, together with the workflow requestor and approvers? The ILM Evaluator can do that for you! ILM (Information Lifecycle Management) is a concept for the administration and control of documents over their entire lifecycle. It supports compliance with the legal requirements of the business relevant information. WorkOn is the platform for workflows in many areas of the Bosch Group. It handles parts of the business processes (for example, by obtaining approvals from one or more other employees). ILM can interact directly with WorkOn.ILM Evaluator Autopilot is a tool that allows you to retrieve the WorkOn status for a specific SharePoint file, together with the workflow requestor and approvers. `,
    fewshotExamples: [],
  },

  'jira-fetcher': {
    context: `If you need to check the status of all Jira tickets related to the new software version before being able to release, Jira autopilot can save you a lot of time! Run queries on Jira API to get the list of required issues, Validate that all requested issues have the required properties, Get a list of issues that don't have the required properties. A fetcher to get issues from Jira Tracker via the Jira Rest API. It can be configured by a configuration file that contains a query and other filtering criteria. An evaluator to check the response returned by the “jira-fetcher” according to the rules defined in a configuration file`,
    fewshotExamples: [],
  },

  'jira-evaluator': {
    context: `If you need to check the status of all Jira tickets related to the new software version before being able to release, Jira autopilot can save you a lot of time! Run queries on Jira API to get the list of required issues, Validate that all requested issues have the required properties, Get a list of issues that don't have the required properties. A fetcher to get issues from Jira Tracker via the Jira Rest API. It can be configured by a configuration file that contains a query and other filtering criteria. An evaluator to check the response returned by the “jira-fetcher” according to the rules defined in a configuration file`,
    fewshotExamples: [],
  },

  'json-evaluator': {
    context: `Because JSON data format is so common, we have got a JSON autopilot for you! It can evaluate generic json files by defining conditions for required values. The JSON Evaluator autopilot is used to evaluate JSON data. It can be used to check if the JSON data contains certain values or structures or for example we can do checks on the data such that it meets certain criteria. The JSON Evaluator autopilot is a versatile tool that can be used to perform a wide range of checks on JSON data.`,
    fewshotExamples: [],
  },

  'manual-answer-evaluator': {
    context: `For questions that can't be answered via an automatic check, we have got a solution for you! You can enter the answer to the question as a file, define for how long would this answer be valid and the manual-answer evaluator will take care of checking the validity of the answer during the coming assessments. An evaluator that checks if a given manual answer has passed it's expiration time. The mdate (modification date) of the answer's file is used as a reference.`,
    fewshotExamples: [],
  },

  'mend-fetcher': {
    context: `If you need to check your code repositories or container images for vulnerabilities then the Mend autopilot is the right tool for that! The Mend autopilot will fetch reports from the Mend's Software Composition Analysis(SCA) scans and answer your requirements checks. The Mend Vulnerabilities autopilot will fetch vulnerability reports from the Mend's Software Composition Analysis(SCA) scans to answer your requirements checks. Currently supported are CVE or better known as Common Vulnerabilities and Exposures. The autopilot is a powerful tool that can be used to quickly and easily access data from the Mend service. The Mend Alerts autopilot will fetch alerts from the Mend's Software Composition Analysis(SCA) scans to answer your requirements checks. Currently supported are alerts such as policy, security ...etc. The autopilot is a powerful tool that can be used to quickly and easily access data from the Mend service.`,
    fewshotExamples: [],
  },

  'pdf-signature-evaluator': {
    context: `You have many PDF documents that must be checked if they were successfully signed by the required people before a new software version release? PDF-signature evaluator can do that for you! An evaluator that checks the integrity of PDF signatures and optionally matches the generated list of signers against a predefined expected list of signers. You can choose to either check if at least one signer from the predefined list has signed the document or if all listed signers have signed the document (the latter being the default option).`,
    fewshotExamples: [],
  },

  'sharepoint-fetcher': {
    context: `If you are storing documents on SharePoint or want to upload your QG report to a SharePoint site, the SharePoint autopilots are the thing you want: download files or folders from a SharePoint site (on-premise or cloud instance), filter files by path or file properties, use custom defined SharePoint file properties, check downloaded files for required file properties, e.g. security classes, [planned] upload a QG report to a SharePoint site. With the Sharepoint fetcher and evaluator, you can fetch files from a SharePoint site that you have access to and subsequently evaluate them based on their SharePoint-related properties (last modified date, revision status, archiving period etc.). It can be used to check if a SharePoint site is accessible, if a document library contains a specific document, or if a list contains a certain number of items. The SharePoint Evaluator autopilot is a versatile tool that can be used to perform a wide range of checks on SharePoint data.`,
    fewshotExamples: [],
  },

  'sharepoint-evaluator': {
    context: `If you are storing documents on SharePoint or want to upload your QG report to a SharePoint site, the SharePoint autopilots are the thing you want: download files or folders from a SharePoint site (on-premise or cloud instance), filter files by path or file properties, use custom defined SharePoint file properties, check downloaded files for required file properties, e.g. security classes, [planned] upload a QG report to a SharePoint site. With the Sharepoint fetcher and evaluator, you can fetch files from a SharePoint site that you have access to and subsequently evaluate them based on their SharePoint-related properties (last modified date, revision status, archiving period etc.). It can be used to check if a SharePoint site is accessible, if a document library contains a specific document, or if a list contains a certain number of items. The SharePoint Evaluator autopilot is a versatile tool that can be used to perform a wide range of checks on SharePoint data.`,
    fewshotExamples: [],
  },

  'sonarqube-fetcher': {
    context: `If you use SonarQube to perform code quality checks and you need to collect and check the scan report results of your new software version before performing a release, SonarQube autopilot can take care of that for you! The fetcher makes a request against the Sonarqube API, gets the the current status of the project quality gates and saves it as a json file to the evidence path. `,
    fewshotExamples: [],
  },

  'sonarqube-evaluator': {
    context: `If you use SonarQube to perform code quality checks and you need to collect and check the scan report results of your new software version before performing a release, SonarQube autopilot can take care of that for you! The fetcher makes a request against the Sonarqube API, gets the the current status of the project quality gates and saves it as a json file to the evidence path. `,
    fewshotExamples: [],
  },

  'splunk-fetcher': {
    context: `Splunk is a software platform that helps organizations collect, analyze, and visualize machine-generated data for monitoring and gaining insights into their systems. Do you use Splunk for data collection and analysis and need to collect reports from there and check them before releasing the new software version? You can now easily use the Splunk Fetcher for that, which uses defined search queries to get data from a Splunk server and stores it. `,
    fewshotExamples: [],
  },

  unknown: {
    context: `Nothing is known about this autopilot, you must let the user know that it is an unknown autopilot. If the input is something that is familiar a short answer can be provided all while letting the user know that its not certain, otherwise tell the user that currently this autopilot is not yet support for this AI feature.`,
    fewshotExamples: [],
  },
}

export const getFewShotExamples = () => {
  return generalFewShotExamples
}

export const getAutoPilotsInfo = (script: string) => {
  const autopilotInfo: {
    name: string
    description: string
    fewshotExamples: {
      input: string
      output: string
    }[]
  }[] = []

  for (const autopilot in autopilots) {
    if (script.includes(autopilot)) {
      autopilotInfo.push({
        name: autopilot,
        description: autopilots[autopilot].context,
        fewshotExamples: autopilots[autopilot].fewshotExamples,
      })
    }
  }
  return autopilotInfo
}

export const getAutoPilotInfo = (autopilot: string) => {
  if (!autopilots.hasOwnProperty(autopilot)) {
    autopilot = 'unknown'
  }
  const autopilotPackage = autopilots[autopilot]
  return autopilotPackage
}
