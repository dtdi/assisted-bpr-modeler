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
  ],
  gatewayBehavior: ["type", GatewayBehavior],
  createBehavior: ["type", CreateBehavior],
  updateModdleBehavior: ["type", UpdateModdleBehavior],
  replaceElementBehavior: ["type", ReplaceElementBehavior],
  laneResourceBehavior: ["type", LaneResourceBehavior],
};
