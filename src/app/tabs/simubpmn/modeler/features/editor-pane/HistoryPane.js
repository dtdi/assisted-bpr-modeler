import { assign, map, groupBy, forEach, filter, isFunction } from "min-dash";
import { getNiceNamesFromContext } from "../../../util/BsimUtil";

import {
  Stack,
  mergeStyleSets,
  DialogType,
  DocumentCard,
  DocumentCardLocation,
  DocumentCardActions,
  DocumentCardPreview,
  DocumentCardTitle,
  DocumentCardActivity,
  DocumentCardLogo,
  DocumentCardStatus,
  DocumentCardDetails,
} from "@fluentui/react";
import React, { Component } from "react";
import CommitStashFinalize from "./CommitStashFinalize";

export default class HistoryPane extends Component {
  constructor(props) {
    super(props);
    //const state = this._getListItems(props.stack, props.stackIdxInit);
    //state.hideDialog = true;
    this.state = {};
  }

  styles = mergeStyleSets({});

  onBeforeRevert = (ev, fn) => {
    if (this.state.isDirty) {
      this.setState({
        hideDialog: false,
        dialogContentProps: {
          type: DialogType.normal,
          title: "Revert Redesign",
          subText:
            "Do you want to revert your changes to the redesign implementation?",
        },
      });
    } else {
      fn();
    }
  };

  toggleHideDialog = (ev, fn) => {
    this.setState({
      hideDialog: true,
    });
    if (isFunction(fn)) {
      fn();
    }
  };

  render() {
    const { stack, onAction, context } = this.props;

    const onActionClick = (action, ev) => {
      console.log(`You clicked the ${action} action`);
      ev.stopPropagation();
      ev.preventDefault();
    };

    const documentCardActions = [
      {
        iconProps: { iconName: "Undo" },
        onClick: onActionClick.bind(this, "undo"),
        ariaLabel: "undo redesign",
      },
    ];

    return (
      <Stack horizontalAlign="center" tokens={{ childrenGap: 12, padding: 8 }}>
        {stack &&
          stack._stack?.map((redesign) => (
            <DocumentCard key={redesign.id} styles={{ root: { width: 350 } }}>
              <DocumentCardLocation location="" />
              <DocumentCardDetails>
                <DocumentCardTitle title={redesign.context.idea.name} />
                <DocumentCardStatus status={redesign.context?.commitMessage} />
                <DocumentCardActivity
                  people={[]}
                  activity={redesign.context?.commitMessage}
                />
              </DocumentCardDetails>

              <DocumentCardActions actions={documentCardActions} />
            </DocumentCard>
          ))}
      </Stack>
    );
  }
}
