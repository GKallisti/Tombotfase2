'use strict';

module.exports = {
  metadata: {
    name: 'ORhandler',
    eventHandlerType: 'ResolveEntities',
    supportedActions: [] // Definir transiciones si es necesario
  },
  handlers: {
    entity: {
      /**
       * Resolved handler to validate the resolution of all items.
       * @param {EntityBaseEvent} event
       * @param {EntityResolutionContext} context
       */
      resolved: async (event, context) => {
        let RepeatOrderFlag = context.getVariable('skill.RepeatOrderFlag')
        if (RepeatOrderFlag === true) {
          context.clearItemValue("LineItemLE");
          context.clearItemValue("Splittable");
          context.clearItemValue("ConfirmSp");
          context.clearItemValue("ServProvId");
          context.clearItemValue("SourceLoc");
          context.clearItemValue("DestinationLoc");
          
        } else {
        let LineItemLE = context.getItemValue("LineItemLE");
        let Splittable = context.getItemValue("Splittable");
        let restrain = context.getItemValue("ConfirmSp");
        let SP;
        
        // Manejar confirmación de restricciones de proveedor de servicios
        if (restrain.value === "Yes") {
          SP = context.getItemValue("ServProvId") ? context.getItemValue("ServProvId").value : null;
        }
        
        let generatedLines = {};

        // Mapear el valor de Splittable
        let splittableMapped;
        if (Splittable && Splittable.yesno) {
          splittableMapped = Splittable.yesno === "YES" ? "Y" : "N";
        } else {
          splittableMapped = "N"; // Valor por defecto si Splittable es nulo o no contiene el campo yesno
        }

        // Validar que LineItemLE no sea nulo o vacío
        if (Array.isArray(LineItemLE) && LineItemLE.length > 0) {
          let lineCounter = 1; // Contador para nombrar las líneas dinámicamente

          // Filtrar los objetos por tipo
          let items = LineItemLE.filter(item => item.entityName === "PKItemLV");
          let quantities = LineItemLE.filter(item => item.entityName === "NUMBER" && item.type === "Integer");

          // Asegurarse de que haya la misma cantidad de IDs y cantidades
          let minLength = Math.min(items.length, quantities.length);

          // Asociar cada ID con su cantidad correspondiente
          for (let i = 0; i < minLength; i++) {
            let lineName = `Line${lineCounter}`;
            generatedLines[lineName] = {
              ID: items[i].value,
              quantity: quantities[i].number,
            };
            lineCounter++;
          }
        } else {
          context.logger().info("LineItemLE es nulo o vacío.");
        }

        let orderReleasePayload = {
          sourceLocation: context.getItemValue("SourceLoc").value,
          destinationLocation: context.getItemValue("DestinationLoc").value,
          splittable: splittableMapped,
          lineItems: generatedLines,
          restrain : restrain.value,
          serviceProvider: SP || "Without service provider restrictions"
        };

        let confirmationMessage = `
Please confirm the entered information:
- **Source Location:** ${orderReleasePayload.sourceLocation}
- **Destination Location:** ${orderReleasePayload.destinationLocation}
- **Is it Splittable?:** ${orderReleasePayload.splittable === "Y" ? "Yes" : "No"}
- **Does it have constraints?:** ${orderReleasePayload.restrain === "Yes" ? "Yes" : "No"}
- **Service Provider** ${orderReleasePayload.serviceProvider}
- **Line Items:**
`;

        Object.entries(orderReleasePayload.lineItems).forEach(([lineName, line]) => {
          confirmationMessage += `  - ${lineName}: Packaged Item ID: "${line.ID}", Quantity: ${line.quantity}\n`;
        });
        context.addMessage(confirmationMessage);
        
        context.setVariable('skill.RepeatOrderFlag', true );
        
      }
    },
    }
  }

};
