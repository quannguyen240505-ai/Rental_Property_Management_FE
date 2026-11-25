/** Matches UserResponse and UpdateProfileRequest in auth-service. */
export type ProfileRole = "OWNER" | "STAFF" | "TENANT" | "CUSTOMER";
export type ProfileStatus = "ACTIVE" | "LOCKED";

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: ProfileRole;
  googleLinked: boolean;
  status: ProfileStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  email: string;
  phone: string;
}
