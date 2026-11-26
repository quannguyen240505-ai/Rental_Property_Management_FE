import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

interface PublicRoom {
  id: string; propertyId: string; code: string; title: string;
  propertyName: string; description: string | null; floorNumber: number | null;
  areaM2: number | null; monthlyRent: number; contactPhone: string;
}

@Component({
  selector: 'app-public-rooms',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="topbar">
      <div class="shell top-inner">
        <a class="brand" routerLink="/rooms" aria-label="Trang chủ Rental Property">
          <span class="brand-mark" aria-hidden="true">⌂</span>
          <span>Rental Property<small>TÌM PHÒNG & CHO THUÊ</small></span>
        </a>
        <nav><a href="#room-list">Tìm phòng</a><a routerLink="/login">Đăng nhập</a><a class="primary" routerLink="/register">Đăng ký</a></nav>
      </div>
    </header>
    <div class="shell">
      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">KHÔNG GIAN SỐNG CỦA BẠN</span>
          <h1>Tìm nơi ở mới,<br> bắt đầu hành trình mới.</h1>
          <p>Khám phá phòng trọ đang cho thuê, so sánh chi phí và liên hệ trực tiếp với khu trọ.</p>
          <a class="hero-link" href="#room-list">Khám phá phòng trọ →</a>
        </div>
        <div class="hero-art" aria-hidden="true">
          <svg viewBox="0 0 360 250" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="180" cy="120" r="113" fill="#ffffff" fill-opacity=".07"/>
            <circle cx="180" cy="120" r="90" stroke="#a7f3d0" stroke-opacity=".3"/>
            <path d="M72 120 180 36 288 120" stroke="#a7f3d0" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M99 103V217H261V103" fill="#ffffff" fill-opacity=".12" stroke="#a7f3d0" stroke-width="4" stroke-linejoin="round"/>
            <rect x="125" y="126" width="42" height="38" rx="4" fill="#a7f3d0" fill-opacity=".5"/>
            <rect x="193" y="126" width="42" height="38" rx="4" fill="#a7f3d0" fill-opacity=".5"/>
            <path d="M157 217V181H203V217M65 217H295" stroke="#a7f3d0" stroke-width="4" stroke-linecap="round"/>
          </svg>
        </div>
      </section>
      <section class="filters" aria-label="Tìm kiếm phòng trọ">
        <label class="search">Tìm kiếm<input type="search" placeholder="Tên phòng, mã phòng, khu trọ..." [value]="keyword()" (input)="keyword.set($any($event.target).value)"></label>
        <label>Giá thuê<select [value]="budget()" (change)="budget.set($any($event.target).value)">
          <option value="all">Mọi mức giá</option><option value="2000000">Đến 2 triệu</option><option value="3000000">Đến 3 triệu</option><option value="5000000">Đến 5 triệu</option>
        </select></label>
        <label>Diện tích<select [value]="area()" (change)="area.set($any($event.target).value)">
          <option value="all">Mọi diện tích</option><option value="20">Từ 20 m²</option><option value="30">Từ 30 m²</option>
        </select></label>
        <button class="outline" type="button" (click)="resetFilters()">Đặt lại</button>
      </section>
      <section id="room-list" class="listing">
        <div class="section-head"><div><span class="eyebrow green">KHÁM PHÁ</span><h2>Phòng trọ đang cho thuê</h2><p>{{ filtered().length }} phòng phù hợp</p></div>
          <label>Sắp xếp<select [value]="sort()" (change)="sort.set($any($event.target).value)"><option value="default">Mặc định</option><option value="asc">Giá thấp đến cao</option><option value="desc">Giá cao đến thấp</option></select></label>
        </div>
        @if (loading()) { <div class="message" role="status">Đang tải danh sách phòng...</div> }
        @else if (error()) { <div class="message" role="alert">Không thể tải danh sách phòng. <button class="outline" (click)="load()">Thử lại</button></div> }
        @else {
          <div class="grid">
            @for (room of filtered(); track room.id) {
              <article class="room">
                <div class="cover">
                  <span class="available">Đang cho thuê</span>
                  <svg viewBox="0 0 96 76" fill="none" aria-hidden="true"><path d="M8 67H88M14 33L48 8L82 33M23 28V67H73V28M42 67V46H54V67" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="30" y="36" width="9" height="9" rx="1" fill="currentColor"/><rect x="57" y="36" width="9" height="9" rx="1" fill="currentColor"/></svg>
                  <span class="room-code">{{ room.code }}</span>
                </div>
                <div class="room-body">
                  <p class="property">{{ room.propertyName }}</p>
                  <h3>{{ room.title || room.code }}</h3>
                  <p class="price">{{ money(room.monthlyRent) }} <small>/ tháng</small></p>
                  <div class="facts"><span>{{ room.areaM2 ?? "—" }} m²</span><span>Tầng {{ room.floorNumber ?? "—" }}</span></div>
                  <p class="description">{{ room.description || 'Chưa có mô tả.' }}</p>
                  <button class="primary detail" (click)="toggle(room.id)" [attr.aria-expanded]="expanded() === room.id">{{ expanded() === room.id ? 'Thu gọn' : 'Xem thông tin phòng' }}</button>
                  @if (expanded() === room.id) {
                    <div class="details">
                      <p>Mã phòng: <strong>{{ room.code }}</strong></p>
                      @if (room.contactPhone) { <a class="outline" [href]="'tel:' + room.contactPhone">Liên hệ: {{ room.contactPhone }}</a> }
                      <a class="primary" routerLink="/login">Đăng nhập để tiếp tục</a>
                    </div>
                  }
                </div>
              </article>
            } @empty { <div class="message">Không tìm thấy phòng phù hợp. Hãy thử thay đổi bộ lọc.</div> }
          </div>
        }
      </section>
      <section class="bottom"><div><h2>Bạn đã có tài khoản?</h2><p>Đăng nhập để sử dụng các chức năng của hệ thống.</p></div><a class="primary" routerLink="/login">Đăng nhập ngay →</a></section>
    </div>
    <footer>Rental Property · Hệ thống quản lý và cho thuê phòng trọ</footer>
  `,
  styles: [`
    :host{display:block;color:#15352e;font-family:inherit;background:#f4f9f7;min-height:100vh}*{box-sizing:border-box}a{text-decoration:none;color:inherit}button,input,select{font:inherit}button,a.primary,a.outline{cursor:pointer}.shell{max-width:1240px;margin:auto;padding:0 24px}.topbar{background:#fff;border-bottom:1px solid #dbeae4}.top-inner{min-height:76px;display:flex;align-items:center;justify-content:space-between;gap:20px}.brand{display:flex;align-items:center;gap:12px;font-size:20px;font-weight:800;color:#075b4c}.brand small{display:block;font-size:10px;letter-spacing:1.5px;font-weight:600;color:#638078}.brand-mark{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:#e0f6ec;font-size:31px}.topbar nav{display:flex;align-items:center;gap:24px;font-size:14px;font-weight:600}.primary,.outline{display:inline-flex;align-items:center;justify-content:center;border-radius:9px;padding:12px 18px;font-weight:700;font-size:14px;border:1px solid transparent;text-align:center}.primary{background:#087e68;color:white}.primary:hover{background:#066452}.outline{background:#fff;color:#087e68;border-color:#b9d9cc}.hero{margin:28px 0 0;min-height:300px;padding:42px 48px;border-radius:22px;background:linear-gradient(115deg,#06483e,#0a7966 62%,#28ae91);color:white;display:flex;align-items:center;justify-content:space-between;gap:24px}.hero-copy{max-width:650px}.eyebrow{font-size:12px;font-weight:800;letter-spacing:2px;color:#b9f8e4}.hero h1{font-size:clamp(32px,4vw,52px);line-height:1.1;letter-spacing:-1.5px;margin:14px 0}.hero p{max-width:490px;line-height:1.7;color:#e2f9f2}.hero-link{display:inline-block;margin-top:10px;color:#fff;font-weight:700;border-bottom:1px solid #9debd3;padding-bottom:5px}.hero-art{width:32%;min-width:180px}.hero-art svg{display:block;width:100%}.filters{position:relative;margin: -18px 24px 0;padding:20px;background:#fff;border:1px solid #e1ece6;box-shadow:0 12px 30px #0b4b3810;border-radius:14px;display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:12px;align-items:end}label{display:grid;gap:7px;font-size:12px;font-weight:700;color:#42665b}input,select{width:100%;min-width:0;padding:12px;border:1px solid #d5e5dd;border-radius:8px;background:#fff;color:#214338;min-height:44px}.listing{margin:45px 0}.section-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:22px}.section-head label{min-width:180px}.green{color:#087e68}.section-head h2,.bottom h2{font-size:clamp(22px,3vw,30px);margin:8px 0}.section-head p,.bottom p{margin:0;color:#678178;font-size:14px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.room{background:white;border:1px solid #dceae2;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px #123a2710;display:flex;flex-direction:column}.cover{position:relative;background:linear-gradient(130deg,#e2f4ed,#c5eadd);height:148px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px;color:#429481}.cover svg{width:74px;height:58px}.room-code{font-size:12px;font-weight:700;overflow-wrap:anywhere;text-align:center}.available{position:absolute;top:12px;left:12px;color:#17614e;background:white;border-radius:20px;padding:5px 10px;font-size:11px;font-weight:700}.room-body{padding:18px;display:flex;flex:1;flex-direction:column;gap:10px}.property{color:#628078;font-size:13px;overflow-wrap:anywhere}.room-body p,.room-body h3{margin:0}.room-body h3{font-size:18px;line-height:1.4;overflow-wrap:anywhere}.price{font-size:22px;font-weight:800;color:#087e68}.price small{font-size:12px;font-weight:400;color:#678178}.facts{display:flex;flex-wrap:wrap;gap:8px}.facts span{background:#edf6f2;color:#47685e;border-radius:5px;padding:5px 8px;font-size:12px}.description{color:#64766f;font-size:14px;line-height:1.5;flex:1;overflow-wrap:anywhere}.detail{width:100%}.details{border-top:1px solid #e4eee9;padding-top:12px;display:grid;gap:8px;font-size:13px}.message{grid-column:1/-1;padding:36px;text-align:center;background:#fff;border:1px dashed #b9d9cc;border-radius:12px}.bottom{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:24px;background:#e1f4eb;border-radius:14px;margin-bottom:32px}footer{padding:24px;text-align:center;color:#688078;border-top:1px solid #dbeae4;font-size:13px}@media(max-width:850px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.filters{grid-template-columns:1fr 1fr;margin:12px 0}.search{grid-column:1/-1}.hero{padding:30px}.topbar nav{gap:12px}.hero-art{display:none}}@media(max-width:560px){.shell{padding:0 14px}.top-inner{flex-wrap:wrap;padding-top:12px;padding-bottom:12px}.brand{font-size:17px}.topbar nav{width:100%;justify-content:space-between}.hero{padding:26px 20px}.hero h1{font-size:32px}.grid{grid-template-columns:1fr}.section-head,.bottom{align-items:stretch;flex-direction:column}.filters{padding:12px}.filters .outline{grid-column:1/-1}}
  `]
})
export class PublicRoomsComponent {
  private readonly http = inject(HttpClient);
  readonly rooms = signal<PublicRoom[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly keyword = signal('');
  readonly budget = signal('all');
  readonly area = signal('all');
  readonly sort = signal('default');
  readonly expanded = signal<string | null>(null);
  readonly filtered = computed(() => {
    const key = this.normalize(this.keyword());
    const list = this.rooms().filter(room =>
      this.normalize([room.title, room.code, room.propertyName, room.description].join(' ')).includes(key) &&
      (this.budget() === 'all' || room.monthlyRent <= Number(this.budget())) &&
      (this.area() === 'all' || (room.areaM2 ?? 0) >= Number(this.area())));
    if (this.sort() === 'asc') return list.sort((a,b) => a.monthlyRent - b.monthlyRent);
    if (this.sort() === 'desc') return list.sort((a,b) => b.monthlyRent - a.monthlyRent);
    return list;
  });
  constructor() { this.load(); }
  load(): void {
    this.loading.set(true); this.error.set(false);
    this.http.get<PublicRoom[]>('/api/public/rooms').subscribe({
      next: rooms => { this.rooms.set(rooms); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); }
    });
  }
  resetFilters(): void { this.keyword.set(''); this.budget.set('all'); this.area.set('all'); this.sort.set('default'); }
  toggle(id: string): void { this.expanded.update(current => current === id ? null : id); }
  money(value: number): string { return new Intl.NumberFormat('vi-VN', {style:'currency',currency:'VND'}).format(value); }
  private normalize(value: string): string { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim(); }
}
