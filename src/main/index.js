const amqp = require('amqp');
const pg = require('pg');

// logging library + configuration
const log4js = require('log4js');
log4js.configure({
    appenders: [
        {
            type: 'console'
        },
        {
            type: 'file',
            maxLogSize: 20 * 1024 * 1024,
            backups: 3,
            level: 'TRACE',
            filename: 'iot-quickstart-queue-to-db.log'
        }
    ]
});

const logger = log4js.getLogger('index.js');

const ConfigService = require('./config/config-service');
const IotQuickstart = require('./iot-quickstart');

const establishAmqpConnection = () => new Promise((resolve, reject) => {
    "use strict";

    const queueConfig = {
        host: runtimeConfig.queueHost,
        port: runtimeConfig.queuePort,
        login: runtimeConfig.queueUser,
        password: runtimeConfig.queuePassword
    };

    const amqpConnection = amqp.createConnection(queueConfig);

    logger.info(`Establishing connection to AMQP service at ${runtimeConfig.queueHost} ...`);
    amqpConnection.on('ready', (connectionError) => {
        if (connectionError) {
            reject({message: 'AMQP connection could not be established.', cause: connectionError});
        } else {
            amqpConnection.on('close', () => {
                logger.trace('AMQP Connection closed');
            });
            logger.info(`AMQP connection: OK`);
            resolve(amqpConnection);
        }
    });
});

const establishDbConnection = () => new Promise((resolve, reject) => {
    "use strict";

    const dbConfig = {
        user: runtimeConfig.dbUser,
        password: runtimeConfig.dbPassword,
        database: runtimeConfig.dbSchema,
        host: runtimeConfig.dbHost,
        port: runtimeConfig.dbPort
    };

    logger.info(`Establishing connection to database ... `);

    const pgClient = new pg.Client(dbConfig);

    pgClient.connect((connectionError) => {
        "use strict";

        if (connectionError) {
            reject({message: 'Database connection could not be established.', cause: connectionError});
        } else {
            logger.info('Database connection: OK.');
            resolve(pgClient);
        }
    });
});


const runtimeConfig = ConfigService.parseFromOsEnvAndProcessArgs();
logger.info('Runtime config parsed: ', runtimeConfig);


const forcefulShutdown = (exitCode, message) => {
    "use strict";
    logger.fatal(`Shutting down forcefully with code "${exitCode}" and a message: ${message}"`);
    process.exit(exitCode);
};

// if initialization took longer than 30 seconds something is hanging/not responding/etc..
const timeoutId = setTimeout(() => forcefulShutdown(10, `Timed out while waiting for init (30 seconds)`), 30 * 1000);

Promise.all([
    establishDbConnection(),
    establishAmqpConnection()
]).then((connections) => {
    "use strict";

    logger.debug(`Db & Queue connections OK, clearing the init timeout ...`);
    clearTimeout(timeoutId);

    const pgClient = connections[0];
    const amqpConnection = connections[1];
    const iotQuickstart = new IotQuickstart(pgClient, amqpConnection, runtimeConfig);
    iotQuickstart.init();

}).catch((connectionError) => {
    "use strict";
    logger.error('Connection could not be established: ', connectionError);
    gracefulShutdown();
});


// this function is called when you want the server to die gracefully
// i.e. wait for existing connections
const gracefulShutdown = (pgClient) => {

    logger.info('Received kill signal, shutting down gracefully.');

    if (pgClient) {
        pgClient.end(() => logger.info('Closed out remaining postgres connections.'));
    }

    process.exit();

    // if after
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit();
    }, 10000);
};

// listen for TERM signal .e.g. kill
process.on('SIGTERM', gracefulShutdown);

// listen for INT signal e.g. Ctrl-C
process.on('SIGINT', gracefulShutdown);
