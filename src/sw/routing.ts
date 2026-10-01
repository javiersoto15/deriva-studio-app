const STOCK_API_PREFIX = "/api/barra-stock";

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isStockNetworkOnlyRequest(
  pathname: string,
  method: string,
  destination: string
): boolean {
  const stockApi = matchesPrefix(pathname, STOCK_API_PREFIX);
  const stockPage =
    destination === "document" &&
    (matchesPrefix(pathname, "/stock") ||
      matchesPrefix(pathname, "/admin/stock") ||
      matchesPrefix(pathname, "/admin-stock"));
  return stockApi || stockPage;
}

export function isFreshMenuRequest(pathname: string, method: string): boolean {
  if (method !== "GET") return false;
  return (
    pathname === "/menu" ||
    pathname === "/carta" ||
    pathname.startsWith("/menu/") ||
    pathname.startsWith("/carta/") ||
    pathname.startsWith("/api/menu")
  );
}
