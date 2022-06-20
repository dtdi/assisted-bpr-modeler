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

import { Overlay, Section } from "../../shared/ui";

import { ReportFeedbackSystemInfoSection } from "./ReportFeedbackSystemInfoSection";

import css from "./ReportFeedbackOverlay.less";

const REPORT_ISSUE_LINK =
  "https://github.com/dtdi/assisted-bpr-modeler/issues/new/choose";
const USER_FORUM_LINK =
  "https://forum.camunda.io/c/modeler/?utm_source=modeler&utm_medium=referral";

const OFFSET = { right: 0 };

export function ReportFeedbackOverlay(props) {
  return (
    <Overlay
      anchor={props.anchor}
      onClose={props.onClose}
      maxHeight="calc(100vh - 250px)"
      offset={OFFSET}
      className={css.ReportFeedbackOverlay}
    >
      <ReportFeedbackChannelsSection onClose={props.onClose} />

      <ReportFeedbackSystemInfoSection onSubmit={props.onSubmit} />
    </Overlay>
  );
}

function ReportFeedbackChannelsSection(props) {
  const { onClose } = props;

  return (
    <Section>
      <Section.Header>Your feedback is welcome</Section.Header>
      <Section.Body>
        <p>
          Have you found an issue or would like to send a feature request?
          <br />
          <a onClick={onClose} href={REPORT_ISSUE_LINK}>
            Report an issue on GitHub
          </a>
        </p>
      </Section.Body>
    </Section>
  );
}
