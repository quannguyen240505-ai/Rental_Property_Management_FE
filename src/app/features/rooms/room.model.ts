/** DTOs aligned to Property Service RoomController (Room Hold branch). */
export type RoomStatus = "AVAILABLE" | "RESERVED_PENDING" | "RESERVED" | "OCCUPIED";

export interface RoomItem {
  id: string;
  propertyId: string;
  code: string;
  title: string;
  description: string | null;
  floorNumber: number | null;
  areaM2: number | null;
  monthlyRent: number;
  status: RoomStatus;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomRequest {
  propertyId: string;
  code: string;
  title: string;
  description: string | null;
  floorNumber: number | null;
  areaM2: number | null;
  monthlyRent: number;
}

export type UpdateRoomRequest = Omit<CreateRoomRequest, "propertyId">;
