import UpdateInputOutputBehavior from "camunda-bpmn-js/lib/camunda-platform/features/modeling/behavior/UpdateInputOutputBehavior";
import CreateBehavior from "./CreateBehavior";
import GatewayBehavior from "./GatewayBehavior";
import LaneResourceBehavior from "./LaneResourceBehavior";
import ReplaceElementBehavior from "./ReplaceElementBehavior";
import UpdateModdleBehavior from "./UpdateModdleBehavior";

export default {
  __init__: [
    "createBehavior",
    "updateModdleBehavior",
    "gatewayBehavior",
    "replaceElementBehavior",
    "laneResourceBehavior",
    "inputOutputBehavior",
  ],
  gatewayBehavior: ["type", GatewayBehavior],
  createBehavior: ["type", CreateBehavior],
  updateModdleBehavior: ["type", UpdateModdleBehavior],
  replaceElementBehavior: ["type", ReplaceElementBehavior],
  laneResourceBehavior: ["type", LaneResourceBehavior],
  inputOutputBehavior: ["type", UpdateInputOutputBehavior],
};
