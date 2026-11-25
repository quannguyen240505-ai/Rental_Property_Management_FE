import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { CreateRoomRequest, RoomItem, UpdateRoomRequest } from "./room.model";

/** Calls Property Service through Angular proxy -> API Gateway. JWT is added by authInterceptor. */
@Injectable({ providedIn: "root" })
export class RoomService {
  private readonly http = inject(HttpClient);
  private readonly url = "/api/rooms";

  listByProperty(propertyId: string) {
    return this.http.get<RoomItem[]>(this.url, {
      params: new HttpParams().set("propertyId", propertyId),
    });
  }
  getById(id: string) {
    return this.http.get<RoomItem>(`${this.url}/${encodeURIComponent(id)}`);
  }
  create(request: CreateRoomRequest) {
    return this.http.post<RoomItem>(this.url, request);
  }
  update(id: string, request: UpdateRoomRequest) {
    return this.http.put<RoomItem>(`${this.url}/${encodeURIComponent(id)}`, request);
  }
  setPublished(id: string, published: boolean) {
    return this.http.patch<RoomItem>(
      `${this.url}/${encodeURIComponent(id)}/publication`,
      { published },
    );
  }
}
