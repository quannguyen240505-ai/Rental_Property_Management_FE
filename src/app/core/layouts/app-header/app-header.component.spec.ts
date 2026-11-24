import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { AuthService } from "../../auth/auth.service";
import { NotificationService } from "../../../features/notifications/notification.service";
import { AppHeaderComponent } from "./app-header.component";

describe("AppHeaderComponent", () => {
  let fixture: ComponentFixture<AppHeaderComponent>;
  let unreadCount: WritableSignal<number>;

  beforeEach(async () => {
    unreadCount = signal(0);
    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { token: signal("test-token"), role: signal("TENANT") },
        },
        { provide: NotificationService, useValue: { unreadCount } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppHeaderComponent);
    fixture.detectChanges();
  });

  it("hides notification badge when unread count is zero", () => {
    expect(fixture.nativeElement.querySelector(".rp-header__badge")).toBeNull();
  });

  it("shows unread badge and caps the displayed count at 99+", () => {
    unreadCount.set(120);
    fixture.detectChanges();
    const badge: HTMLElement | null =
      fixture.nativeElement.querySelector(".rp-header__badge");
    expect(badge?.textContent?.trim()).toBe("99+");
    const bell: HTMLAnchorElement | null =
      fixture.nativeElement.querySelector(".rp-header__bell");
    expect(bell?.getAttribute("aria-label")).toContain("120 chưa đọc");
  });

  it("opens the account menu and emits logout request", () => {
    let logoutCount = 0;
    fixture.componentInstance.logoutRequested.subscribe(() => logoutCount++);
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector(
      ".rp-header__account-trigger",
    );
    trigger.click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector("#rp-account-menu"),
    ).not.toBeNull();
    const logout: HTMLButtonElement =
      fixture.nativeElement.querySelector(".rp-header__logout");
    logout.click();
    fixture.detectChanges();
    expect(logoutCount).toBe(1);
    expect(fixture.componentInstance.menuOpen()).toBe(false);
  });
});
