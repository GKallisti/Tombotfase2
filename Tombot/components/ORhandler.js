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
        let ORData = context.getVariable('skill.ORData');
        let SourceLocation = context.getItemValue("SourceLoc");
        let DestinationLocation = context.getItemValue("DestinationLoc");
        let LineItemLE = context.getItemValue("LineItemLE");
        let Splittable = context.getItemValue("Splittable");
        let generatedLines = {};
       
        // Crear y asignar valores a las nuevas variables según las cláusulas
        let orderConfig = "AUTO_CALC";
        context.logger().info(`orderConfig: ${orderConfig}`);

        let releaseAttLV = "PURCHASE_ORDER";
        context.logger().info(`releaseAttLV: ${releaseAttLV}`);

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
        // Loggear las líneas generadas
        context.logger().info(`Líneas generadas: ${JSON.stringify(generatedLines)}`);
        context.addMessage(`Líneas generadas: ${JSON.stringify(generatedLines)}`);

        let orderReleasePayload = {
          sourceLocation: context.getItemValue("SourceLoc").value,
          destinationLocation: context.getItemValue("DestinationLoc").value,
          earlyPickupDate: context.getItemValue("EPD").value,
          lateDeliveryDate: context.getItemValue("LDD").value,
          orderConfig: orderConfig,
          releaseAttribute: releaseAttLV,
          splittable: splittableMapped,
          lineItems: generatedLines,
        };
        
        let confirmationMessage = `
Por favor, confirme los datos ingresados:
- **Origen:** ${orderReleasePayload.sourceLocation}
- **Destino:** ${orderReleasePayload.destinationLocation}
- **Fecha de retiro temprana:** ${orderReleasePayload.earlyPickupDate}
- **Fecha de entrega tardía:** ${orderReleasePayload.lateDeliveryDate}
- **Configuración de orden:** ${orderReleasePayload.orderConfig}
- **Atributo de liberación:** ${orderReleasePayload.releaseAttribute}
- **Divisible:** ${orderReleasePayload.splittable === "Y" ? "Sí" : "No"}
- **Líneas de la orden:**  ${orderReleasePayload.lineItems}
}
`;

Object.entries(orderReleasePayload.lineItems).forEach(([lineName, line]) => {
  confirmationMessage += `  - ${lineName}: Producto "${line.ID}", Cantidad: ${line.quantity}\n`;
});
context.logger().info(JSON.stringify(context.getItemValue("EPD").value));
context.logger().info(JSON.stringify(ORData));

// Mostrar mensaje al usuario
context.addMessage(confirmationMessage);

//   The operations from the Business Objects/Order Releases category.
// Create an Order Release
// Method: post
// Path: /orderReleases


      },
    },
  }

};

