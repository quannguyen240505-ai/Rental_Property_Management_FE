import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { DepositReceipt, RentalEligibility, PaymentService } from './payment.service';

@Component({
  standalone: true,
  selector: 'app-deposit-receipts',
  imports: [CommonModule, FormsModule],
  templateUrl: './deposit-receipts.component.html',
  styleUrl: './deposit-receipts.component.css',
})
export class DepositReceiptsComponent {
  readonly auth = inject(AuthService);
  private readonly service = inject(PaymentService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  holdId = this.route.snapshot.queryParamMap.get('holdId') ?? '';
  receiptId = this.route.snapshot.queryParamMap.get('receiptId') ?? '';
  amount: number | null = null;
  method: 'CASH' | 'BANK_TRANSFER' = 'CASH';
  evidenceUrl = '';
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly receipt = signal<DepositReceipt | null>(null);
  readonly eligibility = signal<RentalEligibility | null>(null);
  readonly confirmVerification = signal(false);
  private validId(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
  }
  create() {
    if (this.busy()) return;
    if (!this.validId(this.holdId) || !Number.isSafeInteger(this.amount) || (this.amount ?? 0) <= 0) {
      this.error.set('Nhập Hold ID hợp lệ và số tiền nguyên lớn hơn 0.'); return;
    }
    if (this.evidenceUrl.trim().length > 500) {
      this.error.set('Đường dẫn chứng từ tối đa 500 ký tự.'); return;
    }
    this.run(this.service.create({holdId: this.holdId.trim(), amount: this.amount!, paymentMethod: this.method,
      evidenceUrl: this.evidenceUrl.trim() || null}), data => {
      this.receipt.set(data); this.receiptId = data.id; this.eligibility.set(null);
      this.message.set('Đã ghi nhận phiếu thu. Kiểm tra trạng thái bên dưới.');
    });
  }
  check() {
    if (this.busy() || !this.checkId()) return;
    this.confirmVerification.set(false);
    this.eligibility.set(null);
    this.receipt.set(null);
    this.run(this.service.eligibility(this.receiptId.trim()), data => {
      this.eligibility.set(data); this.message.set('Đã tải kết quả kiểm tra phiếu thu.');
    });
  }
  requestVerification() {
    if (this.busy() || !this.checkId() || this.auth.role() !== 'OWNER') return;
    this.eligibility.set(null);
    this.receipt.set(null);
    this.run(this.service.eligibility(this.receiptId.trim()), data => {
      this.eligibility.set(data);
      if (data.status !== 'REPORTED' && data.status !== 'CUSTOMER_CONFIRMED') {
        this.message.set('Phiếu không cần hoặc không cho phép xác minh ở trạng thái hiện tại.');
        return;
      }
      this.confirmVerification.set(true);
    });
  }
  verify() {
    if (this.busy() || !this.confirmVerification() || this.auth.role() !== 'OWNER' || !this.checkId()) return;
    this.confirmVerification.set(false);
    this.eligibility.set(null);
    this.run(this.service.verify(this.receiptId.trim()), data => {
      this.receipt.set(data);
      this.message.set('OWNER đã xác minh phiếu thu. Bấm Kiểm tra cho Rental để lấy điều kiện hiện tại.');
    });
  }
  private checkId() {
    if (this.validId(this.receiptId)) return true;
    this.error.set('Nhập Receipt ID hợp lệ.'); return false;
  }
  private run<T>(source: Observable<T>, success: (data: T) => void) {
    this.busy.set(true); this.error.set(''); this.message.set('');
    source.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false))).subscribe({
      next: success,
      error: error => {
        const code = error.error?.code;
        const messages: Record<string, string> = {
          FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
          PROPERTY_FORBIDDEN: 'Bạn chưa được phân công quản lý khu trọ này.',
          RECEIPT_NOT_FOUND: 'Không tìm thấy phiếu thu. Kiểm tra Receipt ID.',
          HOLD_NOT_FOUND: 'Không tìm thấy Hold liên kết. Kiểm tra dữ liệu Property.',
          RECEIPT_ALREADY_EXISTS: 'Hold đã có phiếu thu với thông tin khác.',
          HOLD_NOT_ELIGIBLE: 'Hold không còn đủ điều kiện xác minh.',
          HOLD_EXPIRED: 'Hold đã hết hạn.',
          INVALID_HOLD_STATUS: 'Trạng thái Hold chưa cho phép thu cọc.',
          INVALID_ROOM_STATUS: 'Trạng thái phòng chưa cho phép thu cọc.',
          INVALID_RECEIPT_STATUS: 'Trạng thái phiếu không cho phép xác minh.',
          PROPERTY_SERVICE_UNAVAILABLE: 'Không kết nối được Property. Vui lòng thử lại sau.',
          AUTH_SERVICE_UNAVAILABLE: 'Dịch vụ xác thực đang gián đoạn. Vui lòng thử lại sau.',
        };
        this.error.set(error.status === 0 ? 'Không kết nối được máy chủ.' :
          error.status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' :
          messages[code] ?? 'Không thể hoàn tất yêu cầu. Kiểm tra thông tin và thử lại.');
      },
    });
  }
}
