export interface Reservation {
  id: number;
  restaurant?: { id: number; name: string };
  seat_type?: { id: number; name: string; type: string };
  reserved_at: string;
  end_at: string;
  number_of_people: number;
  user?: { id: number; name: string };
}

export interface AvailableSeat {
  value: string;
  label: string;
  hint: string;
}
