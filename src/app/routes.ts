
import { Routes } from "@angular/router";

import { LoginComponent } from "./features/auth/login/login.component";
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
  {
    path: "rooms",
    loadComponent: () =>
      import("./features/public-rooms/public-rooms.component")
        .then(m => m.PublicRoomsComponent),
  },
  {
    path: "",
    redirectTo: "rooms",
    pathMatch: "full",
  },
  {
    path: "login",
    component: LoginComponent,
    canActivate: [guestGuard],
  },
  {
    path: "profile",
    component: ProfileComponent,
    canActivate: [authGuard],
  },
  {
    path: "notifications",
    component: NotificationsComponent,
    canActivate: [authGuard],
  },

  // OWNER DASHBOARD
  {
    path: "owner",
    canActivate: [ownerGuard],
    loadComponent: () =>
      import("./features/dashboard/owner/owner-dashboard.component").then(
        (module) => module.OwnerDashboardComponent,
      ),
  },

  // QUáº¢N LÃ TÃ€I KHOáº¢N
  {
    path: "owner/users",
    canActivate: [ownerGuard],
    loadComponent: () =>
      import("./features/users/user-management/user-management.component").then(
        (module) => module.UserManagementComponent,
      ),
  },

  // PROPERTY AND ROOM MANAGEMENT â€“ Thiá»‡n
  {
    path: "owner/properties",
    canActivate: [ownerGuard],
    loadComponent: () =>
      import("./features/properties/property-management.component").then(
        (module) => module.PropertyManagementComponent,
      ),
  },
  {
    path: "owner/rooms",
    canActivate: [ownerGuard],
    loadComponent: () =>
      import("./features/rooms/room-management.component").then(
        (module) => module.RoomManagementComponent,
      ),
  },

  // DANH SÃCH Há»¢P Äá»’NG
  {
    path: "owner/contracts",
    canActivate: [ownerGuard],
    loadComponent: () =>
      import("./features/rental/contract-list/contract-list").then(
        (module) => module.ContractList,
      ),
  },

  // Táº O Há»¢P Äá»’NG Má»šI
  // Pháº£i Ä‘á»©ng trÆ°á»›c route :id
  {
    path: "owner/contracts/new",
    canActivate: [ownerGuard],
    loadComponent: () =>
      import("./features/rental/contract-create/contract-create").then(
        (module) => module.ContractCreate,
      ),
  },

  // CHI TIáº¾T Há»¢P Äá»’NG
  {
    path: "owner/contracts/:id",
    canActivate: [ownerGuard],
    loadComponent: () =>
      import("./features/rental/contract-detail/contract-detail").then(
        (module) => module.ContractDetail,
      ),
  },

  // TENANT DASHBOARD
  {
    path: "tenant",
    canActivate: [tenantGuard],
    loadComponent: () =>
      import("./features/dashboard/tenant/tenant-dashboard.component").then(
        (module) => module.TenantDashboardComponent,
      ),
  },

  // AUTH
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

  // ROUTE KHÃ”NG Tá»’N Táº I
  {
    path: "**",
    redirectTo: "login",
  },
];

