import { Routes } from "@angular/router";

import { LoginComponent } from "./features/auth/login/login.component";
import { OwnerComponent } from "./features/owner/owner.component";
import { ProfileComponent } from "./features/users/profile/profile.component";
import { NotificationsComponent } from "./features/notifications/notifications.component";
import { RegisterComponent } from "./features/auth/register/register.component";
import { ForgotPasswordComponent } from "./features/auth/forgot-password/forgot-password.component";
import { ResetPasswordComponent } from "./features/auth/reset-password/reset-password.component";
import { ChangePasswordComponent } from "./features/auth/change-password/change-password.component";

import {
  authGuard,
  guestGuard,
  ownerGuard,
  tenantGuard,
} from "./core/auth/auth.guard";

export const routes: Routes = [
  { path: "", redirectTo: "login", pathMatch: "full" },
  {
    path: "login",
    component: LoginComponent,
    canActivate: [guestGuard],
  },
  { path: "profile", component: ProfileComponent, canActivate: [authGuard] },
  {
    path: "notifications",
    component: NotificationsComponent,
    canActivate: [authGuard],
  },
  {
    path: "owner",
    canActivate: [ownerGuard],
    loadComponent: () =>
      import("./features/dashboard/owner/owner-dashboard.component").then(
        (module) => module.OwnerDashboardComponent,
      ),
  },
  { path: "owner/users", component: OwnerComponent, canActivate: [ownerGuard] },
  {
    path: "tenant",
    canActivate: [tenantGuard],
    loadComponent: () =>
      import("./features/dashboard/tenant/tenant-dashboard.component").then(
        (module) => module.TenantDashboardComponent,
      ),
  },
  {
    path: "register",
    component: RegisterComponent,
    canActivate: [guestGuard],
  },
  {
    path: "forgot-password",
    component: ForgotPasswordComponent,
    canActivate: [guestGuard],
  },
  {
    path: "reset-password",
    component: ResetPasswordComponent,
    canActivate: [guestGuard],
  },
  {
    path: "change-password",
    component: ChangePasswordComponent,
    canActivate: [authGuard],
  },
  { path: "**", redirectTo: "login" },
];
