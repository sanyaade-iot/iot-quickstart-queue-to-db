const check = require('check-types');

const EntityManager = require('./persistence/entity-manager');
const RuntimeConfig = require('./config/runtime-config');

/**
 * The main entrypoint for the application itself. A singleton class which allows it's constructor to be called only
 * once.
 *
 * Usage: Establish the necessary connections (database, queue) in index.js and then create an instance of this class
 * to manage and encapsulate global application state (which should be as little as possible, but ultimately not
 * avoidable completely).
 *
 * @author Peter (Somogyvari) Metz <peter.metz@unarin.com>
 * @created 26/11/2016
 * @since 1.0.0
 */
class IotQuickstart {

    /**
     * Returns the singleton instance of this class. Throws if there hasn't been one initalized yet (through the
     * constructor).
     *
     * @return {IotQuickstart} The singleton instance of this class.
     *
     * @throws {Error}
     *
     * @since 1.0.0
     */
    static getInstance() {
        if (IotQuickstart._INSTANCE == null) {
            throw new Error('Singleton instance of IotQuickstart not yet created. Use constructor exactly once.');
        } else {
            return IotQuickstart._INSTANCE;
        }
    }

    /**
     * Standard, side-effect free constructor that assigns the parameters to private members for later use.
     *
     * @param {pg.Client} pgClient The client object that will be used for database queries/statement execution.
     * Mandatory parameter, expected to be in a working condition.
     *
     * @param {amqp.Connection} amqpConnection The AMQP connection that's been established between this application
     * and the queue implementation. Mandatory parameter, expected to be in a working condition.
     *
     * @param {RuntimeConfig} runtimeConfig The application level configuration. Used by other components of the
     * application to fulfill their responsibilities.
     *
     * @throws {Error} If any of the parameters supplied are not present or not in working condition.
     *
     * @since 1.0.0
     */
    constructor(pgClient, amqpConnection, runtimeConfig) {

        check.assert.object(pgClient, 'IllegalArg: Expected parameter "pgClient" to be an object.');
        check.assert.object(amqpConnection, 'IllegalArg: Expected parameter "amqpConnection" to be an object.');
        check.assert.instanceStrict(runtimeConfig, RuntimeConfig);

        if (IotQuickstart._INSTANCE != null) {
            throw new Error('IllegalOperation: An instance of IotQuickstart already eixsts. Use getInstance().');
        } else {
            IotQuickstart._INSTANCE = this;
        }

        this._pgClient = pgClient;
        this._amqpConnection = amqpConnection;
        this._entityManager = new EntityManager(this._pgClient);
        this._runtimeConfig = runtimeConfig;
    }

    get pgClient() {
        return this._pgClient;
    }

    get amqpConnection() {
        return this._amqpConnection;
    }

    get entityManager() {
        return this._entityManager;
    }

    get runtimeConfig() {
        return this._runtimeConfig;
    }

    /**
     * Initializes the application instance (singleton) by fetching all the micro-service definitions from the database
     * and allocating the matching resources (queues, schemas) to each and every one of them.
     *
     * @return {Promise} Resolves if all went OK, rejects if any of the micro services failed to be allocated.
     *
     * @since 1.0.0
     */
    init() {

        console.log('IotQuickstart - Initializing ...');

        return new Promise((resolve, reject) => {
            this._getMicroServicesFromDb()
                .then((queryResult) => this._establishMicroServiceConnections(queryResult.rows))
                .then(resolve)
                .catch((err) => {
                    const ex = new Error(`Could not initialize IotQuickstart: ${err && err.message}`);
                    ex.cause = err;
                    reject(ex);
                });
        })
            .then(() => console.log('IotQuickstart - Initialization: OK'));
    }

    /**
     * Fetches the existing micro service definitions from the root schema. Root schema being the one that does not
     * belong to a specific micro service, but instead to our own application itself.
     *
     * @return {Promise.<T>} Resolves if the records were queried successfully, rejects if anythign went wrong.
     * @private
     *
     * @since 1.0.0
     */
    _getMicroServicesFromDb() {
        return this._entityManager.findAll('micro_service').catch((error) => {
            const exception = new Error(`IllegalStateError: Failed to query IoT Microservices from database.`);
            exception.cause = error;
            throw exception;
        });
    }

    /**
     * Sets up all the connections to all the micro-services based on what's found in the database.
     *
     * @param microServiceDbRecordList
     * @return {Promise.<>} Resolves when all MicroServices have had their queues and database schemas created/
     * connected to/allocated/etc. If any of them has failed, the promise will be rejected with further information
     * about the issue.
     *
     * @private
     *
     * @throws {Error} If the provided parameter (first one) is not an array.
     *
     * @since 1.0.0
     */
    _establishMicroServiceConnections(microServiceDbRecordList) {

        console.log('IotQuickstart - establishing connections (db, queue) ...', microServiceDbRecordList);

        check.assert.array(microServiceDbRecordList, 'IllegalArg: Expected an array of MicroService records.');

        return new Promise((resolve, reject) => {

            const microServicesEstablished = microServiceDbRecordList.map((microServiceDbRecord) => {
                return this._createDbSchemaIfNotExists(microServiceDbRecord)
                    .then(() => this._establishQueueConnection(microServiceDbRecord));
            });

            Promise.all(microServicesEstablished)
                .then(resolve)
                .catch((err) => {
                    const ex = new Error(`One/more MicroServices could not be allocated (queue,db): ${err && err.message}`);
                    ex.cause = err;
                    reject(ex);
                });
        })
            .then(() => console.log('IotQuickstart - established connections (db, queue) OK'));
    }

    /**
     * Subscribes to the queue of the MicroService and initiates the database insertion task (so that all queue items
     * eventually get shoveled into the database).
     *
     * @param microServiceDbRecord The database record representing the micro service. Used for obtaining the queue name.
     *
     * @return {Promise.<string>}
     *
     * @private
     *
     * @since 1.0.0
     */
    _establishQueueConnection(microServiceDbRecord) {
        return new Promise((resolve, reject) => {

            check.assert.like(microServiceDbRecord, {queue_name: '', db_schema_name: '', code_name: ''},
                'IllegalArg: Expected parameter "microServiceDbRecord" to be a valid database record  of table "micro_service"');

            console.log(this._amqpConnection);

            const queueOptions = {autoDelete: false, durable: false, exclusive: false};

            this._amqpConnection.queue(microServiceDbRecord.queue_name, queueOptions, (aQueue) => {

                aQueue.subscribe((message, headers, deliveryInfo, messageObject) => {
                    console.log(`${deliveryInfo.routingKey} - ${message.data.toString()}`);

                    const eventDataJson = JSON.parse(message.data);

                    check.assert.like(eventDataJson, {"application_id": -1, "device_id": -1, "mac_address": ""},
                        `Invalid message, expected structure to have fields: "application_id","device_id","mac_address"`);

                    this._entityManager.insertEventData(microServiceDbRecord.db_schema_name, eventDataJson)
                        .catch((err) => {
                            // pointless to crash the application because of this, so we just log it and see ...
                            console.error(`Failed to persist message schema ${microServiceDbRecord.db_schema_name} `,
                                err, eventDataJson);
                        });

                });
                resolve(aQueue);
            });
        })
            .then(() => console.log(`Queue subscription for ${microServiceDbRecord.queue_name} OK`));
    }

    _createDbSchemaIfNotExists(microServiceDbRecord) {

        const dbSchemaName = microServiceDbRecord.db_schema_name;
        const dbUser = this._runtimeConfig.dbUser;

        return this._entityManager.createSchemaIfNotExists(dbSchemaName, dbUser)
            .then(() => console.log(`Schema of ${microServiceDbRecord.code_name}: OK`));
    }
}

module.exports = IotQuickstart;