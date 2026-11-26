/** Matches Property Service JSON; no invented update/delete endpoint. */
export interface PropertyItem {
  id: string;
  name: string;
  address: string;
  description: string | null;
  contactPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyRequest {
  name: string;
  address: string;
  description: string | null;
  contactPhone: string | null;
}
