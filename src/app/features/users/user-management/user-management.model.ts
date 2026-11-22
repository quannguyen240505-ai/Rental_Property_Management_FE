/** Các giá trị enum được đối chiếu trực tiếp với Auth Service. */
export type UserRole = "OWNER" | "STAFF" | "TENANT" | "CUSTOMER";
export type UserStatus = "ACTIVE" | "LOCKED";

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffRequest {
  username: string;
  password: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: "STAFF";
}

export interface UpdateUserRequest {
  fullName: string;
  email: string | null;
  phone: string | null;
}

export interface RoleChangeRequest {
  role: "STAFF" | "CUSTOMER";
  reason: string;
  contractReference: null;
  contractStatusConfirmed: false;
}

export interface RoleChangeHistory {
  id: string;
  targetUserId: string;
  actorUserId: string;
  previousRole: UserRole;
  newRole: UserRole;
  reason: string;
  contractReference: string | null;
  changedAt: string;
}
