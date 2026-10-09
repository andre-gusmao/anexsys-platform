import { proxyPublicOsRequest, readRouteToken } from "../public-os-proxy";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> | { token: string } }) {
  const { token } = await readRouteToken(context.params);
  return proxyPublicOsRequest(token);
}
