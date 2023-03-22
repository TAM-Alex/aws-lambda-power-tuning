'use strict';

const expect = require('expect.js'),
    utils = require('./utils'),
    payloads = require('./payloads');

payloads.init(process.env.FUNCTION_ARNS_S3);

const STACK_NAME = utils.buildStackName(process.env.STACK_NAME_S3),
    payloadSample = payloads.get('sample');

var stateMachineArn, cfnStack;

const asyncTestsSetup = [
    {payload: payloadSample, name: 'sample', status: 'SUCCEEDED'},
];

// this will start all the executions in parallel
// mocha doesn't allow this for tests in the same file
const fetchStackPromise = utils.fetchStackDetails(STACK_NAME);
fetchStackPromise.then((resp)=>{
    cfnStack = resp.stack;
    stateMachineArn = resp.stateMachine;
    asyncTestsSetup.forEach((test) => {
        test.promise = utils.startExecution(stateMachineArn, test.payload, test.name);
    });    
})


describe('S3 Stack', () => {

    // make sure  stack details are loaded
    // (while state machine executions have already started in parallel)
    beforeEach('fetch stack details', async() => {
        if (stateMachineArn) return;
        await fetchStackPromise;
    });

    it('should exist and be ready to use', async() => {
        expect(cfnStack).to.not.be(null);
        expect(cfnStack.StackStatus).to.be('CREATE_COMPLETE');
    });

    describe('State Machine', async() => {

        it('should have a valid ARN', async() => {
            expect(stateMachineArn.length).to.be.greaterThan(0);
        });

        utils.generateTests(asyncTestsSetup)
    });

});