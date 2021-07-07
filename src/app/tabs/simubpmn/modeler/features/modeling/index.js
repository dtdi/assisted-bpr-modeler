import BehaviorModule from "./behavior";

import CommandModule from "diagram-js/lib/command";

import BsimFactory from "./BsimFactory";
import Modeling from "./Modeling";
import BsimRules from "../rules";

export default {
  __init__: ["modeling"],
  __depends__: [BehaviorModule, CommandModule, BsimRules],
  bsimFactory: ["type", BsimFactory],
  modeling: ["type", Modeling],
};
