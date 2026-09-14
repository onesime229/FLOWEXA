import React from 'react';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className="w-full overflow-x-auto rounded-xl border border-white/5 bg-[#0A1428]">
    <table className={`w-full text-left text-sm text-gray-300 ${className}`} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <thead className={`bg-[#020919]/60 text-xs uppercase font-semibold text-gray-400 border-b border-white/5 ${className}`} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <tbody className={`divide-y divide-white/5 ${className}`} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <tr className={`hover:bg-white/[0.02] transition-colors ${className}`} {...props}>
    {children}
  </tr>
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <th className={`px-4 py-3.5 whitespace-nowrap font-semibold ${className}`} {...props}>
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <td className={`px-4 py-3.5 whitespace-nowrap ${className}`} {...props}>
    {children}
  </td>
);

export const TableEmpty: React.FC<{ message?: string; colSpan?: number }> = ({
  message = 'Aucune donnée disponible',
  colSpan = 5,
}) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-12 text-center text-gray-400 text-sm">
      {message}
    </td>
  </tr>
);
