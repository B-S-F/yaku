// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { App } from '~/types/App'

export const sharepointFetcher: App = {
  name: 'Sharepoint fetcher',
  envs: [
    {
      name: 'SHAREPOINT_FETCHER_PROJECT_SITE',
      description:
        'This variable contains the URL of the SharePoint site where the evidence directory is located. The URL usually follows this pattern https://{site_link}/sites/{site}.',
      optional: false,
      example: 'https://sites.inside-share2.org.com/sites/1234567/',
    },
    {
      name: 'SHAREPOINT_FETCHER_PROJECT_PATH',
      description:
        'This variable contains the path to the folder inside Sharepoint which contains the files you want to fetch. The first part of this path contains the name of the root folder of your SharePoint site. Usually, this is Documents, but check the URL to your file if you are unsure. If you want to download only a single file, you can specify the file path instead of its parent directory. If the given path ends with a slash (/), it is assumed that the path points to a directory. If it doesn’t end with a slash, the argument is assumed to point to a single file.',
      optional: false,
      example: 'Documents/fossid-tools-report-ok/',
    },
    {
      name: 'SHAREPOINT_FETCHER_USERNAME',
      description:
        'This variable contains the username of the account that is used to access the SharePoint server.',
      optional: false,
      example: '',
    },
    {
      name: 'SHAREPOINT_FETCHER_PASSWORD',
      description:
        'This variable must contain the password of the user given in SHAREPOINT_FETCHER_USERNAME.',
      optional: false,
      example: '',
    },
    {
      name: 'SHAREPOINT_FETCHER_CUSTOM_PROPERTIES',
      description:
        'SharePoint supports custom properties for files and folders. Examples are things like Confidentiality Class or Workflow Status. Read more about it: https://asr-docs.bswf.tech/autopilots/sharepoint/reference/sharepoint-fetcher-reference.html#envvar-SHAREPOINT_FETCHER_CUSTOM_PROPERTIES',
      optional: true,
      example: 'Documents/fossid-tools-report-ok/',
    },
    {
      name: 'SHAREPOINT_FETCHER_DOWNLOAD_PROPERTIES_ONLY',
      description:
        'If you are not interested in the files’ contents but only in their properties, you can save resources and bandwidth by only downloading file properties and not the files themselves. However, beware that you can not evaluate files, if you haven’t downloaded them. The properties file on its own is not sufficient for that.',
      optional: true,
      example: 'true',
    },
    {
      name: 'SHAREPOINT_FETCHER_FORCE_IP',
      description:
        'In case the name resolution of the SharePoint site is faulty, you can override the DNS name resolution by providing a custom IP address which will then be used instead of the DNS-resolved IP address for the given hostname.',
      optional: true,
      example: '9.9.9.9',
    },
    {
      name: 'SHAREPOINT_FETCHER_CONFIG_FILE',
      description:
        'This variable contains the path to the config file of the fetcher. Unlike in most other cases, this config file is optional. You can find more information in the documentation: https://asr-docs.bswf.tech/autopilots/sharepoint/reference/sharepoint-fetcher-reference.html#sharepoint-fetcher-config-file.',
      optional: true,
      example: '',
    },
  ],
}
