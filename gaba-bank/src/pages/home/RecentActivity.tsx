import React from "react";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { TableSkeleton } from "../../components/TableSkeleton";
import { ExternalLink } from "lucide-react";
import { useWallet } from "../../contexts/WalletContext";

export const RecentActivity: React.FC = () => {
  const { recentActivity, isLoadingActivity } = useWallet();

  const statusClasses = {
    green: "bg-[var(--forest-500)]/10 text-[var(--forest-500)]",
    yellow: "bg-[var(--sun-500)]/10 text-[var(--sun-400)]",
    red: "bg-[var(--red-500)]/10 text-[var(--red-400)]",
  };

  const statusDotClasses = {
    green: "bg-[var(--forest-500)]",
    yellow: "bg-[var(--sun-400)]",
    red: "bg-[var(--red-400)]",
  };

  const statusTextClasses = {
    green: "text-[var(--forest-500)]",
    yellow: "text-[var(--sun-400)]",
    red: "text-[var(--red-400)]",
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-[var(--sand-200)] mb-4">
        Recent Activity
      </h2>

      {isLoadingActivity ? (
        <TableSkeleton />
      ) : (
        <Card className="bg-[var(--earth-700)]/60 backdrop-blur-xl border border-[rgba(245,242,237,0.1)] rounded-2xl shadow-lg">
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-[rgba(245,242,237,0.1)]">
                    <TableHead className="px-6 py-4 text-xs text-[var(--clay-400)] uppercase font-medium">
                      Type
                    </TableHead>
                    <TableHead className="px-6 py-4 text-xs text-[var(--clay-400)] uppercase font-medium">
                      Amount
                    </TableHead>
                    <TableHead className="px-6 py-4 text-xs text-[var(--clay-400)] uppercase font-medium">
                      Time
                    </TableHead>
                    <TableHead className="px-6 py-4 text-xs text-[var(--clay-400)] uppercase font-medium">
                      Status
                    </TableHead>
                    <TableHead className="px-6 py-4 text-xs text-[var(--clay-400)] uppercase font-medium text-right">
                      Explorer
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity.map((row) => (
                    <TableRow
                      key={`${row.time}-${row.type}-${row.amount}`}
                      className="hover:bg-[var(--earth-700)]/80 border-b border-[rgba(245,242,237,0.1)]"
                    >
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center font-bold text-[var(--sand-200)]">
                          <span
                            className={`mr-3 ${
                              statusTextClasses[row.statusColor]
                            }`}
                          >
                            {row.icon}
                          </span>
                          {row.type}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-[var(--sand-300)]">
                        {row.amount}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-[var(--clay-400)]">
                        {row.time}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                            statusClasses[row.statusColor]
                          }`}
                        >
                          <span
                            className={`w-2 h-2 mr-2 rounded-full ${
                              statusDotClasses[row.statusColor]
                            }`}
                          />
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <button
                          type="button"
                          className="text-[var(--sun-400)] hover:text-[var(--sun-500)] font-medium inline-flex items-center group"
                        >
                          <ExternalLink className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4 p-4">
              {recentActivity.map((row) => (
                <div
                  key={`mobile-${row.time}-${row.type}-${row.amount}`}
                  className="bg-[var(--earth-800)]/50 border border-[rgba(245,242,237,0.1)] rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center font-bold text-[var(--sand-200)]">
                      <span
                        className={`mr-3 ${statusTextClasses[row.statusColor]}`}
                      >
                        {row.icon}
                      </span>
                      {row.type}
                    </div>
                    <button
                      type="button"
                      className="text-[var(--sun-400)] hover:text-[var(--sun-500)] font-medium inline-flex items-center group"
                    >
                      <ExternalLink className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--clay-400)]">
                      Amount
                    </span>
                    <span className="text-[var(--sand-300)] font-medium">
                      {row.amount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--clay-400)]">Time</span>
                    <span className="text-[var(--clay-400)] text-sm">
                      {row.time}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--clay-400)]">
                      Status
                    </span>
                    <Badge
                      className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                        statusClasses[row.statusColor]
                      }`}
                    >
                      <span
                        className={`w-2 h-2 mr-2 rounded-full ${
                          statusDotClasses[row.statusColor]
                        }`}
                      />
                      {row.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
