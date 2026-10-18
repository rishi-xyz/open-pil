import { ExpirationTime } from "@arkiv-network/sdk";
import type { AttributeInputs } from "@arkiv-network/sdk/attr";
import { markdownSchema } from "../model";
export const markdownEntity = (attributes: AttributeInputs, body: string) => ({ attributes, payload: new TextEncoder().encode(markdownSchema.parse(body)), contentType: "text/markdown", expires: ExpirationTime.fromDays(120), flags: { permissionlessExtension: true } });
