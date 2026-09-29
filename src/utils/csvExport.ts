export interface BatchExportItem {
  id: string | number;
  timestamp: string;
  vehicle_type: string;
  violation: string;
  status: string;
  confidence: number;
  license_plate: string;
  plate_status: string;
  officer_verified: boolean;
  evidence_summary: string;
}

export const exportViolationsToCSV = (
  items: BatchExportItem[],
  filenamePrefix: string = 'traffic_safety_audit'
) => {
  const headers = [
    'Event ID',
    'Timestamp Interval',
    'Vehicle Type',
    'Infraction Code',
    'Enforcement Status',
    'Model Confidence (%)',
    'License Plate',
    'Plate OCR Status',
    'Officer Verified',
    'Evidence Summary',
  ];

  const escapeCsv = (val: any) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = items.map((item) => [
    escapeCsv(item.id),
    escapeCsv(item.timestamp || 'N/A'),
    escapeCsv(item.vehicle_type),
    escapeCsv(item.violation),
    escapeCsv(item.status),
    escapeCsv((item.confidence * 100).toFixed(1)),
    escapeCsv(item.license_plate || 'NOT_READABLE'),
    escapeCsv(item.plate_status || 'UNKNOWN'),
    escapeCsv(item.officer_verified ? 'YES' : 'NO'),
    escapeCsv(item.evidence_summary),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
