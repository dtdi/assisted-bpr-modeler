/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from "react";

import {
  OVERLAY_TITLE,
  SIMULATE,
  NEXT,
  CANCEL,
} from "./SimulatePluginConstants";

import { Formik } from "formik";

import { Overlay, Section } from "../../../shared/ui";

import css from "./SimulatePluginOverlay.less";

const CONNECTION_STATE = {
  INITIAL: "initial",
  INVALID_ENDPOINT: "invalidEndpoint",
  ERROR: "error",
  CONNECTED: "connected",
};

export default class SimulatePluginOverlay extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      connectionState: { type: CONNECTION_STATE.INITIAL },
      configValues: {},
    };
  }

  async componentDidMount() {}

  componentWillUnmount() {}

  setConnectionState(connectionState) {
    this.setState({ connectionState });
  }

  handleFormSubmit = async (values, { setSubmitting }) => {
    this.props.onSimulate(values);
  };

  handleCancel = async () => {
    this.props.onAbort();
  };

  render() {
    const { onClose: closeOverlay, config, isStart, anchor } = this.props;

    const onClose = () => closeOverlay(this.state.configValues, "cancel");

    return (
      <Overlay
        className={css.SimulatePluginOverlay}
        onClose={onClose}
        anchor={anchor}
      >
        <Formik
          initialValues={config}
          onSubmit={this.handleFormSubmit}
          validate={this.scheduleConnectionCheck}
          validateOnMount
        >
          {(form) => (
            <form onSubmit={form.handleSubmit}>
              <Section>
                <Section.Header> {OVERLAY_TITLE} </Section.Header>
                <Section.Body>
                  <fieldset className="fieldset"></fieldset>
                  <Section.Actions>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={form.isSubmitting}
                    >
                      {isStart ? NEXT : SIMULATE}
                    </button>
                    <button
                      onClick={this.handleCancel}
                      type="submit"
                      className="btn btn-primary"
                      disabled={form.isSubmitting}
                    >
                      {CANCEL}
                    </button>
                  </Section.Actions>
                </Section.Body>
              </Section>
            </form>
          )}
        </Formik>
      </Overlay>
    );
  }
}

// helper ////////
