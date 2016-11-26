const check = require('check-types');

/**
 * FIXME - Peter - Stop hardcoding SQL templates in code, a separate file would be better for storing these.
 *
 * Responsible for abstracting data operations (SQL statmeents, queries) for the database.
 * Immutable by design, arguments passed in to the constructor cannot be changed on the object later.
 *
 * @author Peter (Somogyvari) Metz <peter.metz@unarin.com>
 *
 * @since 1.0.0
 */
class EntityManager {

    /**
     * Returns with the generic SQL statement that can be used for querying all fields of a given table (entity.
     *
     * @return {string} The SQL statement as a string.
     *
     * @since 1.0.0
     */
    static getFindAllQueryTemplate() {
        // FIXME - Peter - use parameterized queries/named statements otherwise we are open to SQL injection attacks.
        return 'SELECT * FROM ';
    }

    /**
     * Returns with an SQL statement that (upon execution) creates the "event_data" table if it didn'texist before.
     *
     * @param schemaName The schema where the table will be created. Mandatory parameter.
     *
     * @return {string} The compiled SQL string, matching the passed in schema.
     *
     * @throws {Error} If the mandatory arguments are not specified of blank.
     *
     * @since 1.0.0
     */
    static getCreateEventDataTableTemplate(schemaName) {

        check.assert.nonEmptyString(schemaName, `IllegalArg: parameter "schemaName" expected to be non-blank string, 
            got: ${schemaName} instead...`);

        return `CREATE TABLE IF NOT EXISTS ${schemaName}.event_data
            (
                id SERIAL NOT NULL PRIMARY KEY,
                application_id integer,
                device_id integer,
                mac_address character varying(512) COLLATE pg_catalog."default"
            );`
    }

    /**
     * Compiles an SQL statement (tested with PostgreSQL only) that creates a database with the specified owner from
     * the {@code RuntimeConfig}.
     *
     * @param {string} schemaName The name of the database that will be created.
     * @param {string} dbUser The database user's name who will own the newly created schema.
     * @return {string} The compiled SQL statement that is ready to be executed against the database.
     *
     * @throws {Error} If any of the input parameters are blank.
     *
     * @since 1.0.0
     */
    static getCreateSchemaIfNotExistsStatementTemplate(schemaName, dbUser) {

        check.assert.nonEmptyString(schemaName, `IllegalArg: parameter "schemaName" expected to be non-blank string, 
            got: ${schemaName} instead...`);

        check.assert.nonEmptyString(dbUser, `IllegalArg: parameter "dbUser" expected to be non-blank string, 
            got:${dbUser} instead...`);

        return `CREATE SCHEMA IF NOT EXISTS ${schemaName} AUTHORIZATION ${dbUser};`;
    }

    /**
     * Side-effect free constructor used to set the private members based on the parameters.
     *
     * @param {pg.Client} pgClient The database connection to be used while performing queries/statements. Expected to be already
     * connected and functioning without errors.
     *
     * @throws {Error} If any of the parameters are {@code null} or {@code undefined}
     *
     * @since 1.0.0
     */
    constructor(pgClient) {

        check.assert.object(pgClient, 'IllegalArg: Expected parameter "connection" to be an objedct.');
        this._pgClient = pgClient;
    }

    /**
     * Queries and returns all records with all columns of the specified database table (entity).
     *
     * This method does not throw runtime exceptions under any circumstance, as long as the NodeJS version supports
     * Ecmascript 6 promises.
     *
     * @param {String} entityName The name of the database table to query. This will be used as an argument for an
     * SQL prepared statement. Expected to be a non-blank string, and to be a name of an existing table. Mandatory.
     *
     * @returns {Promise} Resolves with the database query results or rejects with the error sent by the database in
     * case the query failed. Also rejects if the input parameters are not valid.
     *
     * @since 1.0.0
     */
    findAll(entityName) {
        return new Promise((resolve, reject) => {

            const queryString = EntityManager.getFindAllQueryTemplate() + entityName;

            this._pgClient.query(queryString, [], (err, results) => {
                if (err) {
                    reject({message: `EntityManager.findAll() failed to execute query: "${queryString}"`, cause: err});
                } else {
                    resolve(results);
                }
            });
        });
    }

    /**
     * FIXME - Peter - stop with the arrow programming, use a Promise/Stream based database client library instead ...
     *
     * Initializes the database schema for a specific user and with a specific name. If the schama already exists,
     * then this is a no-op.
     *
     * @param schemaName The name of the database schema that will be created.
     *
     * @param {String} dbUser The name of the database user who will own the newly created schema. Only used if the
     * schema doesn't exist already. Otherwise ignored. Mandatory parameter.
     *
     * @return {Promise} Resolves if the schema creation was successful, or if the schema already existed. Rejected if
     * anything went wrong while creating the schema or determinig if it was already in existence.
     *
     * @since 1.0.0
     */
    createSchemaIfNotExists(schemaName, dbUser) {
        return new Promise((resolve, reject) => {

            const sqlCreateSchema = EntityManager.getCreateSchemaIfNotExistsStatementTemplate(schemaName, dbUser);

            // create the schema
            this._pgClient.query(sqlCreateSchema, [], (err, schemaResults) => {
                if (err) {
                    reject({
                        message: `EntityManager.createSchemaIfNotExists() failed: "${sqlCreateSchema}"`,
                        cause: err
                    });
                } else {

                    // create the table (if the schema init went okay)
                    const sqlCreateEventDataTable = EntityManager.getCreateEventDataTableTemplate(schemaName);

                    this._pgClient.query(sqlCreateEventDataTable, [], (err, tableResults) => {
                        if (err) {
                            reject({
                                message: `EntityManager.createSchemaIfNotExists() failed: "${sqlCreateEventDataTable}"`,
                                cause: err
                            });
                        } else {
                            resolve({schemaResults: schemaResults, tableResults: tableResults});
                        }
                    });
                }
            });
        });
    }


    insertEventData(schemaName, eventDataObject) {
        return new Promise((resolve, reject) => {

            const sqlInsertEventData = `INSERT INTO ${schemaName}.event_data
                                        (application_id, device_id, mac_address)
                                        VALUES ($1, $2, $3);`;

            const eventDataAsArray = [eventDataObject.application_id, eventDataObject.device_id, eventDataObject.mac_address];

            this._pgClient.query(sqlInsertEventData, eventDataAsArray, (err, insertResults) => {
                if (err) {
                    reject({
                        message: `EntityManager.insertEventData() failed: "${sqlInsertEventData}"`,
                        cause: err
                    });
                } else {
                    resolve(insertResults);
                }
            });
        });
    }

}

module.exports = EntityManager;