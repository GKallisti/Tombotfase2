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
        let LineItemLE = context.getItemValue("LineItemLE");
        let Splittable = context.getItemValue("Splittable");
        let restrain = context.getItemValue("confirmsp"); // confirmsp contiene Yes o No
        let SP = null;

        // Manejar confirmación de restricciones de proveedor de servicios
        if (restrain && restrain.value == "Yes") {
          SP = context.getItemValue("spvl") ? context.getItemValue("spvl").value : null;
        }
        context.logger().info("SP " + JSON.stringify(SP));
        context.logger().info("restrain " + JSON.stringify(restrain));
        
        let generatedLines = {};

        // Mapear el valor de Splittable
        let splittableMapped;
        if (Splittable && Splittable.yesno) {
          splittableMapped = Splittable.yesno.toUpperCase() === "YES" ? "Y" : "N";
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
          serviceProvider: SP || "Sin restricciones de proveedor de servicios"
        };

        let confirmationMessage = `
Por favor, confirme los datos ingresados:
- **Origen:** ${orderReleasePayload.sourceLocation}
- **Destino:** ${orderReleasePayload.destinationLocation}
- **Divisible:** ${orderReleasePayload.splittable === "Y" ? "Sí" : "No"}
- **Proveedor de Servicios:** ${orderReleasePayload.serviceProvider}
- **Líneas de la orden:**
`;

        Object.entries(orderReleasePayload.lineItems).forEach(([lineName, line]) => {
          confirmationMessage += `  - ${lineName}: Producto "${line.ID}", Cantidad: ${line.quantity}\n`;
        });

        // Enviar el mensaje de confirmación
        context.addMessage(confirmationMessage);
      },
    },
  }
};
