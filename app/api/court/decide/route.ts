import { courtRoute } from "@/lib/arkiv/court/route";
const decide = courtRoute("decide");
export async function POST(request: Request) { return decide(request); }
