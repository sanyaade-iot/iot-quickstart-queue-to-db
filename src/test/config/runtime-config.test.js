/**
 * Created by peter.somogyvari on 25/11/2016.
 */
const chai = require('chai');
const expect = chai.expect; // we are using the "expect" style of Chai
const RuntimeConfig = require('./../../main/config/runtime-config');

const instantiateRuntimeConfigDbPortIsString = () => new RuntimeConfig('a', 'a', 'a', 'a', 'a', 'a', 5672, 'a', 'a');
const instantiateRuntimeConfigQueuePortIsString = () => new RuntimeConfig('a', 5432, 'a', 'a', 'a', 'a', 'a', 'a', 'a');

const instantiateRuntimeConfigDbHostIsBlankString = () => new RuntimeConfig('', 5432, 'a', 'a', 'a', 'a', 'a', 'a', 'a');
const instantiateRuntimeConfigDbUserIsBlankString = () => new RuntimeConfig('', 5432, 'a', 'a', 'a', 'a', 'a', 'a', 'a');

const instantiateRuntimeConfigQueueHostIsBlankString = () => new RuntimeConfig('a', 5432, 'a', 'a', 'a', '', 'a', 'a', 'a');
const instantiateRuntimeConfigQueueUserIsBlankString = () => new RuntimeConfig('a', 5432, 'a', 'a', 'a', 'a', 'a', '', 'a');

describe('RuntimeConfig', function () {

    it('constructor throws if db port is a string', function () {
        expect(instantiateRuntimeConfigDbPortIsString).to.throw(Error);
    });

    it('constructor throws if queue port is a string', function () {
        expect(instantiateRuntimeConfigQueuePortIsString).to.throw(Error);
    });

    it('constructor throws if db user is a blank string', function () {
        expect(instantiateRuntimeConfigDbUserIsBlankString).to.throw(Error);
    });

    it('constructor throws if db host is a blank string', function () {
        expect(instantiateRuntimeConfigDbHostIsBlankString).to.throw(Error);
    });

    it('constructor throws if queue host is a blank string', function () {
        expect(instantiateRuntimeConfigQueueHostIsBlankString).to.throw(Error);
    });

    it('constructor throws if queue user is a blank string', function () {
        expect(instantiateRuntimeConfigQueueUserIsBlankString).to.throw(Error);
    });
});