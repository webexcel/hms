import { formatCurrency, capitalize } from '../../../utils/formatters';

export default function InvoiceItemsTable({ items, invoice }) {
  return (
    <div className="table-responsive mb-4">
      <table className="table table-bordered invoice-table mb-0">
        <thead>
          <tr>
            <th style={{ width: 40 }}>S.No</th>
            <th>Description of Services</th>
            <th style={{ width: 80 }}>SAC Code</th>
            <th style={{ width: 60 }}>Qty</th>
            <th style={{ width: 90 }} className="text-end">Rate</th>
            <th style={{ width: 100 }} className="text-end">Amount</th>
            <th style={{ width: 80 }} className="text-center">Tax Rate</th>
            <th style={{ width: 100 }} className="text-end">Tax Amt</th>
            <th style={{ width: 110 }} className="text-end">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={9} className="text-center text-muted">No items</td></tr>
          ) : items.map((item, idx) => (
            <tr key={idx}>
              <td className="text-center">{idx + 1}</td>
              <td>
                <strong>{item.description}</strong>
                {item.item_type && (
                  <><br /><small className="text-muted">{capitalize(item.item_type)}</small></>
                )}
              </td>
              <td className="text-center"><span className="hsn-code">{item.hsn_code || '-'}</span></td>
              <td className="text-center">{item.quantity || 1}</td>
              <td className="text-end">{formatCurrency(item.rate)}</td>
              <td className="text-end">{formatCurrency(item.amount)}</td>
              <td className="text-center">{item.gst_rate}%</td>
              <td className="text-end">{formatCurrency(item.total_gst)}</td>
              <td className="text-end"><strong>{formatCurrency(item.total)}</strong></td>
            </tr>
          ))}
        </tbody>
        {items.length > 0 && (
          <tfoot>
            <tr>
              <td colSpan={5} className="text-end"><strong>Sub Total:</strong></td>
              <td className="text-end"><strong>{formatCurrency(invoice.subtotal)}</strong></td>
              <td colSpan={2} className="text-end"><strong>Total Tax:</strong></td>
              <td className="text-end"><strong>{formatCurrency(invoice.total_gst)}</strong></td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
