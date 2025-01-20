'use strict';
const fetch = require('node-fetch'); // Usamos fetch para las llamadas REST

module.exports = {
  metadata: () => ({
    name: 'restcall',
    supportedActions: []
  }),

  invoke: async (context) => {
    try {
      let ORData = context.getVariable('skill.ORData');
      if (!ORData) {
        throw new Error("ORData variable is not defined");
      }

      context.logger().info("ORData received:", JSON.stringify(ORData));

      const domainName = "ONET";
      const prefix = "TOMBOT-OR-";
      let timestamp = new Date().toISOString().replace(/[:-]/g, "").split(".")[0]; // Generar fecha/hora para el ID
      let orderReleaseId = `${prefix}${timestamp}`;
      
      
      const body = {
        transactions: {
          items: [
            {
              httpMethod: "POST",
              contentType: "application/vnd.oracle.resource+json; type=singular",
              resourceUrl: "/orderReleases",
              body: {
                domainName,
                orderReleaseXid: orderReleaseId,
                orderReleaseGid: `${domainName}.${orderReleaseId}`,
                orderReleaseName: orderReleaseId,
                orderReleaseTypeGid: "CUSTOMER_ORDER",
                sourceLocationGid: `${domainName}.${ORData.SourceLoc.value}`,
                destLocationGid: `${domainName}.${ORData.DestinationLoc.value}`,
                releaseMethodGid: "AUTO_CALC",
                isSplittable: ORData.Splittable.yesno === "YES",
                lines: {
                  items: ORData.LineItemLE.filter(item => item.type === "PKItemLV").map((lineItem, index) => {
                    const numberItem = ORData.LineItemLE.find(
                      n => n.type === "Integer" && n.beginOffset === lineItem.beginOffset + lineItem.originalString.length
                    );
                    return {
                      domainName,
                      itemPackageCount: numberItem ? numberItem.number : 0,
                      orderReleaseGid: `${domainName}.${orderReleaseId}`,
                      orderReleaseLineGid: `${domainName}.${orderReleaseId}-line${index + 1}`,
                      orderReleaseLineXid: `${orderReleaseId}-line${index + 1}`,
                      packagedItemGid: `${domainName}.${lineItem.value}`
                    };
                  })
                }
              }
            }
          ]
        }
      };

      const headers = {
        "Content-Type": "application/vnd.oracle.resource+json;type=singular",
        Type: "singular"
      };

      const auth = Buffer.from("ONET.INTEGRATIONTOMBOT:iTombot!1152025").toString('base64'); // Codificación en Base64 para la autenticación básica
      headers.Authorization = `Basic ${auth}`;

      const response = await fetch(
        "https://otmgtm-test-mycotm.otmgtm.us-ashburn-1.ocs.oraclecloud.com/logisticsRestApi/resources-int/v2/transmissions",
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        context.logger().info("Error in response:", errorData);
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      context.logger().info("Response received:", responseData);

      // Opcionalmente, puedes enviar un mensaje al flujo del bot
      context.reply(`Order release created successfully! Your Order ID is: ${orderReleaseId}`);
    } catch (error) {
      context.logger().info("Error occurred:", error.message);
      context.reply("There was an issue creating the order release. Please try again.");
    }
  }
};
