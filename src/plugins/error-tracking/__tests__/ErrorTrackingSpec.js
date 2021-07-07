/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import React from 'react';

import { shallow } from 'enzyme';

import Flags, { SENTRY_DSN, DISABLE_REMOTE_INTERACTION } from '../../../util/Flags';
import Metadata from '../../../util/Metadata';

import ErrorTracking from '../ErrorTracking';

describe('<ErrorTracking>', () => {

  afterEach(() => {
    Flags.reset();
    Metadata.init({});
  });


  it('should render', () => {

    shallow(<ErrorTracking />);
  });


  it('should not initialize if Sentry DSN not set', async () => {

    // given
    const initializeSentry = sinon.spy();

    const instance = createErrorTracking({ initializeSentry });

    // when
    await instance.componentDidMount();

    // then
    expect(initializeSentry).to.not.have.been.called;
  });


  it('should not initialize if Privacy Preferences not set', async () => {

    // given
    const initializeSentry = sinon.spy();

    const instance = createErrorTracking({ initializeSentry, dsn: 'TEST_DSN' });

    // when
    await instance.componentDidMount();

    // then
    expect(initializeSentry).to.not.have.been.called;
  });


  it('should not initialize if Error Tracking not enabled', async () => {

    // given
    const initializeSentry = sinon.spy();

    const instance = createErrorTracking({
      initializeSentry, dsn: 'TEST_DSN',
      configValues: { 'editor.privacyPreferences': { ENABLE_CRASH_REPORTS: false } }
    });

    // when
    await instance.componentDidMount();

    // then
    expect(initializeSentry).to.not.have.been.called;
  });


  it('should initialize', async () => {

    // given
    const initializeSentry = sinon.spy();

    const instance = createErrorTracking({
      initializeSentry,
      dsn: 'TEST_DSN',
      configValues: { 'editor.privacyPreferences': { ENABLE_CRASH_REPORTS: true } }
    });

    // when
    await instance.componentDidMount();

    // then
    expect(initializeSentry).to.have.been.called;
  });


  it('should use sentry-dsn flag', async () => {

    // given
    Flags.init({
      [ SENTRY_DSN ]: 'custom-sentry-dsn'
    });

    // when
    const instance = createErrorTracking();

    // then
    expect(instance.SENTRY_DSN).to.eql('custom-sentry-dsn');
  });


  it('should not initialize if DISABLE_REMOTE_INTERACTION flag is set', async () => {

    // given
    Flags.init({
      [ DISABLE_REMOTE_INTERACTION ]: true
    });

    const initializeSentry = sinon.spy();

    const instance = createErrorTracking({
      initializeSentry,
      dsn: 'TEST_DSN',
      configValues: { 'editor.privacyPreferences': { ENABLE_CRASH_REPORTS: true } }
    });

    // when
    await instance.componentDidMount();

    // then
    expect(initializeSentry).to.not.have.been.called;

  });


  it('should not schedule check if DISABLE_REMOTE_INTERACTION flag is set', async () => {

    // given
    Flags.init({
      [ DISABLE_REMOTE_INTERACTION ]: true
    });

    const scheduleCheck = sinon.spy();

    const instance = createErrorTracking({ scheduleCheck });

    // when
    await instance.componentDidMount();

    // then
    expect(scheduleCheck).to.not.have.been.called;
  });


  it('should initialize sentry with dsn and release', async () => {

    // given
    Metadata.init({ version: '3.5.0' });

    const sentryInitSpy = sinon.spy();

    const instance = createErrorTracking({
      sentryInitSpy,
      dsn: 'TEST_DSN',
      configValues: { 'editor.privacyPreferences': { ENABLE_CRASH_REPORTS: true } }
    });

    // when
    await instance.componentDidMount();

    const args = sentryInitSpy.getCall(0).args;

    // then
    expect(args).to.have.length(1);

    expect(args[0].dsn).to.eql('TEST_DSN');
    expect(args[0].release).to.eql('3.5.0');
    expect(args[0].beforeSend).to.exist;
  });


  it('should configure Sentry scope', async () => {

    // given
    const setTagSpy = sinon.spy();

    const instance = createErrorTracking({
      setTagSpy,
      dsn: 'TEST_DSN',
      configValues: {
        'editor.privacyPreferences': { ENABLE_CRASH_REPORTS: true },
        'editor.id': 'TEST_EDITOR_ID'
      }
    });

    // when
    await instance.componentDidMount();

    // then
    expect(setTagSpy).to.have.been.calledWith({
      key: 'editor-id',
      value: 'TEST_EDITOR_ID'
    });
  });


  it('should subscribe to app.error-handled event on initialization', async () => {

    // given
    const subscribeSpy = sinon.spy();

    const instance = createErrorTracking({
      subscribeSpy,
      dsn: 'TEST_DSN',
      configValues: { 'editor.privacyPreferences': { ENABLE_CRASH_REPORTS: true } }
    });

    // when
    await instance.componentDidMount();

    // then
    expect(subscribeSpy).to.have.been.calledWith('app.error-handled');
  });


  it('should capture exceptions', async () => {

    // given
    const handledError = new Error('THIS IS HANDLED');

    const sentryCaptureExceptionSpy = sinon.spy();
    const subscribeSpy = sinon.spy();

    const instance = createErrorTracking({
      sentryCaptureExceptionSpy,
      subscribeSpy,
      dsn: 'TEST_DSN',
      configValues: { 'editor.privacyPreferences': { ENABLE_CRASH_REPORTS: true } }
    });

    // when
    await instance.componentDidMount();

    const callback = subscribeSpy.getCall(1).args[1];

    callback(handledError);

    // then
    expect(sentryCaptureExceptionSpy).to.have.been.calledWith(handledError);
  });


  it('should initialize after user enables error tracking', async () => {

    // given
    let areCrashReportsEnabled = false;

    const backendSendSpy = sinon.spy();
    const initializeSentrySpy = sinon.spy();

    const instance = createErrorTracking({
      backendSendSpy,
      initializeSentry: initializeSentrySpy,
      keepScheduleAsItIs: true,
      overrideScheduleTime: 10,
      dsn: 'TEST_DSN',
      configGet: (key) => {
        return new Promise((resolve) => {
          if (key === 'editor.privacyPreferences') {
            return resolve({
              ENABLE_CRASH_REPORTS: areCrashReportsEnabled
            });
          }

          return resolve('test');
        });
      }
    });

    // when
    await instance.componentDidMount();
    expect(initializeSentrySpy).to.not.have.been.called;

    areCrashReportsEnabled = true;

    await instance.handlePrivacyPreferencesChanged();

    // then
    expect(initializeSentrySpy).to.have.been.called;
    expect(backendSendSpy).to.have.been.calledWith('errorTracking:turnedOn');
  });


  it('should close Sentry after user disables error tracking', async () => {

    // given
    let areCrashReportsEnabled = true;

    const backendSendSpy = sinon.spy();
    const sentryCloseSpy = sinon.spy();

    const instance = createErrorTracking({
      backendSendSpy,
      sentryCloseSpy,
      keepScheduleAsItIs: true,
      overrideScheduleTime: 10,
      dsn: 'TEST_DSN',
      configGet: (key) => {
        return new Promise((resolve) => {
          if (key === 'editor.privacyPreferences') {
            return resolve({
              ENABLE_CRASH_REPORTS: areCrashReportsEnabled
            });
          }

          return resolve('test');
        });
      }
    });

    // when
    await instance.componentDidMount();

    expect(sentryCloseSpy).to.not.have.been.called;

    areCrashReportsEnabled = false;

    await instance.handlePrivacyPreferencesChanged();

    // then
    expect(sentryCloseSpy).to.have.been.called;
    expect(backendSendSpy).to.have.been.calledWith('errorTracking:turnedOff');
  });


  it('should attach plugins to scope', async () => {

    // given
    const setTagSpy = sinon.spy();
    const plugins = [
      { name: 'test' },
      { name: 'foo' }
    ];

    const instance = createErrorTracking({
      plugins,
      setTagSpy,
      dsn: 'TEST_DSN',
      configValues: { 'editor.privacyPreferences': { ENABLE_CRASH_REPORTS: true } }
    });

    // when
    await instance.componentDidMount();

    // then
    expect(setTagSpy).to.have.been.calledWith(
      { key: 'plugins', value: 'test,foo' }
    );
  });


  it('should attach <none> as plugins tag to scope', async () => {

    // given
    const setTagSpy = sinon.spy();
    const plugins = [];

    const instance = createErrorTracking({
      plugins,
      setTagSpy,
      dsn: 'TEST_DSN',
      configValues: { 'editor.privacyPreferences': { ENABLE_CRASH_REPORTS: true } }
    });

    // when
    await instance.componentDidMount();

    // then
    expect(setTagSpy).to.have.been.calledWith(
      { key: 'plugins', value: 'none' }
    );
  });


  describe('Path normalization', () => {

    it('should normalize Windows paths', () => {

      return expectNormalization('/C:/Users/user/test-user/Desktop/Camunda/resources/app.asar/public/');
    });


    it('should normalize Windows paths with backslash', () => {

      return expectNormalization('C:\\Users\\user\\test-user\\Desktop\\Camunda\\resources\\app.asar\\public\\');
    });


    it('should normalize Linux paths', () => {

      return expectNormalization('/home/testuser/Aplications/camunda-modeler-4.0.0-linux-x64/resources/app.asar/public/');
    });


    it('should normalize Mac paths', () => {

      return expectNormalization('/Applications/Camunda Modeler.app/Contents/Resources/app.asar/public/');
    });


    it('should normalize dev paths', () => {

      return expectNormalization('webpack-internal:///./src/plugins/camunda-plugin/deployment-tool/');
    });
  });
});

async function expectNormalization(prefix) {

  // given
  const url = prefix + '2.2.js';

  const sentryInitSpy = sinon.spy();

  const instance = createErrorTracking({
    sentryInitSpy,
    dsn: 'TEST_DSN',
    configValues: { 'editor.privacyPreferences': { ENABLE_CRASH_REPORTS: true } }
  });

  // when
  await instance.componentDidMount();

  const args = sentryInitSpy.getCall(0).args;

  const { beforeSend } = args[0];

  let event = createMockSentryEvent(url);

  beforeSend(event);

  // then
  expect(event.request.url).to.eql('~/build/2.2.js');
  expect(event.exception.values[0].stacktrace.frames[0].filename).to.eql('~/build/2.2.js');
}

function createMockSentryEvent(path) {
  return {
    exception: {
      values: [
        {
          stacktrace: {
            frames: [
              {
                filename: path
              }
            ]
          }
        }
      ]
    },
    request: {
      url: 'file://' + path
    }
  };
}

function createErrorTracking(props={}) {

  const configValues = props.configValues || {};

  const _getGlobal = name => {
    if (name === 'backend') {
      return {
        send: (key) => {
          if (props.backendSendSpy) {
            props.backendSendSpy(key);
          }
        }
      };
    } else if (name === 'plugins') {
      return {
        getAppPlugins() {
          return props.plugins || [];
        }
      };
    }
  };

  const subscribe = (key, callback) => {
    if (props.subscribeSpy) {
      props.subscribeSpy(key, callback);
    }
  };

  const instance = new ErrorTracking(
    {
      _getGlobal,
      subscribe,
      config: {
        get: (key) => {

          if (props.configGet) {
            return props.configGet(key);
          }

          return new Promise((resolve) => {
            resolve(configValues[key] || null);
          });
        }
      }
    }
  );

  if (!props.keepScheduleAsItIs) {
    instance.scheduleCheck = props.scheduleCheck || function() {};
  }

  instance.initializeSentry = props.initializeSentry || instance.initializeSentry;

  instance.SENTRY_DSN = props.dsn || instance.SENTRY_DSN;

  instance.SCHEDULE_TIME = props.overrideScheduleTime || instance.SCHEDULE_TIME;

  instance._sentry = {
    init: (initParam) => {
      if (props.sentryInitSpy) {
        props.sentryInitSpy(initParam);
      }
    },
    configureScope: (fn) => {
      fn({
        setTag: (key, value) => {
          if (props.setTagSpy) {
            props.setTagSpy({ key, value });
          }
        }
      });
    },
    captureException: (err) => {
      if (props.sentryCaptureExceptionSpy) {
        props.sentryCaptureExceptionSpy(err);
      }
    },
    close: () => {
      if (props.sentryCloseSpy) {
        props.sentryCloseSpy();
      }
    }
  };

  return instance;
}
