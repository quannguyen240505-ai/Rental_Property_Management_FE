import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { CreatePropertyRequest, PropertyItem } from "./property.model";

/** Property Service calls are routed via localhost:4200 -> Gateway :8080.
 * Auth interceptor on dev adds the signed-in OWNER's Bearer JWT. */
@Injectable({ providedIn: "root" })
export class PropertyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = "/api/properties";

  list() {
    return this.http.get<PropertyItem[]>(this.baseUrl);
  }

  getById(id: string) {
    return this.http.get<PropertyItem>(
      `${this.baseUrl}/${encodeURIComponent(id)}`,
    );
  }

  create(data: CreatePropertyRequest) {
    return this.http.post<PropertyItem>(this.baseUrl, data);
  }
}
