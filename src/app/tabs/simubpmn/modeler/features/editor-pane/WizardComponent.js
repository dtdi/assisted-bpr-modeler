import {
  Dialog,
  DialogType,
  IconButton,
  getTheme,
  mergeStyleSets,
  FontWeights,
  Stack,
} from "@fluentui/react";
import React, { Component } from "react";
import { ModdleContext } from "./elements/context";

export default class WizardComponent extends Component {
  constructor(props) {
    super(props);
    this.wizardRef = React.createRef();
    this.footerRef = React.createRef();
  }

  render() {
    const { isOpen, onChange, onAction, modeling, context } = this.props;
    const { idea, wizard } = context;

    const Wizard = wizard.component;
    const WizardFooter = wizard.footer;

    return (
      <Dialog
        hidden={!isOpen}
        dialogContentProps={{
          type: DialogType.normal,
          title: idea.name,
        }}
        modalProps={{
          isBlocking: true,
          styles: { main: { minWidth: "700px !important", maxWidth: 800 } },
        }}
        onDismiss={() => {
          onAction("wizard-toggle");
        }}
      >
        <Wizard ref={this.wizardRef} {...this.props} />
        {WizardFooter && <WizardFooter ref={this.footerRef} {...this.props} />}
      </Dialog>
    );
  }
}
WizardComponent.contextType = ModdleContext;
