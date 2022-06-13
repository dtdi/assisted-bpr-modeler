import { isFunction } from "min-dash";

import {
  Stack,
  mergeStyleSets,
  DetailsList,
  Text,
  Icon,
} from "@fluentui/react";
import React, { Component } from "react";
import CommitStashFinalize from "./CommitStashFinalize";

export default class EvaluationPane extends Component {
  constructor(props) {
    super(props);
    //const state = this._getListItems(props.stack, props.stackIdxInit);
    //state.hideDialog = true;
    this.state = {};
  }

  classNames = mergeStyleSets({
    icon: {
      verticalAlign: "middle",
      maxHeight: "12px",
      maxWidth: "12px",
      marginRight: "8px",
    },
    good: {
      color: "#6bb700",
    },
    neutral: {
      color: "#8a8886",
    },
    critical: {
      color: "#ffaa44",
    },
    error: {
      color: "#c50f1f",
    },
  });

  toggleHideDialog = (ev, fn) => {
    this.setState({
      hideDialog: true,
    });
    if (isFunction(fn)) {
      fn();
    }
  };

  getIcon = (semantic) => {
    switch (semantic) {
      case "good":
        return "Down";
      case "neutral":
        return "ArrowDownRight8";
      case "critical":
        return "ArrowUpRight8";
      case "error":
        return "Up";
    }
  };

  getColumns = (isBasic) => {
    if (!isBasic) {
      return [
        {
          key: "entity",
          name: "KPI",
          fieldName: "niceName",
          minWidth: 30,
          maxWidth: 70,
          isResizable: true,
        },

        {
          key: "value1",
          name: "Current Model",
          fieldName: "valueNice_baseline",

          minWidth: 50,
          maxWidth: 100,
        },
        {
          key: "value2",
          name: "SIMULATION",
          fieldName: "valueNice_simulation",
          minWidth: 50,
          maxWidth: 100,
        },
        {
          key: "delate",
          name: "DIFF.",
          fieldName: "diffNice",
          minWidth: 100,
          maxWidth: 150,
          onRender: (item) => (
            <span className={this.classNames[item.changeSemantic]}>
              <Icon
                className={this.classNames.icon}
                iconName={this.getIcon(item.changeSemantic)}
              />{" "}
              <Text>{item.diffNice}</Text>
            </span>
          ),
        },
      ];
    } else {
      return [
        {
          key: "entity",
          name: "KPI",
          fieldName: "niceName",
          minWidth: 100,
          maxWidth: 200,
          isResizable: true,
        },

        {
          key: "value1",
          name: "AC",
          fieldName: "valueNice_baseline",

          minWidth: 100,
          maxWidth: 200,
        },
      ];
    }
  };

  render() {
    const { onAction, simuPerf } = this.props;

    return (
      <Stack tokens={{ childrenGap: 12, padding: 8 }}>
        <CommitStashFinalize {...this.props} />
        {simuPerf && (
          <DetailsList
            items={simuPerf.values || []}
            selectionMode={0}
            groupProps={{
              showEmptyGroups: true,
              isAllGroupsCollapsed: true,
            }}
            groups={simuPerf.groups || []}
            columns={this.getColumns(!simuPerf.simulation)}
            compact
          />
        )}
      </Stack>
    );
  }
}
