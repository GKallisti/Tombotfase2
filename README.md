# OTM Order Release Bot Components

This repository contains two key components for an Oracle Digital Assistant (ODA) skill designed to manage and create Order Releases in Oracle Transportation Management (OTM). These components handle the resolution of entities and the execution of REST calls to integrate with OTM.

---

## Components

### 1. `ORhandler`
#### Description
The `ORhandler` component manages the resolution of entities required to create an Order Release. It ensures data integrity by validating user input and prepares the payload to confirm the order details.

#### Key Features:
- Validates and clears entity values when the `RepeatOrderFlag` is set.
- Maps and organizes line items, including IDs and quantities.
- Constructs a confirmation message summarizing the order details for user review.

#### Metadata
- **Name**: `ORhandler`
- **Type**: `ResolveEntities`
- **Supported Actions**: None (transitions can be added as needed).

#### Workflow
1. **Initialization**: Clears specific entity values if the `RepeatOrderFlag` is `true`.
2. **Entity Resolution**:
   - Validates the presence of required fields such as `SourceLoc`, `DestinationLoc`, and `LineItemLE`.
   - Maps `Splittable` and confirms service provider restrictions if applicable.
   - Generates a payload summarizing the order and prepares a user confirmation message.

---

### 2. `restcall`
#### Description
The `restcall` component integrates with the OTM REST API to create Order Releases based on the resolved entities provided by `ORhandler`. It constructs the appropriate API payload and handles authentication and error management.

#### Key Features:
- Generates a unique Order Release ID based on a timestamp.
- Sends an HTTP POST request to OTM's REST API with the constructed payload.
- Includes service provider restrictions and line item details.
- Handles errors and logs detailed responses for debugging.

#### Metadata
- **Name**: `restcall`
- **Supported Actions**: `success`

#### Workflow
1. **Initialization**: Retrieves the `ORData` variable containing resolved entities.
2. **Payload Construction**:
   - Builds a JSON payload with order details, including source/destination locations, line items, and optional service provider constraints.
   - Authenticates using Basic Authentication.
3. **REST Call Execution**:
   - Sends the payload to the OTM REST API endpoint.
   - Logs and handles errors appropriately.
   - Sends a success message back to the bot flow upon completion.

---

## How to Use

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   ```

2. **Install Dependencies**:
   Ensure that `node-fetch` is installed as it is required for the `restcall` component:
   ```bash
   npm install node-fetch
   ```

3. **Configure Environment**:
   Update the `domainName`, API endpoint, and authentication details in the `restcall` component.

4. **Deploy to ODA**:
   - Package the components and deploy them to your Oracle Digital Assistant instance.

5. **Test the Skill**:
   Use the ODA Test Console to simulate user inputs and verify the Order Release process.

---

## API Endpoint
**OTM REST API**:
- **Endpoint**: `/logisticsRestApi/resources-int/v2/transmissions`
- **Content Type**: `application/vnd.oracle.resource+json;type=singular`
- **Authentication**: Basic Authentication (update credentials in the `restcall` component).

---

## Example Flow
1. User provides order details (e.g., source location, destination location, line items).
2. `ORhandler` validates inputs, organizes line items, and confirms the order details.
3. `restcall` sends the constructed payload to OTM's REST API and logs the response.
4. The bot replies with the Order Release ID upon success or an error message if the request fails.

---

## Logs and Debugging
Both components include detailed logging to help monitor and debug the process:
- **`ORhandler`**: Logs entity resolutions and payload preparation.
- **`restcall`**: Logs API requests and responses, including errors.

---

## License
This project is licensed under the [MIT License](LICENSE).

---

## Contributing
Contributions are welcome! Please create a pull request or open an issue for any suggestions or bugs.

---

## Author
Developed by Gisella.

