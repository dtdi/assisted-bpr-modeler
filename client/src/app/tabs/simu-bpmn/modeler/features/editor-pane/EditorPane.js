import { forEach } from "min-dash";
import { getNiceNamesFromContext } from "../../../util/BsimUtil";

import { Stack, mergeStyleSets, DetailsList } from "@fluentui/react";
import React, { Component } from "react";
import CommitStashFinalize from "./CommitStashFinalize";

export default class EditorPane extends Component {
  constructor(props) {
    super(props);

    //const state = this._getListItems(props.stack, props.stackIdxInit);
    this.state = { listItems: [], isDirty: false };
  }

  _updateStackEntries() {
    const { context } = this.props;
    const { _initUid, commandStack } = context;
    let stackEntries = commandStack._stack.filter(
      (stackItem, idx) =>
        stackItem.id >= _initUid && idx <= commandStack._stackIdx
    );

    let uid_idx = -1;
    const listItems = [];
    stackEntries.forEach((stackEntry) => {
      if (uid_idx == stackEntry.id) return;

      uid_idx = stackEntry.id;
      listItems.push({
        key: stackEntry.id,
        command: stackEntry.id + " " + stackEntry.command,
        shapes: getNiceNamesFromContext(stackEntry.context),
      });
    });

    return listItems;
  }

  componentDidUpdate(oldProps, oldState) {}

  _columns = [
    {
      key: "column1",
      name: "Model Change",
      fieldName: "command",
      maxWidth: 150,
    },
    { key: "column2", name: "Elements", fieldName: "shapes", minWidth: 100 },
  ];

  styles = mergeStyleSets({});

  render() {
    const { context } = this.props;
    let listItems = [];
    if (context.status !== "committed") {
      listItems = this._updateStackEntries();
    }
    return (
      <Stack tokens={{ childrenGap: 12, padding: 8 }}>
        <CommitStashFinalize
          isDirty={context.status !== "committed" && listItems.length > 0}
          {...this.props}
        />

        {context.status !== "committed" && (
          <DetailsList
            compact={true}
            columns={this._columns}
            items={listItems}
          />
        )}
      </Stack>
    );
  }
}
