import { Component } from '@angular/core';
import { UserManagementComponent } from '../users/user-management/user-management.component';

/** Route /owner đã được bảo vệ bằng ownerGuard trong routes.ts. */
@Component({
  selector: 'app-owner',
  standalone: true,
  imports: [UserManagementComponent],
  template: '<app-user-management />',
})
export class OwnerComponent {}
