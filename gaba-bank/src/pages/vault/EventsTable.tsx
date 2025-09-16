import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import {
  ExternalLink,
  Wallet,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

interface VaultEvent {
  id: string;
  time: Date;
  event: "Deposit" | "Withdraw" | "Sweep";
  amountUSDC: number;
  shares: number;
  txHash: string;
  status: "Pending" | "Success" | "Failed";
}

interface EventsTableProps {
  events: VaultEvent[];
  eventFilter: "All" | "Deposits" | "Withdrawals";
  setEventFilter: (filter: "All" | "Deposits" | "Withdrawals") => void;
  eventsLoading: boolean;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};

export const EventsTable: React.FC<EventsTableProps> = ({
  events,
  eventFilter,
  setEventFilter,
  eventsLoading,
}) => {
  const filteredEvents = events.filter((event) => {
    if (eventFilter === "All") return true;
    if (eventFilter === "Deposits") return event.event === "Deposit";
    if (eventFilter === "Withdrawals") return event.event === "Withdraw";
    return true;
  });

  return (
    <Card className="bg-[var(--earth-700)]/60 backdrop-blur-xl border border-[rgba(245,242,237,0.1)] rounded-2xl">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl font-bold text-[var(--sand-200)]">
            Your Activity
          </h2>
          <Select
            value={eventFilter}
            onValueChange={(value) =>
              setEventFilter(value as "All" | "Deposits" | "Withdrawals")
            }
          >
            <SelectTrigger className="w-48 bg-[var(--earth-800)] border border-[rgba(245,242,237,0.1)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[var(--earth-700)] border border-[rgba(245,242,237,0.1)]">
              <SelectItem value="All">All Events</SelectItem>
              <SelectItem value="Deposits">Deposits</SelectItem>
              <SelectItem value="Withdrawals">Withdrawals</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {eventsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={`loading-${i}`}
                className="h-12 bg-[var(--clay-400)]/20 rounded animate-pulse"
              />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="h-12 w-12 text-[var(--clay-400)] mx-auto mb-4" />
            <p className="text-[var(--clay-400)] text-lg">
              No events yet — deposit to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-[rgba(245,242,237,0.1)]">
                  <TableHead className="text-[var(--clay-400)] font-medium">
                    Time
                  </TableHead>
                  <TableHead className="text-[var(--clay-400)] font-medium">
                    Event
                  </TableHead>
                  <TableHead className="text-[var(--clay-400)] font-medium">
                    Amount (USDC)
                  </TableHead>
                  <TableHead className="text-[var(--clay-400)] font-medium">
                    Shares (±)
                  </TableHead>
                  <TableHead className="text-[var(--clay-400)] font-medium">
                    Tx Hash
                  </TableHead>
                  <TableHead className="text-[var(--clay-400)] font-medium">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow
                    key={event.id}
                    className="hover:bg-[var(--earth-700)]/80 border-b border-[rgba(245,242,237,0.1)]"
                  >
                    <TableCell className="text-[var(--sand-300)]">
                      {formatTime(event.time)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${
                          event.event === "Deposit"
                            ? "bg-[var(--forest-500)]/10 text-[var(--forest-500)]"
                            : event.event === "Withdraw"
                              ? "bg-[var(--sun-500)]/10 text-[var(--sun-400)]"
                              : "bg-[var(--river-500)]/10 text-[var(--river-500)]"
                        }`}
                      >
                        {event.event}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[var(--sand-300)] font-mono">
                      {formatCurrency(event.amountUSDC)}
                    </TableCell>
                    <TableCell
                      className={`font-mono ${
                        event.shares > 0
                          ? "text-[var(--forest-500)]"
                          : "text-[var(--sun-400)]"
                      }`}
                    >
                      {event.shares > 0 ? "+" : ""}
                      {event.shares.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="text-[var(--sun-400)] hover:text-[var(--sun-500)] font-mono text-sm flex items-center gap-1 group"
                      >
                        {event.txHash}
                        <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {event.status === "Success" && (
                          <CheckCircle className="w-4 h-4 text-[var(--forest-500)]" />
                        )}
                        {event.status === "Failed" && (
                          <XCircle className="w-4 h-4 text-[var(--red-400)]" />
                        )}
                        {event.status === "Pending" && (
                          <Loader2 className="w-4 h-4 text-[var(--sun-400)] animate-spin" />
                        )}
                        <span
                          className={`text-sm ${
                            event.status === "Success"
                              ? "text-[var(--forest-500)]"
                              : event.status === "Failed"
                                ? "text-[var(--red-400)]"
                                : "text-[var(--sun-400)]"
                          }`}
                        >
                          {event.status}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
