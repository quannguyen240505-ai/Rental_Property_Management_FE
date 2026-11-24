import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { routes } from "./app/routes";
import { authInterceptor } from "./app/core/auth/auth.interceptor";
import { provideAppInitializer, inject } from "@angular/core";
import { AuthSessionCoordinatorService } from "./app/core/auth/auth-session-coordinator.service";
import { AppComponent } from "./app/app.component";
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAppInitializer(() => {
      inject(AuthSessionCoordinatorService);
    }),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
}).catch(console.error);
