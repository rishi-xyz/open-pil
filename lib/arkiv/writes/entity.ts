import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk";
import type { AttributeInputs } from "@arkiv-network/sdk/attr";
export const persistentEntity = (attributes: AttributeInputs, payload: object) => ({ attributes, payload: jsonToPayload(payload), contentType: "application/json", expires: ExpirationTime.fromDays(120), flags: { permissionlessExtension: true } });
