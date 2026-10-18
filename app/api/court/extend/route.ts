import { courtRoute } from "@/lib/arkiv/court/route";
const extend = courtRoute("extend");
export async function POST(request: Request) { return extend(request); }
