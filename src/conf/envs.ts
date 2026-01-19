import 'dotenv/config';

import { z } from 'zod';

const envsSchema = z.object({
  // NestJS
  PORT: z.coerce.number().default(3003),
  ENTORNO: z.string().default('DEV'),
  // MongoDB
  MONGODB_CONNECT: z.string(),
  // JWT
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('1d'),
  // SMTP EMAIL
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().default(25),
  // UNIMUS
  UNIMUS_URL: z.string(),
  UNIMUS_TOKEN: z.string(),
  // SSH
  SSH_HOST: z.string(),
  SSH_USER: z.string(),
  SSH_PASSWORD: z.string(),
  // DB (LibreNMS)
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().default(3306),
  DB_USERNAME: z.string(),
  DB_DATABASE: z.string(),
  DB_PASSWORD: z.string(),
  // RabbitMQ
  RABBITMQ_URL: z.string(),
  // Ubersmith
  URL_UBERSMITH: z.string(),
  USERNAME_UBERSMITH: z.string(),
  PASSWORD_UBERSMITH: z.string(),
  // InfluxDB
  INFLUX_URL: z.string(),
  INFLUX_TOKEN: z.string(),
  INFLUX_ORG: z.string(),
  INFLUX_BUCKET: z.string(),
});

const { success, error, data } = envsSchema.safeParse(process.env);

if (!success) {
  const missingVars = error.issues.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
  console.error('\n❌ Error de validación de variables de entorno:\n');
  console.error(missingVars);
  console.error('\n💡 Asegúrate de tener estas variables en tu archivo .env\n');
  throw new Error('Variables de entorno inválidas. Revisa la consola para más detalles.');
}

export const envs = {
  // NestJS
  port: data.PORT,
  entorno: data.ENTORNO,
  // MongoDB
  mongodbConnect: data.MONGODB_CONNECT,
  // JWT
  jwtSecret: data.JWT_SECRET,
  jwtExpiresIn: data.JWT_EXPIRES_IN,
  // SMTP EMAIL
  smtpHost: data.SMTP_HOST,
  smtpPort: data.SMTP_PORT,
  // UNIMUS
  unimusUrl: data.UNIMUS_URL,
  unimusToken: data.UNIMUS_TOKEN,
  // SSH
  sshHost: data.SSH_HOST,
  sshUser: data.SSH_USER,
  sshPassword: data.SSH_PASSWORD,
  // DB (LibreNMS)
  dbHost: data.DB_HOST,
  dbPort: data.DB_PORT,
  dbUsername: data.DB_USERNAME,
  dbDatabase: data.DB_DATABASE,
  dbPassword: data.DB_PASSWORD,
  // RabbitMQ
  rabbitmqUrl: data.RABBITMQ_URL,
  // Ubersmith
  urlUbersmith: data.URL_UBERSMITH,
  usernameUbersmith: data.USERNAME_UBERSMITH,
  passwordUbersmith: data.PASSWORD_UBERSMITH,
  // InfluxDB
  influxUrl: data.INFLUX_URL,
  influxToken: data.INFLUX_TOKEN,
  influxOrg: data.INFLUX_ORG,
  influxBucket: data.INFLUX_BUCKET,
};
