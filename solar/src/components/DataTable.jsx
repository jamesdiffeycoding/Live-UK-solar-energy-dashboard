"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { getTimeHalfHourLater } from "@/app/timeAndDateHelpers.js";

// The raw feed row is [pes_id, ISO datetime, generation in MW]. Everything the
// table shows is derived here once, so sorting and filtering act on real
// numbers and dates rather than on formatted strings.
function toRecord(row, peakValue) {
  const date = new Date(row[1]);
  return {
    iso: row[1],
    timestamp: date.getTime(),
    day: date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    slot: `${date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })}-${getTimeHalfHourLater(row[1])}`,
    megawatts: row[2],
    percentOfPeak: (row[2] / peakValue) * 100,
    homes: row[2] * 10000,
  };
}

const columnHelper = createColumnHelper();

const numberFormatter = new Intl.NumberFormat("en-GB");

const columns = [
  columnHelper.accessor("day", {
    header: "Date",
    // Text sorts alphabetically by default, which is meaningless for
    // "Fri 1 Aug". Sort on the underlying timestamp instead.
    sortingFn: (a, b) =>
      a.original.timestamp - b.original.timestamp,
  }),
  columnHelper.accessor("slot", { header: "Half hour (UTC)" }),
  columnHelper.accessor("megawatts", {
    header: "Generation (MW)",
    cell: (info) => numberFormatter.format(Math.round(info.getValue())),
    meta: { numeric: true },
  }),
  columnHelper.accessor("percentOfPeak", {
    header: "% of period peak",
    cell: (info) => `${info.getValue().toFixed(1)}%`,
    meta: { numeric: true },
  }),
  columnHelper.accessor("homes", {
    header: "Homes powered",
    cell: (info) => numberFormatter.format(Math.round(info.getValue())),
    meta: { numeric: true },
  }),
];

const CSV_COLUMNS = [
  ["timestamp_utc", (r) => r.iso],
  ["date", (r) => r.day],
  ["half_hour_utc", (r) => r.slot],
  ["generation_mw", (r) => r.megawatts],
  ["percent_of_period_peak", (r) => r.percentOfPeak.toFixed(2)],
  ["homes_powered", (r) => Math.round(r.homes)],
];

// Quote anything containing a delimiter, quote or newline, and double up
// embedded quotes. That is the whole of RFC 4180 that we need to emit.
function escapeCsvValue(value) {
  const asString = String(value);
  return /[",\n\r]/.test(asString)
    ? `"${asString.replace(/"/g, '""')}"`
    : asString;
}

function downloadCsv(records, filename) {
  const lines = [
    CSV_COLUMNS.map(([header]) => header).join(","),
    ...records.map((record) =>
      CSV_COLUMNS.map(([, read]) => escapeCsvValue(read(record))).join(",")
    ),
  ];

  // \r\n and a BOM so Excel opens it without mangling the first header.
  const blob = new Blob(["﻿" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Never show fewer than this, however short the window gets: a two-row page
// with a pager under it is worse than a page that scrolls a little.
const MIN_PAGE_SIZE = 5;
const FALLBACK_ROW_HEIGHT = 25;

export default function DataTable({ dataToDisplay, peakValue, range }) {
  const [sorting, setSorting] = useState([{ id: "day", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [minMegawatts, setMinMegawatts] = useState("");

  const shellRef = useRef(null);
  const filtersRef = useRef(null);
  const theadRef = useRef(null);
  const tbodyRef = useRef(null);
  const pagerRef = useRef(null);

  const data = useMemo(
    () => dataToDisplay.map((row) => toRecord(row, peakValue)),
    [dataToDisplay, peakValue]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  // A fixed page size leaves dead space below the pager on a tall window and
  // overflows a short one. Measure instead: the shell is the height of its
  // snap stop, so subtracting the fixed furniture leaves the room for rows.
  // Held in a ref because the table object is rebuilt on every render and
  // would otherwise retrigger the effect forever.
  const tableRef = useRef(table);
  tableRef.current = table;

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || typeof ResizeObserver === "undefined") return;

    // Measured off absolute geometry rather than by summing offsetHeights:
    // the gap between the last header row and the pager is exactly the room
    // available, and reading it directly keeps every sub-pixel that rounding
    // each element separately would throw away (which cost a whole row).
    const fitPageToShell = () => {
      const firstRow = tbodyRef.current?.rows?.[0];
      const thead = theadRef.current;
      const pager = pagerRef.current;
      if (!firstRow || !thead || !pager) return;

      // Averaged over every rendered row: the first row sits under the header
      // border and measures a pixel taller than the rest, and trusting it
      // alone compounds into a whole missing row on a tall window.
      const rows = tbodyRef.current.rows;
      const lastRow = rows[rows.length - 1];
      const spanned =
        lastRow.getBoundingClientRect().bottom -
        firstRow.getBoundingClientRect().top;
      const rowHeight =
        rows.length > 1
          ? spanned / rows.length
          : firstRow.getBoundingClientRect().height || FALLBACK_ROW_HEIGHT;
      const paddingBottom = parseFloat(getComputedStyle(shell).paddingBottom);
      const room =
        shell.getBoundingClientRect().bottom -
        paddingBottom -
        pager.getBoundingClientRect().height -
        thead.getBoundingClientRect().bottom;

      const fits = Math.max(MIN_PAGE_SIZE, Math.floor(room / rowHeight));
      if (fits !== tableRef.current.getState().pagination.pageSize) {
        tableRef.current.setPageSize(fits);
      }
    };

    // Changing the page size moves the pager, so one settle pass converges on
    // the true fit instead of stopping a row short.
    const settle = () => {
      fitPageToShell();
      requestAnimationFrame(fitPageToShell);
    };

    settle();

    // The shell tracks the viewport, not its own contents, so resizing the
    // page cannot feed back into another resize.
    const observer = new ResizeObserver(settle);
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

  // The MW floor is applied on top of whatever the table already filtered, so
  // the count and the export always agree with what is on screen.
  const threshold = minMegawatts === "" ? null : Number(minMegawatts);
  const visibleRows =
    threshold === null || Number.isNaN(threshold)
      ? table.getRowModel().rows
      : table.getRowModel().rows.filter((row) => row.original.megawatts >= threshold);
  const exportRows = (
    threshold === null || Number.isNaN(threshold)
      ? table.getSortedRowModel().rows
      : table
          .getSortedRowModel()
          .rows.filter((row) => row.original.megawatts >= threshold)
  ).map((row) => row.original);

  return (
    <section ref={shellRef} className="h-full w-full overflow-auto bg-slate-900/80 px-4 pb-3 pt-3 backdrop-blur-sm">
      <div ref={filtersRef} className="flex flex-wrap items-end justify-between gap-3 pb-3 text-xs">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col">
            <span className="pb-1 text-slate-300">Search</span>
            <input
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="e.g. Aug, 14:00"
              className="w-40 rounded bg-slate-800 px-2 py-1 placeholder:text-slate-500"
            />
          </label>
          <label className="flex flex-col">
            <span className="pb-1 text-slate-300">Min MW</span>
            <input
              type="number"
              min="0"
              value={minMegawatts}
              onChange={(event) => setMinMegawatts(event.target.value)}
              placeholder="0"
              className="w-24 rounded bg-slate-800 px-2 py-1 placeholder:text-slate-500"
            />
          </label>
          <span className="pb-1 text-slate-300">
            {exportRows.length} of {data.length} half hours
          </span>
        </div>
        <button
          onClick={() => downloadCsv(exportRows, `awesun-${range}.csv`)}
          disabled={exportRows.length === 0}
          className="rounded bg-yellow-500 px-3 py-1 font-bold text-slate-900 hover:bg-yellow-400 disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      <table className="w-full border-collapse text-xs">
        <thead ref={theadRef} className="sticky top-0 bg-slate-900">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className={`cursor-pointer select-none border-b border-slate-600 px-2 py-2 hover:text-yellow-500 ${
                    header.column.columnDef.meta?.numeric
                      ? "text-right"
                      : "text-left"
                  }`}
                  aria-sort={
                    { asc: "ascending", desc: "descending" }[
                      header.column.getIsSorted()
                    ] ?? "none"
                  }
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  <span className="text-yellow-500">
                    {{ asc: " ▲", desc: " ▼" }[header.column.getIsSorted()] ??
                      ""}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody ref={tbodyRef}>
          {visibleRows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-2 py-6 text-center text-slate-300"
              >
                No half hours match those filters.
              </td>
            </tr>
          )}
          {visibleRows.map((row) => (
            <tr key={row.id} className="odd:bg-slate-800/40">
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={`whitespace-nowrap px-2 py-1 tabular-nums ${
                    cell.column.columnDef.meta?.numeric
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div ref={pagerRef} className="flex items-center justify-center gap-3 pt-3 text-xs">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="rounded bg-slate-800 px-2 py-1 disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-slate-300">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() || 1}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="rounded bg-slate-800 px-2 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  );
}
