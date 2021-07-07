import inherits from "inherits";

import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";

export default function UpdateModdleBehavior(injector, modeling) {
  injector.invoke(CommandInterceptor, this);

  this.preExecute("element.updateModdleProperties", function (event) {
    var context = event.context,
      element = context.element,
      moddleElement = context.moddleElement;
    if (!element) {
      throw new Error("<element> required");
    }
    if (!moddleElement) {
      throw new Error("<moddleElement> required");
    }

    if (typeof moddleElement === "string") {
      let realModdleElement = element.get(moddleElement);
      if (!realModdleElement) {
        realModdleElement = modeling._createBsim(moddleElement);
        element.set(moddleElement, realModdleElement);
      }
      context.oldModdleElement = moddleElement;
      context.moddleElement = realModdleElement;
    }
  });
}

UpdateModdleBehavior.$inject = ["injector", "modeling"];

inherits(UpdateModdleBehavior, CommandInterceptor);
