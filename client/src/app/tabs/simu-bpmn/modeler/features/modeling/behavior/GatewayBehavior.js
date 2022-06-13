import inherits from "inherits";

import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";
import { isAny } from "../util/ModelingUtil";
import { is } from "bpmn-js/lib/util/ModelUtil";
import { isArray } from "min-dash";

export default function GatewayBehavior(injector, modeling) {
  injector.invoke(CommandInterceptor, this);

  // after creating a exclusiveGateway
  this.postExecute("bsim.element.create", function (event) {
    var context = event.context,
      businessObject = context.shape,
      host = context.host;

    if (!is(businessObject, "bsim:exclusiveGateway")) return;

    const outgoing = host.outgoing;
    if (!isArray(outgoing) || outgoing.length < 2) return;

    const sequences = outgoing.map((flow) => {
      const sequenceBsim =
        flow.bsim || modeling.createBsimElement({ id: flow }, flow);

      modeling.updateModdleProperties(
        sequenceBsim,
        "bsim:branchingProbability",
        { value: 0.0 }
      );

      return sequenceBsim;
    });

    modeling.updateModdleProperties(businessObject, businessObject, {
      outgoing: [...(businessObject.outgoing || []), ...sequences],
    });
  });

  /** Detect lanes that connect to a gateway */
  this.postExecute("connection.create", function (event) {
    var context = event.context,
      connection = context.connection,
      businessObject = connection.businessObject,
      source = context.source,
      sourceBo = source.businessObject;

    if (!is(sourceBo, "bpmn:ExclusiveGateway")) return;

    const outFlows = sourceBo.get("outgoing");
    if (!outFlows || outFlows.length < 2) return;

    let sourceBsim = sourceBo.bsim;
    if (!sourceBsim) {
      modeling.createBsimElement({ id: sourceBo }, sourceBo, {});
      return;
    }

    /** Trigger the creation of a new bsim element and attach it to the business object */
    modeling.createBsimElement({ id: businessObject }, businessObject);
    const sequenceBsim = businessObject.bsim;
    modeling.updateModdleProperties(sequenceBsim, "bsim:branchingProbability", {
      value: 0.0,
    });
    modeling.updateModdleProperties(sourceBsim, sourceBsim, {
      outgoing: [...(sourceBsim.outgoing || []), ...[sequenceBsim]],
    });
  });

  /** Detect lanes that connect to a gateway */
  this.postExecute("connection.delete", function (event) {
    var context = event.context,
      connection = context.connection,
      businessObject = connection.businessObject,
      source = context.source,
      sourceBo = source.businessObject,
      sourceBsim = sourceBo.bsim;
    if (!is(sourceBo, "bpmn:ExclusiveGateway")) return;

    const sequenceBsim = businessObject.bsim;

    const outFlows = sourceBo.get("outgoing");
    if (!outFlows || outFlows.length < 2) {
      delete sourceBo.bsim;
    } else {
      modeling.updateModdleProperties(sourceBsim, sourceBsim, {
        outgoing:
          sourceBsim.outgoing ||
          sourceBsim.outgoing.filter((elem) => elem !== sequenceBsim),
      });
    }
  });

  /** Detect lanes that connect to a gateway */
  this.postExecute("connection.reconnect", function (event) {
    var context = event.context,
      connection = context.connection,
      businessObject = connection.businessObject,
      newSource = context.newSource,
      newSourceBo = newSource.businessObject,
      newSourceBsim = newSourceBo.bsim,
      oldSource = context.oldSource,
      oldSourceBO = oldSource.businessObject,
      oldSourceBsim = oldSourceBO.bsim;

    let sequenceBsim = businessObject.bsim;

    if (is(oldSourceBO, "bpmn:ExclusiveGateway")) {
      const outFlows = oldSourceBO.get("outgoing");
      if (!outFlows || outFlows.length < 2) {
        delete oldSourceBO.bsim;
      } else {
        modeling.updateModdleProperties(oldSourceBsim, oldSourceBsim, {
          outgoing:
            oldSourceBsim.outgoing ||
            oldSourceBsim.outgoing.filter((elem) => elem !== sequenceBsim),
        });
      }
    }

    if (is(newSourceBo, "bpmn:ExclusiveGateway")) {
      const outFlows = newSourceBo.get("outgoing");
      if (!outFlows || outFlows.length < 2) return;

      if (!newSourceBsim) {
        modeling.createBsimElement({ id: newSourceBo }, newSourceBo, {});
        return;
      }

      if (!sequenceBsim) {
        modeling.createBsimElement({ id: businessObject }, businessObject);
        sequenceBsim = businessObject.bsim;
        modeling.updateModdleProperties(
          sequenceBsim,
          "bsim:branchingProbability",
          {
            value: 0.0,
          }
        );
      }

      modeling.updateModdleProperties(newSourceBsim, newSourceBsim, {
        outgoing: [...(newSourceBsim.outgoing || []), ...[sequenceBsim]],
      });
      return;
    }

    modeling.updateModdleProperties(businessObject, businessObject, {
      bsim: undefined,
    });
  });
}

GatewayBehavior.$inject = ["injector", "modeling"];

inherits(GatewayBehavior, CommandInterceptor);
