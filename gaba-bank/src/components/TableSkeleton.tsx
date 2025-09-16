import React from "react";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export const TableSkeleton: React.FC = () => {
  return (
    <Card className="bg-[var(--earth-700)]/60 backdrop-blur-xl border border-[rgba(245,242,237,0.1)] rounded-2xl shadow-lg">
      <CardContent className="p-0">
        {/* Desktop Table Skeleton */}
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
              {Array.from({ length: 4 }, (_, index) => (
                <TableRow
                  key={`skeleton-table-row-${index}`}
                  className="border-b border-[rgba(245,242,237,0.1)] animate-pulse"
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center">
                      <Skeleton className="w-4 h-4 mr-3 bg-[var(--earth-600)]/60" />
                      <Skeleton className="w-16 h-4 bg-[var(--earth-600)]/60" />
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Skeleton className="w-20 h-4 bg-[var(--earth-600)]/60" />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Skeleton className="w-16 h-4 bg-[var(--earth-600)]/60" />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center">
                      <Skeleton className="w-2 h-2 rounded-full mr-2 bg-[var(--earth-600)]/60" />
                      <Skeleton className="w-16 h-4 bg-[var(--earth-600)]/60" />
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <Skeleton className="w-5 h-5 ml-auto bg-[var(--earth-600)]/60" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards Skeleton */}
        <div className="md:hidden space-y-4 p-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={`skeleton-mobile-card-${index}`}
              className="bg-[var(--earth-800)]/50 border border-[rgba(245,242,237,0.1)] rounded-xl p-4 space-y-3 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Skeleton className="w-4 h-4 mr-3 bg-[var(--earth-600)]/60" />
                  <Skeleton className="w-16 h-4 bg-[var(--earth-600)]/60" />
                </div>
                <Skeleton className="w-5 h-5 bg-[var(--earth-600)]/60" />
              </div>

              <div className="flex items-center justify-between">
                <Skeleton className="w-12 h-3 bg-[var(--earth-600)]/40" />
                <Skeleton className="w-20 h-4 bg-[var(--earth-600)]/60" />
              </div>

              <div className="flex items-center justify-between">
                <Skeleton className="w-8 h-3 bg-[var(--earth-600)]/40" />
                <Skeleton className="w-16 h-3 bg-[var(--earth-600)]/60" />
              </div>

              <div className="flex items-center justify-between">
                <Skeleton className="w-10 h-3 bg-[var(--earth-600)]/40" />
                <div className="flex items-center">
                  <Skeleton className="w-2 h-2 rounded-full mr-2 bg-[var(--earth-600)]/60" />
                  <Skeleton className="w-16 h-4 bg-[var(--earth-600)]/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
