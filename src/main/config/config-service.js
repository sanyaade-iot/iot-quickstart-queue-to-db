const commandLineArgs = require('command-line-args');

const RuntimeConfig = require('./runtime-config');

/**
 * Responsible for extracting runtime configuration values from the Operating System's environment variables and/or
 * the process arguments.
 *
 * Created by peter.somogyvari on 25/11/2016.
 * @since 1.0.0
 */
class ConfigService {

    /**
     * Returns the contract between the process of our application and the shell it was started from (e.g. command line
     * arguments).
     *
     * @returns {[*]} The array of various options that can be issued when launching the application from the terminal.
     *
     * @since 1.0.0
     */
    static getCommandLineInterfaceDefinition() {

        return [

            // database credential parameters
            {name: 'db-host', alias: 'h', type: String, defaultValue: null},
            {name: 'db-port', alias: 'p', type: Number, defaultValue: -1},
            {name: 'db-user', alias: 'u', type: String, defaultValue: null},
            {name: 'db-password', alias: 'k', type: String, defaultValue: null},

            // database schema
            {name: 'db-schema', alias: 's', type: String, defaultValue: null},

            // queue credential parameters
            {name: 'queue-host', alias: 'H', type: String, defaultValue: null},
            {name: 'queue-port', alias: 'P', type: Number, defaultValue: -1},
            {name: 'queue-user', alias: 'U', type: String, defaultValue: null},
            {name: 'queue-password', alias: 'K', type: String, defaultValue: null},
        ];
    }

    /**
     * Parses the Operating System's environment variables in order to produce a {@code RuntimeConfig} instance.
     *
     * @return {RuntimeConfig} The configuration values dynamically determined at runtime.
     *
     * @throws {Error} If the environment variables do not contain any one of the madnatory runtime configuration
     * parameters:
     * process.env.IOT_QUICKSTART_DB_HOST,
     * process.env.IOT_QUICKSTART_DB_PORT,
     * process.env.IOT_QUICKSTART_DB_USER,
     * process.env.IOT_QUICKSTART_DB_PASSWORD,
     * process.env.IOT_QUICKSTART_DB_SCHEMA,
     * process.env.IOT_QUICKSTART_QUEUE_HOST,
     * process.env.IOT_QUICKSTART_QUEUE_PORT,
     * process.env.IOT_QUICKSTART_QUEUE_USER,
     * process.env.IOT_QUICKSTART_QUEUE_PASSWORD,
     *
     * @since 1.0.0
     */
    static parseFromOsEnvironment() {

        return new RuntimeConfig(
            process.env.IOT_QUICKSTART_DB_HOST,
            process.env.IOT_QUICKSTART_DB_PORT,
            process.env.IOT_QUICKSTART_DB_USER,
            process.env.IOT_QUICKSTART_DB_PASSWORD,

            process.env.IOT_QUICKSTART_DB_SCHEMA,

            process.env.IOT_QUICKSTART_QUEUE_HOST,
            process.env.IOT_QUICKSTART_QUEUE_PORT,
            process.env.IOT_QUICKSTART_QUEUE_USER,
            process.env.IOT_QUICKSTART_QUEUE_PASSWORD
        );
    }

    /**
     * Parses the Operating System's environment variables and the command line arguments in order to produce a
     * {@code RuntimeConfig} instance.
     *
     * The environment variables take precedence, and if not defined, then the matching command line argument takes
     * it's place.
     *
     * @return {RuntimeConfig} The {@code RuntimeConfig} object that holds all dynamically determined parameters for
     * the application.
     *
     * @throws [Error} If any of the mandatory parameters are not specified in the environment variables nor in the
     * command line arguments.
     *
     * @since 1.0.0
     */
    static parseFromOsEnvAndProcessArgs() {

        const commandLineInterfaceDefinition = ConfigService.getCommandLineInterfaceDefinition();
        const cli = commandLineArgs(commandLineInterfaceDefinition);
        console.log('CLI: ', cli.toString());

        // FIXME - Peter - implement the CLI contract as well ...
        return new RuntimeConfig(
            process.env.IOT_QUICKSTART_DB_HOST,
            parseInt(process.env.IOT_QUICKSTART_DB_PORT, 10),
            process.env.IOT_QUICKSTART_DB_USER,
            process.env.IOT_QUICKSTART_DB_PASSWORD,

            process.env.IOT_QUICKSTART_DB_SCHEMA,

            process.env.IOT_QUICKSTART_QUEUE_HOST,
            parseInt(process.env.IOT_QUICKSTART_QUEUE_PORT, 10),
            process.env.IOT_QUICKSTART_QUEUE_USER,
            process.env.IOT_QUICKSTART_QUEUE_PASSWORD
        );
    }
}

module.exports = ConfigService;