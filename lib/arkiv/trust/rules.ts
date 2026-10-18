import { APP } from "../model";
import type { ArkivRecord } from "../records";
export const sameAddress = (a: string, b: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
export const isType = (e: ArkivRecord, type: string) => e.attributes.app === APP && e.attributes.type === type;
