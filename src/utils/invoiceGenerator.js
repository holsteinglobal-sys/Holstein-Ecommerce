import { jsPDF } from "jspdf";
import "jspdf-autotable";

export const generateInvoice = (order) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text("INVOICE", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.text("Holstein Nutrition Private Limited", 20, 30);
  doc.text("Order ID: " + order.id, 20, 35);
  doc.text("Date: " + new Date().toLocaleDateString(), 20, 40);

  // Billing Details
  doc.setFontSize(12);
  doc.text("Bill To:", 20, 55);
  doc.setFontSize(10);
  doc.text(order.shippingAddress?.fullName || "Guest", 20, 60);
  doc.text(order.shippingAddress?.street || "", 20, 65);
  doc.text(`${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} ${order.shippingAddress?.pincode || ""}`, 20, 70);
  doc.text("Phone: " + (order.shippingAddress?.phone || "N/A"), 20, 75);

  // Table
  const tableColumn = ["Item", "Quantity", "Price", "Total"];
  const tableRows = [];

  order.products.forEach((item) => {
    const rowData = [
      item.title,
      item.qty,
      `INR ${item.price}`,
      `INR ${item.price * item.qty}`,
    ];
    tableRows.push(rowData);
  });

  doc.autoTable({
    startY: 85,
    head: [tableColumn],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [43, 108, 176] }, // Blue shade
  });

  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.text(`Subtotal: INR ${order.subtotal}`, 140, finalY);
  doc.text(`Shipping: INR ${order.shippingCharge}`, 140, finalY + 5);
  if (order.walletAmountUsed > 0) {
    doc.text(`Wallet Used: -INR ${order.walletAmountUsed}`, 140, finalY + 10);
  }
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text(`Total Amount: INR ${order.totalAmount}`, 140, finalY + 16);

  // Footer
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.text("Thank you for shopping with Holstein !", 105, 270, { align: "center" });

  // Save the PDF
  doc.save(`Invoice_${order.id.slice(-6)}.pdf`);
};
