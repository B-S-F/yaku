import * as path from 'path'

export const {
  // Service Configuration
  PORT = '3000',
  PATH_PREFIX = '',
  IMAGE_VERSION = 'n/a',
  QG_LOG_LEVEL = 'debug', // either debug, verbose, log, warn, or error. Debug has most output, error the least.
  TESTDATA_CLEANUP = 'false',
  TESTDATA_NAMESPACES = '',
  TESTDATA_RETENTION_PERIOD_IN_DAYS = '7',
  SWAGGER_TITLE = 'Yaku Core API',
  MAX_FILE_SIZE_MB = '2', // max file size for file uploads in MB, turn off check with 0 value

  // URL Protocol Configuration
  SERVICE_PROTOCOL = 'https',

  // Encryption Configuration
  ENCRYPTION_KEY = '2AuQHIRY1YYD1dBu53HRlH8WlOaWtRLP',
  MAX_SECRET_LENGTH = '8192', // max size of a secret, turn off check with 0 value

  // Workflow Configuration
  ARGO_NAMESPACE = 'argo',
  ARGO_SERVER = 'https://argo-server:2746',
  QGCLI_VERSION = 'latest',
  QGCLI_IMAGE = '',
  QGCLI_PULL_POLICY = 'Always', // either 'Always' or 'Never' case sensitive
  RESULT_DELAY = '5000',

  // MinIO Configuration
  MINIO_SERVER = 'https://minio:9000',
  MINIO_BUCKET = 'my-bucket',
  MINIO_USERNAME = 'admin',
  MINIO_PASSWORD = 'password',
  MINIO_USE_SSL = 'false',

  // OpenAI feature
  ENABLE_EXPLANATIONS_FEATURE = 'false',
  OPENAI_BASE_URL = 'https://yaku-dev.openai.azure.com/openai/deployments/',
  OPENAI_API_KEY = '',
  OPENAI_API_VERSION = '',
  OPENAI_MODEL = 'yaku-dev',

  // Email Notification feature
  ENABLE_MAIL_NOTIFICATIONS_FEATURE = 'false',
  SMTP_HOST = 'in-v3.mailjet.com',
  SMTP_PORT = '465',
  SMTP_USERNAME = '',
  SMTP_PASSWORD = '',
  SMTP_SECURE = 'true', // either 'true' or 'false', enable secure connection
  SMTP_SENDER = 'yaku@mailing.bosch.com',
  USE_MAILJET_API = 'false', // either 'true' or 'false', use Mailjet API instead of SMTP
  MAILJET_API_URL = 'https://api.mailjet.com',
  MAILJET_USE_PROXY = 'false', // either 'true' or 'false', use proxy for Mailjet API
  MAILJET_API_KEY = '',
  MAILJET_API_SECRET = '',
  // TODO: Discuss with ui if we could get rid of th instance name somehow
  INSTANCE_NAME = 'development', // either 'development', 'qa', 'production', 'bcn-internal-development', 'bcn-internal-qa', or 'bcn-internal-production', must be set to create the correct links in the email
  UI_URL = 'https://portal.bswf.tech', // UI url for the links in the emails
  UI_SETTINGS_PATH = '/settings', // path to the settings page in the UI (must start with '/')
  TEMPLATE_PATH = path.join(__dirname, 'mailing', 'templates'), // path to the templates, can be updated to a different path for testing and hotfixes

  // DB Configuration
  DB_TYPE = 'sqlite', // or 'postgres'
  DB_HOST = '<to be filled in>', // only relevant for postgres
  DB_PORT = '5432', // only relevant for postgres
  DB_NAME = 'yaku', // only relevant for postgres
  DB_USERNAME = 'yakuuser', // only relevant for postgres
  DB_PASSWORD = '<to be filled in>', // only relevant for postgres
  DB_MIGRATIONS_RUN = 'false', // true for dev/QA, *FALSE FOR PRODUCTION*, SHOULD BE SET TO FALSE BY DEFAULT
  DB_USE_SSL = 'true', // only relevant for postgres
  DATA_DIR = path.join(process.cwd(), 'qgaas-data-storage'),

  // Private Cloud Configuration
  IN_PRIVATE_CLOUD = 'false',
  HTTP_PROXY = '',
  WORKFLOW_NO_PROXY = '', // no_proxy env var used by the workflow container
  PULL_SECRET_NAME = '',

  // Keycloak Configuration
  KEYCLOAK_AUTH = 'off', // either 'on' or 'off'
  KEYCLOAK_SERVER = 'https://bswf.authz.bosch.com', // KeyCloak base url
  KEYCLOAK_REALM = 'bswf', // KeyCloak realm name
  KEYCLOAK_CLIENT_ID = 'yaku-core', // KeyCloak client name for api
  KEYCLOAK_CLIENT_SECRET = '', // see https://bswf.authz.bosch.com/auth/admin/master/console/#/bswf/clients/a51b5635-dc46-4550-b561-cf25c12ba8d3/credentials
  KEYCLOAK_ENABLE_PROXY_TUNNEL = 'false', // either 'true' or 'false'
  SWAGGER_OAUTH2_CLIENT_ID = 'yaku-core-swagger', // KeyCloak client name for swagger client

  // Keycloak admin url, including the realm
  // Example: 'https://bswf.authz.bosch.com/auth/admin/realms/azure-dev'
  KEYCLOAK_ADMIN_URL = '',

  // The .well-known configuration URL for the OpenID Connect endpoint.
  // It can be found under Realm Settings -> OpenID Endpoint Configuration in Keycloak
  // Example: 'https://bswf.authz.bosch.com/auth/realms/azure-dev/.well-known/openid-configuration'
  KEYCLOAK_WELL_KNOWN_CONFIG = '',

  // Disable checking the argo service archive for finished workflows
  SKIP_CHECK_ARGO_ARCHIVE = 'false',

  // Feature flag for the override controller - database migrations are still applied
  ENABLE_OVERRIDE_CONTROLLER = 'false',

  // Disable authentication with old tokens and log if old tokens are used
  DISABLE_OLD_TOKENS = 'false',
  // Log if old tokens are used, not needed, when DISABLE_OLD_TOKENS is set to "true"
  LOG_OLD_TOKEN_USE = 'false',

  // Feature flag for the tasks feature, enabled if set to 'true'
  ENABLE_TASKS_CONTROLLER = 'false',
} = process.env
