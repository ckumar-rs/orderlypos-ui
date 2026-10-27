"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBranch } from "@/hooks/use-branch";
import { api } from "@/lib/api";

interface DayForecast {
  day: string;
  expectedCovers: number;
  bookedCovers: number;
  expectedNoShows: number;
  tableDemand: number;
  tableSupply: number;
}

export default function ReservationForecastPage() {
  const { branchId } = useBranch();
  const forecast = useQuery({
    queryKey: ["reservations", "forecast", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<DayForecast[]>(`/reservations/forecast?branchId=${branchId}`),
  });

  return (
    <div className="flex flex-col gap-4">
      <Link href="/reservations" className="text-sm text-muted-foreground">Reservations</Link>
      <div>
        <h1 className="text-2xl font-semibold">Reservation forecast</h1>
        <p className="text-sm text-muted-foreground">
          Expected covers are the average for that weekday over the last eight weeks. No-shows apply that history to bookings that are still open. Table demand is the number of bookings against the tables on the floor.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Day</TableHead>
            <TableHead>Expected covers</TableHead>
            <TableHead>Booked covers</TableHead>
            <TableHead>Expected no-shows</TableHead>
            <TableHead>Tables needed</TableHead>
            <TableHead>Tables on the floor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(forecast.data ?? []).map((day) => (
            <TableRow key={day.day}>
              <TableCell>{day.day}</TableCell>
              <TableCell>{day.expectedCovers}</TableCell>
              <TableCell>{day.bookedCovers}</TableCell>
              <TableCell>{day.expectedNoShows}</TableCell>
              <TableCell>{day.tableDemand}</TableCell>
              <TableCell>{day.tableSupply}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
