import { Routes } from "@angular/router";

import { LoginComponent } from "./features/auth/login.component";
import { OwnerComponent } from "./features/owner/owner.component";
import { ProfileComponent } from "./features/users/profile.component";

import { authGuard, ownerGuard } from "./core/auth/auth.guard";

// Week 1, Quan: authentication and account management only.
// Property's public room route will be added by its owner via a separate PR.
export const routes: Routes = [
  { path: "", redirectTo: "login", pathMatch: "full" },
  { path: "login", component: LoginComponent },
  { path: "profile", component: ProfileComponent, canActivate: [authGuard] },
  { path: "owner", component: OwnerComponent, canActivate: [ownerGuard] },
  { path: "**", redirectTo: "login" },
];
