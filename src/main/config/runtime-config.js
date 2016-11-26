const check = require('check-types');

/**
 * Represents all dynamic (only available at runtime) configuration used by the application to fulfil it's purpose.
 *
 * Immutable by design (as much as a class can be immutable in Javascript).
 *
 * Created by peter.somogyvari on 25/11/2016.
 * @since 1.0.0
 */
class RuntimeConfig {

    /**
     * Standard constructor without sid-effects, used for setting the members based on the parameters.
     *
     * All parameters are mandatory and if not provided will result in a throw.
     *
     * @param {string} dbHost The host of the database to connect to.
     * @param {number} dbPort The port of the database to connect to.
     * @param {string} dbUser The user name that will be used when connecting to the database.
     * @param {string} dbPassword The password that will be used when connecting to the database.
     * @param {string} dbSchema The schema name that will be used when connecting to the database.
     * @param {string} queueHost The hostname that will be used when connecting to the queue.
     * @param {number} queuePort The port number that will be used when connecting to the queue.
     * @param {string} queueUser The username that will be used when connecting to the queue.
     * @param {string} queuePassword The password that will be used when connecting to the queue.
     *
     * @throws TypeError If any of the parameters are {@code null} or {@code undefined} or otherwise do not match the
     * indicated types in their respective documentations.
     *
     * @since 1.0.0
     */
    constructor(dbHost, dbPort, dbUser, dbPassword, dbSchema, queueHost, queuePort, queueUser, queuePassword) {

        check.assert.nonEmptyString(dbHost, 'IllegalArg: dbHost must be a non-empty string to begin with.');
        check.assert.nonEmptyString(dbUser, 'IllegalArg: dbUser must be a non-empty string to begin with.');
        check.assert.nonEmptyString(dbPassword, 'IllegalArg: dbPassword must be a non-empty string to begin with.');
        check.assert.nonEmptyString(dbSchema, 'IllegalArg: dbSchema must be a non-empty string to begin with.');
        check.assert.nonEmptyString(queueHost, 'IllegalArg: queueHost must be a non-empty string to begin with.');
        check.assert.nonEmptyString(queueUser, 'IllegalArg: queueUser must be a non-empty string to begin with.');
        check.assert.nonEmptyString(queuePassword, 'IllegalArg: queuePassword must be a non-empty string to begin with.');

        check.assert.number(dbPort, 'IllegalArg: Expected a number as the db port number.');
        check.assert.number(queuePort, 'IllegalArg: Expected a number as the db port number.');

        check.assert.positive(dbPort, 'IllegalArg: Expected a positive number as the db port number.');
        check.assert.positive(queuePort, 'IllegalArg: Expected a positive number as the db port number.');

        check.assert.lessOrEqual(dbPort, 65535, 'IllegalArg: Expected a positive number below 65535 as the db port number.');
        check.assert.lessOrEqual(queuePort, 65535, 'IllegalArg: Expected a positive number below 65535 as the db port number.');

        this._dbHost = dbHost;
        this._dbPort = dbPort;
        this._dbUser = dbUser;
        this._dbPassword = dbPassword;
        this._dbSchema = dbSchema;
        this._queueHost = queueHost;
        this._queuePort = queuePort;
        this._queuePassword = queuePassword;
        this._queueUser = queueUser;
    }

    get dbHost() {
        return this._dbHost;
    }

    get dbPort() {
        return this._dbPort;
    }

    get dbUser() {
        return this._dbUser;
    }

    get dbPassword() {
        return this._dbPassword;
    }

    get dbSchema() {
        return this._dbSchema;
    }

    get queueHost() {
        return this._queueHost;
    }

    get queuePort() {
        return this._queuePort;
    }

    get queuePassword() {
        return this._queuePassword;
    }

    get queueUser() {
        return this._queueUser;
    }

}

module.exports = RuntimeConfig;