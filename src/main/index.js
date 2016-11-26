const amqp = require('amqp');
const pg = require('pg');

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

    amqpConnection.on('ready', (connectionError) => {
        if (connectionError) {
            reject({message: 'AMQP connection could not be established.', cause: connectionError});
        } else {
            amqpConnection.on('close', () => {
                console.log('AMQP Connection closed');
            });
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

    const pgClient = new pg.Client(dbConfig);

    pgClient.connect((connectionError) => {
        "use strict";

        if (connectionError) {
            reject({message: 'Database connection could not be established.', cause: connectionError});
        } else {
            resolve(pgClient);
        }
    });
});


const runtimeConfig = ConfigService.parseFromOsEnvAndProcessArgs();
console.log('Runtime config parsed: ', runtimeConfig);

Promise.all([
    establishDbConnection(),
    establishAmqpConnection()
]).then((connections) => {
    "use strict";

    const pgClient = connections[0];
    const amqpConnection = connections[1];
    const iotQuickstart = new IotQuickstart(pgClient, amqpConnection, runtimeConfig);
    iotQuickstart.init();

}).catch((connectionError) => {
    "use strict";
    console.error('Connection could not be established: ', connectionError);
    gracefulShutdown();
});


// this function is called when you want the server to die gracefully
// i.e. wait for existing connections
const gracefulShutdown = (pgClient) => {

    console.log('Received kill signal, shutting down gracefully.');

    if (pgClient) {
        pgClient.end(() => console.log('Closed out remaining postgres connections.'));
    }

    process.exit();

    // if after
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit()
    }, 10000);
};

// listen for TERM signal .e.g. kill
process.on('SIGTERM', gracefulShutdown);

// listen for INT signal e.g. Ctrl-C
process.on('SIGINT', gracefulShutdown);
