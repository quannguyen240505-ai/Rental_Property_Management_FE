import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PublicRoomsComponent } from './public-rooms.component';
import { routes } from '../../routes';

const rooms = [
  {
    id: '1',
    propertyId: 'p1',
    code: 'A101',
    title: 'Phòng máy lạnh',
    propertyName: 'Khu Biên Cương',
    description: 'Có máy lạnh',
    floorNumber: 1,
    areaM2: 22,
    monthlyRent: 1000000,
    contactPhone: '0900000000'
  },
  {
    id: '2',
    propertyId: 'p2',
    code: 'B201',
    title: 'Phòng rộng',
    propertyName: 'Khu B',
    description: 'Có ban công',
    floorNumber: 2,
    areaM2: 35,
    monthlyRent: 3000000,
    contactPhone: '0900000000'
  }
];

describe('PublicRoomsComponent', () => {
  let component: PublicRoomsComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PublicRoomsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpTestingController);
    component = TestBed.createComponent(
      PublicRoomsComponent
    ).componentInstance;
  });

  afterEach(() => http.verify());

  function loadRooms() {
    http.expectOne('/api/public/rooms').flush(rooms);
  }

  it('loads public rooms using GET', () => {
    const request = http.expectOne('/api/public/rooms');
    expect(request.request.method).toBe('GET');
    request.flush(rooms);
    expect(component.rooms().length).toBe(2);
    expect(component.loading()).toBe(false);
  });

  it('searches Vietnamese without accents', () => {
    loadRooms();
    component.keyword.set('bien cuong');
    expect(component.filtered().map(r => r.id)).toEqual(['1']);
  });

  it('filters by maximum rent', () => {
    loadRooms();
    component.budget.set('2000000');
    expect(component.filtered().map(r => r.id)).toEqual(['1']);
  });

  it('filters by minimum area', () => {
    loadRooms();
    component.area.set('30');
    expect(component.filtered().map(r => r.id)).toEqual(['2']);
  });

  it('sorts rooms by price', () => {
    loadRooms();
    component.sort.set('desc');
    expect(component.filtered().map(r => r.id)).toEqual(['2', '1']);
    component.sort.set('asc');
    expect(component.filtered().map(r => r.id)).toEqual(['1', '2']);
  });

  it('resets filters', () => {
    loadRooms();
    component.keyword.set('unknown');
    component.budget.set('2000000');
    component.area.set('30');
    component.sort.set('desc');
    component.resetFilters();
    expect(component.filtered().length).toBe(2);
    expect(component.sort()).toBe('default');
  });

  it('expands and collapses room details', () => {
    loadRooms();
    component.toggle('1');
    expect(component.expanded()).toBe('1');
    component.toggle('1');
    expect(component.expanded()).toBeNull();
  });

  it('handles API errors and retries', () => {
    http.expectOne('/api/public/rooms').flush(null, {
      status: 503,
      statusText: 'Service Unavailable'
    });

    expect(component.error()).toBe(true);
    expect(component.loading()).toBe(false);

    component.load();
    loadRooms();

    expect(component.error()).toBe(false);
    expect(component.rooms().length).toBe(2);
  });

  it('redirects the homepage to public rooms', () => {
    loadRooms();
    expect(routes.find(r => r.path === '')?.redirectTo).toBe('rooms');
  });

  it('does not require authentication for public rooms', () => {
    loadRooms();
    const route = routes.find(r => r.path === 'rooms');
    expect(route).toBeDefined();
    expect(route?.canActivate ?? []).toEqual([]);
  });
});
