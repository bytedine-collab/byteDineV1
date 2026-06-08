import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { tableAPI } from '../../services/api';
import toast from 'react-hot-toast';

const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || window.location.origin;

export default function QRManager({ tables, onRefresh }) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [printMode, setPrintMode] = useState(false);

  const getQRUrl = (table) =>
    `${FRONTEND_URL}/menu?table=${table.tableNumber}&qr=${table.qrCode}`;

  const handleDownloadQR = (table) => {
    const svgEl = document.getElementById(`qr-${table.tableNumber}`);
    if (!svgEl) return;

    const canvas = document.createElement('canvas');
    const size = 400;
    canvas.width = size;
    canvas.height = size + 80;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Table ${table.tableNumber}`, canvas.width / 2, 35);

    ctx.font = '14px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Scan to order', canvas.width / 2, 58);

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 40, 70, size - 80, size - 80);

      // Footer
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 13px Arial';
      ctx.fillText('SmartDine Restaurant', canvas.width / 2, size + 65);

      const link = document.createElement('a');
      link.download = `table-${table.tableNumber}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success(`QR for Table ${table.tableNumber} downloaded!`);
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopyLink = (table) => {
    navigator.clipboard.writeText(getQRUrl(table));
    toast.success('Link copied!');
  };

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">QR Code Manager</h2>
          <p className="text-sm text-gray-500 mt-0.5">{tables.length} tables · Scan to order from any device</p>
        </div>
        <button
          onClick={handlePrintAll}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors"
        >
          🖨️ Print All
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
        <p className="text-blue-400 font-semibold text-sm mb-1">📱 How it works</p>
        <p className="text-gray-400 text-sm">Each table has a unique QR code. When customers scan it with their phone camera, they're taken directly to the menu with the table number pre-filled. No app needed.</p>
      </div>

      {/* QR Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 print:grid-cols-3">
        {tables.map(table => (
          <div
            key={table._id}
            className={`bg-gray-900 border rounded-2xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all hover:border-orange-500/40 print:border-gray-300 print:bg-white ${
              selectedTable?._id === table._id ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-gray-800'
            }`}
            onClick={() => setSelectedTable(table)}
          >
            {/* QR Code */}
            <div className="bg-white p-3 rounded-xl">
              <QRCodeSVG
                id={`qr-${table.tableNumber}`}
                value={getQRUrl(table)}
                size={120}
                level="M"
                includeMargin={false}
                fgColor="#111827"
                bgColor="#ffffff"
              />
            </div>

            {/* Table info */}
            <div className="text-center">
              <p className="font-bold text-white text-sm">Table {table.tableNumber}</p>
              <p className="text-xs text-gray-500">{table.capacity} seats</p>
              <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                table.status === 'available' ? 'bg-green-500/20 text-green-400' :
                table.status === 'occupied' ? 'bg-orange-500/20 text-orange-400' :
                'bg-gray-700 text-gray-400'
              }`}>
                {table.status}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 w-full print:hidden">
              <button
                onClick={e => { e.stopPropagation(); handleDownloadQR(table); }}
                className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs py-1.5 rounded-lg transition-colors font-medium"
              >
                ⬇ Save
              </button>
              <button
                onClick={e => { e.stopPropagation(); handleCopyLink(table); }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs py-1.5 rounded-lg transition-colors"
              >
                🔗 Link
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail panel for selected table */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden" onClick={() => setSelectedTable(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">Table {selectedTable.tableNumber}</h3>
              <button onClick={() => setSelectedTable(null)} className="text-gray-500 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800">×</button>
            </div>

            {/* Large QR */}
            <div className="flex justify-center mb-5">
              <div className="bg-white p-5 rounded-2xl shadow-2xl">
                <QRCodeSVG
                  value={getQRUrl(selectedTable)}
                  size={200}
                  level="H"
                  includeMargin={false}
                  fgColor="#111827"
                  bgColor="#ffffff"
                />
              </div>
            </div>

            {/* URL display */}
            <div className="bg-gray-800 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-gray-500 mb-1">Table URL</p>
              <p className="text-xs text-orange-400 break-all">{getQRUrl(selectedTable)}</p>
            </div>

            {/* Table details */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Table Number', value: selectedTable.tableNumber },
                { label: 'Capacity', value: `${selectedTable.capacity} seats` },
                { label: 'Status', value: selectedTable.status },
                { label: 'QR Code', value: selectedTable.qrCode?.slice(0, 8) + '...' },
              ].map(detail => (
                <div key={detail.label} className="bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-500">{detail.label}</p>
                  <p className="text-sm font-semibold text-white capitalize">{detail.value}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => handleDownloadQR(selectedTable)}
                className="w-full bg-orange-500 hover:bg-orange-400 text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                ⬇ Download QR Code
              </button>
              <button
                onClick={() => handleCopyLink(selectedTable)}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                🔗 Copy Menu Link
              </button>
              <a
                href={getQRUrl(selectedTable)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-3 rounded-xl font-semibold text-sm transition-colors text-center"
              >
                🔍 Preview Customer View
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
