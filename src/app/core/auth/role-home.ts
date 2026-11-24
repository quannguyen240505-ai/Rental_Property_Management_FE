/** Route landing page by backend role. Do not grant authorization here: guards do that. */
export function roleHome(role: string | null): string {
  if (role === "OWNER") return "/owner";
  if (role === "TENANT") return "/tenant";
  return "/profile";
}
