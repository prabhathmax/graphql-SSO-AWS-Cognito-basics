import 'dotenv/config';
import {
  SecretsCache,
  DbSecrets,
  JwtSecret,
  S3Secrets,
  CognitoSecrets,
} from './helpers/secretsCache';

const { createLogger, format, transports } = require('winston');

const createContext = async () => {
  const secretsCache = new SecretsCache();
  const dbSecrets = new DbSecrets(secretsCache);
  const jwtSecret = new JwtSecret(secretsCache);
  const s3Secret = new S3Secrets(secretsCache);
  const cognitoSecrets = new CognitoSecrets(secretsCache);
  // const knex = Knex({
  //   client: 'mysql',
  //   connection: await dbSecrets.getAsKnex(),
  //   pool: { min: 0, max: 7 },
  //   useNullAsDefault: true,
  // });
  const access = createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    exitOnError: false,
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      format.errors({ stack: true }),
      format.splat(),
      format.json(),
    ),
    transports: [new transports.Console()],
  });

  return {
    log: {
      access,
    },
    secrets: {
      db: dbSecrets,
      jwt: jwtSecret,
      s3: s3Secret,
      cognito: cognitoSecrets,
    },
  };
};

export default createContext;
