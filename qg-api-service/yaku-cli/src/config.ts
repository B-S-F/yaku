export const config = {
  version: '0.58.0', // AUTO_REPLACE_VERSION_ON_RELEASE
  sbomFileName: 'YakuClientCLI-SBOM.json',
  oAuth2Config: {
    responseType: 'code',
    clientId: 'yaku-cli',
    scope: 'openid',
    loginTimeout: 5 * 60 * 1000, // 5 minutes
  },
}
