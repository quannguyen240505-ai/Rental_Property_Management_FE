import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "./auth.service";
import { AuthSessionCoordinatorService } from "./auth-session-coordinator.service";

describe("AuthSessionCoordinatorService", () => {
  const expired = new Subject<void>();
  const navigateByUrl = vi.fn().mockResolvedValue(true);

  afterEach(() => {
    TestBed.resetTestingModule();
    navigateByUrl.mockClear();
  });

  it("chuyển về Login cùng lý do khi phiên hết hạn", () => {
    TestBed.configureTestingModule({
      providers: [
        AuthSessionCoordinatorService,
        { provide: AuthService, useValue: { sessionExpired$: expired } },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });
    TestBed.inject(AuthSessionCoordinatorService);
    expired.next();
    expect(navigateByUrl).toHaveBeenCalledWith("/login?reason=expired", {
      replaceUrl: true,
    });
  });

  it("không tự chuyển trang khi không có sự kiện hết hạn", () => {
    TestBed.configureTestingModule({
      providers: [
        AuthSessionCoordinatorService,
        { provide: AuthService, useValue: { sessionExpired$: expired } },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });
    TestBed.inject(AuthSessionCoordinatorService);
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
