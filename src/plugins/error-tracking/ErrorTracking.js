/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import debug from 'debug';

import { PureComponent } from 'react';

import * as Sentry from '@sentry/browser';

import Metadata from '../../util/Metadata';

import Flags, { SENTRY_DSN, DISABLE_REMOTE_INTERACTION } from '../../util/Flags';

const PRIVACY_PREFERENCES_CONFIG_KEY = 'editor.privacyPreferences';
const EDITOR_ID_CONFIG_KEY = 'editor.id';
const CRASH_REPORTS_CONFIG_KEY = 'ENABLE_CRASH_REPORTS';
const NON_EXISTENT_EDITOR_ID = 'NON_EXISTENT_EDITOR_ID';

const log = debug('ErrorTracking');

// DSN is set to our CI provider as an env variable, passed to client via WebPack DefinePlugin
const DEFINED_SENTRY_DSN = process.env.SENTRY_DSN;

const NONE_TAG = 'none';

export default class ErrorTracking extends PureComponent {

  constructor(props) {
    super(props);

    // SENTRY_DSN flag is useful for development.
    this.SENTRY_DSN = Flags.get(SENTRY_DSN) || DEFINED_SENTRY_DSN;

    // Setting this here so that we can mock later if necessary.
    this._sentry = Sentry;

    this._isInitialized = false;
  }

  async componentDidMount() {

    // check scheduling
    if (!Flags.get(DISABLE_REMOTE_INTERACTION)) {

      // If remote interaction is not disabled via flags:
      // -> The user may turn on / off error reporting on the run
      // -> The user may never actually restart the modeler.
      this.props.subscribe('privacy-preferences.changed', this.handlePrivacyPreferencesChanged);
    }

    // initialization
    const { result, msg } = await this.canInitializeSentry();

    if (!result) {

      return log('Cannot initialize: ' + msg);
    }

    this.initializeSentry();
  }

  async initializeSentry() {

    const { config, _getGlobal } = this.props;

    const editorID = await config.get(EDITOR_ID_CONFIG_KEY) || NON_EXISTENT_EDITOR_ID;

    const releaseTag = Metadata.data.version;

    try {

      // Source map uploaded to Sentry from WebPack is tagged with the
      // version number in package.json which is supposed to be the same
      // with Metadata.data.version (except for dev environments
      // - we don't initialize dev in Sentry.)
      this._sentry.init({
        dsn: this.SENTRY_DSN,
        release: releaseTag,
        beforeSend: (event) => {

          // We need to normalize the event path to match with uploaded sourcemaps.
          // Since we're distributing the app to the clients, every exception
          // has a different path. That's why if we skip this step, we'd have
          // unmeaningful exceptions in Sentry.
          // See this: https://github.com/camunda/camunda-modeler/issues/1831
          return this.normalizeEventPath(event);
        }
      });

      // OS information already exists by default in Sentry.
      // We'll set editor ID and Camunda Modeler version.
      this._sentry.configureScope(scope => { scope.setTag('editor-id', editorID); });

      // add plugins information
      const plugins = _getGlobal('plugins').getAppPlugins();
      this._sentry.configureScope(scope => {
        scope.setTag('plugins', generatePluginsTag(plugins));
      });

      const { subscribe } = this.props;

      // Send handled errors to Sentry.
      subscribe('app.error-handled', (error) => {
        if (!this._isInitialized) {
          return;
        }

        this._sentry.captureException(error);
      });

      log('Initialized');

      this._isInitialized = true;

    } catch (err) {

      log('Cannot initialize: ', err);
    }
  }

  closeSentry() {
    this._sentry.close();
    this._isInitialized = false;

    log('Closed Sentry.');
  }

  async canInitializeSentry() {

    if (Flags.get(DISABLE_REMOTE_INTERACTION)) {
      return {
        result: false,
        msg: 'Remote interaction disabled via flag.'
      };
    }

    if (!this.SENTRY_DSN) {
      return {
        result: false,
        msg: 'No DSN set.'
      };
    }

    const isCrashReportsEnabled = await this.isCrashReportsEnabled();

    if (!isCrashReportsEnabled) {

      return {
        result: false,
        msg: 'Crash reports are not enabled.'
      };
    }

    return { result: true };
  }

  async isCrashReportsEnabled() {
    const { config } = this.props;

    const privacyPreferences = await config.get(PRIVACY_PREFERENCES_CONFIG_KEY);

    return !!(privacyPreferences && privacyPreferences[CRASH_REPORTS_CONFIG_KEY]);
  }

  async recheckSentry() {
    const { result } = await this.canInitializeSentry();

    if (result !== this._isInitialized) {

      const { _getGlobal } = this.props;
      const backend = _getGlobal('backend');

      // Status has changed:
      // The user turned on / off Error Tracking option through
      // Privacy Preferences modal.
      if (result) {
        this.initializeSentry();

        backend.send('errorTracking:turnedOn');
      } else {
        this.closeSentry();

        backend.send('errorTracking:turnedOff');
      }
    }
  }

  handlePrivacyPreferencesChanged = () => {
    return this.recheckSentry();
  }

  normalizeEventPath = (event) => {
    try {
      const { exception, request } = event;
      const { values } = exception;

      if (request) {
        request.url = normalizeUrl(request.url);
      }

      values.forEach((exceptionVal) => {
        const { stacktrace } = exceptionVal;
        const { frames } = stacktrace;

        frames.forEach((frame) => {
          frame.filename = normalizeUrl(frame.filename);
        });
      });

      return event;
    } catch (err) {

      this.props.log(err);
      return null;
    }
  }

  render() {
    return null;
  }
}


// helpers ////////////////

function normalizeUrl(path) {

  // eslint-disable-next-line
  const filename = path.replace(/^.*[\\\/]/, '');
  return '~/build/' + filename;
}

function generatePluginsTag(plugins) {

  if (!plugins || !plugins.length) {
    return NONE_TAG;
  }

  return plugins.map(({ name }) => name).join(',');
}

