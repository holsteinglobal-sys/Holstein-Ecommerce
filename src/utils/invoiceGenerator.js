import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoice = (order) => {
  const doc = new jsPDF("p", "mm", "a4");

  /* ================= COLORS ================= */
  const colors = {
    primary: [44, 62, 80],       // Dark blue-grey
    secondary: [127, 140, 141],  // Grey
    accent: [41, 128, 185],      // Blue
    success: [39, 174, 96],      // Green
    danger: [192, 57, 43],       // Red
    lightGrey: [245, 245, 245],
  };

  /* ================= HELPERS ================= */
  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const invoiceOrderId = `${order.id.slice(-6).toUpperCase()}`;
  const invoiceDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  /* ================= HEADER ================= */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...colors.accent);
  doc.text("HOLSTEIN NUTRITION PVT LTD", 20, 25);

  doc.setFontSize(10);
  doc.setTextColor(...colors.secondary);
  doc.text("TAX INVOICE / SALES INVOICE", 20, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...colors.primary);
  doc.text("Invoice Date :", 145, 24);
  doc.text(invoiceDate, 190, 24, { align: "right" });

  doc.text("Order ID :", 145, 30);
  doc.text(invoiceOrderId, 190, 30, { align: "right" });

  doc.setDrawColor(200, 200, 200);
  doc.line(20, 38, 190, 38);

  /* ================= ADDRESSES ================= */
  const startY = 48;

  // Sold By
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...colors.primary);
  doc.text("Sold By:", 20, startY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Holstein Nutrition Pvt Ltd", 20, startY + 6);
  doc.text("1803 18th Floor Omaxe India Trade Tower,", 20, startY + 11);
  doc.text("New Chandigarh, Punjab - 140901", 20, startY + 16);
  // doc.text("GSTIN: XXXXX0000X0Z0", 20, startY + 21);
  doc.text("Email: support@holstein.com", 20, startY + 26);

  // Billed To
  const ship = order.shippingAddress || {};
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Billed To:", 110, startY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(ship.fullName || "Guest Customer", 110, startY + 6);

  const addressText = doc.splitTextToSize(
    ship.street || ship.address || "",
    75
  );
  doc.text(addressText, 110, startY + 11);

  const addrHeight = addressText.length * 5;
  doc.text(
    `${ship.city || ""}, ${ship.state || ""} - ${ship.pincode || ""}`,
    110,
    startY + 11 + addrHeight
  );
  doc.text(
    `Phone: ${ship.phone || "N/A"}`,
    110,
    startY + 16 + addrHeight
  );

  /* ================= PAYMENT SUMMARY ================= */
  const paymentY = Math.max(startY + 35, startY + 20 + addrHeight);

  doc.setFillColor(...colors.lightGrey);
  doc.rect(20, paymentY, 170, 14, "F");

  const paymentMethod =
    order.paymentMethod === "razorpay"
      ? "Online Payment"
      : "Cash on Delivery";

  const paymentStatus =
    order.paymentStatus === "paid"
      ? "Payment Received"
      : "Payment Pending";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...colors.primary);
  doc.text("Payment Method:", 25, paymentY + 9);
  doc.setFont("helvetica", "normal");
  doc.text(paymentMethod, 60, paymentY + 9);

  doc.setFont("helvetica", "bold");
  doc.text("Payment Status:", 110, paymentY + 9);

  doc.setTextColor(
    paymentStatus === "Payment Received"
      ? colors.success[0]
      : colors.danger[0],
    paymentStatus === "Payment Received"
      ? colors.success[1]
      : colors.danger[1],
    paymentStatus === "Payment Received"
      ? colors.success[2]
      : colors.danger[2]
  );
  doc.text(paymentStatus, 145, paymentY + 9);

  /* ================= PRODUCT TABLE ================= */
  const tableColumns = [
    "#",
    "Item Description",
    "Qty",
    "Unit Price (₹)",
    "Line Total (₹)",
  ];

  const tableRows = order.products.map((item, index) => [
    index + 1,
    item.title,
    item.qty,
    item.price,
    item.price * item.qty,
  ]);

  autoTable(doc, {
    startY: paymentY + 22,
    head: [tableColumns],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: colors.accent,
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    styles: {
      fontSize: 9,
      textColor: colors.primary,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      2: { halign: "center", cellWidth: 18 },
      3: { halign: "right", cellWidth: 30 },
      4: { halign: "right", cellWidth: 32, fontStyle: "bold" },
    },
    margin: { left: 20, right: 20 },
  });

  /* ================= TOTALS ================= */
  const finalY = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(10);
  doc.setTextColor(...colors.primary);

  doc.text("Subtotal", 130, finalY);
  doc.text(formatCurrency(order.subtotal), 190, finalY, { align: "right" });

  doc.text("Shipping Charges", 130, finalY + 7);
  doc.text(
    formatCurrency(order.shippingCharge),
    190,
    finalY + 7,
    { align: "right" }
  );

  let y = finalY + 14;
  if (order.walletAmountUsed > 0) {
    doc.setTextColor(...colors.success);
    doc.text("Wallet / Discount", 130, y);
    doc.text(
      `- ${formatCurrency(order.walletAmountUsed)}`,
      190,
      y,
      { align: "right" }
    );
    doc.setTextColor(...colors.primary);
    y += 7;
  }

  doc.setDrawColor(180, 180, 180);
  doc.line(125, y - 3, 190, y - 3);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Total Payable", 130, y + 4);
  doc.text(formatCurrency(order.totalAmount), 190, y + 4, {
    align: "right",
  });

  /* ================= FOOTER ================= */
  const pageHeight = doc.internal.pageSize.height;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...colors.secondary);
  doc.text(
    "This is a system-generated invoice and does not require a signature.",
    105,
    pageHeight - 18,
    { align: "center" }
  );

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text(
    "Thank you for shopping with Holstein Nutrition!",
    105,
    pageHeight - 12,
    { align: "center" }
  );

  /* ================= SAVE ================= */
  doc.save(`Invoice_${invoiceOrderId}.pdf`);
};