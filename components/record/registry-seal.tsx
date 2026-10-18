import { Seal } from "./seal";
export function RegistrySeal({ name, role, size }: { name: string; role: string; size?: number }) {
  return <Seal tone="seal" rim="OPENPIL SIGNED REGISTRY * REGISTERED ORGANISATION *" center={name} sub={role} size={size} />;
}
