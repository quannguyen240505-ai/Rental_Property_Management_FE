import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Observable, finalize } from 'rxjs';
import { BillingService } from './billing.service';
import { Invoice, InvoiceLineRequest, InvoiceRequest, MeterReading, MeterReadingRequest } from './billing.models';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/;
const currentMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
const newLine = (): InvoiceLineRequest => ({ lineType: 'RENT', description: '', quantity: 1, unitPrice: 0 });

@Component({
  selector: 'app-billing', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './billing.component.html', styleUrl: './billing.component.css',
})
export class BillingComponent {
  private readonly api = inject(BillingService);
  private readonly destroyRef = inject(DestroyRef);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly readings = signal<MeterReading[]>([]);
  readonly invoice = signal<Invoice | null>(null);
  readonly queried = signal(false);
  readonly uuidPattern = UUID.source;
  tab: 'meter' | 'invoice' = 'meter';
  meter: MeterReadingRequest = { propertyId: '', roomId: '', billingPeriod: currentMonth(), utilityType: 'ELECTRICITY', previousReading: 0, currentReading: 0, meterReplaced: false, meterReplacementReason: null, evidenceUrl: null };
  draft: InvoiceRequest = { propertyId: '', roomId: '', contractId: '', tenantUserId: '', billingPeriod: currentMonth(), dueDate: '', lines: [newLine()] };
  invoiceId = '';
  confirmIssue = false;
  readonly labels: Record<string,string> = { ELECTRICITY: 'Điện', WATER: 'Nước', RENT: 'Tiền thuê', SERVICE_FEE: 'Phí dịch vụ', OTHER: 'Khác', DRAFT: 'Nháp', ISSUED: 'Đã phát hành', PARTIALLY_PAID: 'Thanh toán một phần', PAID: 'Đã thanh toán', OVERDUE: 'Quá hạn', CANCELLED: 'Đã hủy' };
  private validId(s: string) { return UUID.test(s.trim()); }
  private clear() { this.error.set(''); this.success.set(''); }
  private fail(message: string) { this.clear(); this.error.set(message); }
  private run<T>(request: Observable<T>, next: (value: T) => void) {
    if (this.busy()) return;
    this.clear(); this.busy.set(true);
    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false))).subscribe({
      next, error: (e: HttpErrorResponse) => {
        const fallback: Record<number,string> = { 0: 'Không kết nối được máy chủ.', 400: 'Dữ liệu không hợp lệ.', 401: 'Phiên đăng nhập không hợp lệ.', 403: 'Bạn không có quyền thực hiện.', 404: 'Không tìm thấy dữ liệu hoặc API.', 409: 'Dữ liệu bị trùng hoặc trạng thái không hợp lệ.' };
        const detail = e.error?.message || e.error?.detail;
        this.error.set(typeof detail === 'string' && detail.trim() ? detail : (fallback[e.status] || `Lỗi máy chủ (${e.status}).`));
      }
    });
  }
  selectTab(tab: 'meter' | 'invoice') { if (!this.busy()) { this.tab = tab; this.clear(); } }
  saveMeter() {
    const m = this.meter;
    if (!this.validId(m.propertyId) || !this.validId(m.roomId) || !PERIOD.test(m.billingPeriod) || ![m.previousReading,m.currentReading].every(n => Number.isSafeInteger(n) && n >= 0)) return this.fail('Kiểm tra UUID, kỳ và chỉ số nguyên không âm.');
    if (m.currentReading < m.previousReading) return this.fail('Chỉ số mới không được nhỏ hơn chỉ số cũ. Nếu thay công tơ, hãy nhập chỉ số theo quy định thay công tơ.');
    if (m.meterReplaced && !m.meterReplacementReason?.trim()) return this.fail('Nhập lý do thay công tơ.');
    this.run(this.api.createReading({...m, propertyId:m.propertyId.trim(), roomId:m.roomId.trim(), meterReplacementReason:m.meterReplaced ? m.meterReplacementReason?.trim() || null : null, evidenceUrl:m.evidenceUrl?.trim() || null}), r => {
      this.readings.update(rows => [...rows.filter(x => x.roomId === r.roomId && x.billingPeriod === r.billingPeriod && x.id !== r.id),r]);
      this.queried.set(true); this.success.set('Đã lưu chỉ số.');
    });
  }
  searchMeters() {
    if (!this.validId(this.meter.roomId) || !PERIOD.test(this.meter.billingPeriod)) return this.fail('Nhập UUID phòng và kỳ hợp lệ.');
    this.readings.set([]); this.queried.set(false);
    this.run(this.api.readings(this.meter.roomId.trim(), this.meter.billingPeriod), rows => { this.readings.set(rows); this.queried.set(true); });
  }
  addLine() { if (this.draft.lines.length < 100) this.draft.lines.push(newLine()); }
  removeLine(i: number) { if (this.draft.lines.length > 1) this.draft.lines.splice(i,1); }
  useReading(row: MeterReading) {
    if (this.busy() || row.consumption < 0) return;
    const d = this.draft;
    if (d.lines.some(l => l.lineType === row.utilityType)) return this.fail('Khoản điện/nước này đã có trong hóa đơn nháp.');
    if ((d.roomId && d.roomId !== row.roomId) || (d.propertyId && d.propertyId !== row.propertyId) || (d.lines.some(l => l.lineType === 'ELECTRICITY' || l.lineType === 'WATER') && d.billingPeriod !== row.billingPeriod)) return this.fail('Hóa đơn đang nhập thuộc phòng hoặc khu trọ khác.');
    if (d.lines.length >= 100) return this.fail('Tối đa 100 khoản thu.');
    d.propertyId = row.propertyId; d.roomId = row.roomId; d.billingPeriod = row.billingPeriod;
    d.lines.push({lineType:row.utilityType, description:this.labels[row.utilityType], quantity:row.consumption, unitPrice:0});
    this.selectTab('invoice'); this.success.set('Đã thêm lượng tiêu thụ; nhập đơn giá trước khi tạo hóa đơn.');
  }
  previewTotal() { return this.draft.lines.reduce((sum,l) => sum + (Number(l.quantity)||0)*(Number(l.unitPrice)||0),0); }
  createInvoice() {
    const d = this.draft;
    if (![d.propertyId,d.roomId,d.contractId,d.tenantUserId].every(s=>this.validId(s)) || !PERIOD.test(d.billingPeriod) || !/^\d{4}-\d{2}-\d{2}$/.test(d.dueDate)) return this.fail('Nhập đủ UUID, kỳ và hạn thanh toán.');
    const lines = d.lines.map(l=>({...l,description:l.description.trim()}));
    if (!lines.length || lines.length>100 || lines.some(l=>!l.description || l.description.length>255 || !Number.isFinite(l.quantity) || l.quantity<0 || l.quantity>=1e9 || Math.abs(l.quantity*1000-Math.round(l.quantity*1000))>0.0001 || !Number.isSafeInteger(l.unitPrice) || l.unitPrice<0 || !Number.isSafeInteger(Math.round(l.quantity*l.unitPrice)) || Math.abs(l.quantity*l.unitPrice-Math.round(l.quantity*l.unitPrice))>0.0001) || !Number.isSafeInteger(Math.round(this.previewTotal()))) return this.fail('Kiểm tra khoản thu: số lượng tối đa 3 số lẻ, đơn giá và thành tiền là số nguyên VND không âm.');
    this.invoice.set(null); this.confirmIssue=false;
    this.run(this.api.createInvoice({...d, propertyId:d.propertyId.trim(),roomId:d.roomId.trim(),contractId:d.contractId.trim(),tenantUserId:d.tenantUserId.trim(),lines}), i=>{this.showInvoice(i); this.success.set('Đã tạo hóa đơn nháp.');});
  }
  lookupInvoice() {
    if (!this.validId(this.invoiceId)) return this.fail('Nhập UUID hóa đơn hợp lệ.');
    this.invoice.set(null); this.confirmIssue=false;
    this.run(this.api.invoice(this.invoiceId.trim()), i=>this.showInvoice(i));
  }
  private showInvoice(i: Invoice) { this.invoice.set(i); this.invoiceId=i.id; this.confirmIssue=false; }
  issueInvoice() {
    const i=this.invoice();
    if (!i || i.status !== 'DRAFT' || !this.confirmIssue) return;
    this.run(this.api.issue(i.id), result=>{this.showInvoice(result);this.success.set('Đã phát hành hóa đơn.');});
  }
}
