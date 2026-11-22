import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { UpdateProfileRequest, UserProfile } from "./profile.model";

@Injectable({ providedIn: "root" })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = "/api/users/me";

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.endpoint);
  }

  updateProfile(request: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.patch<UserProfile>(this.endpoint, request);
  }
}
