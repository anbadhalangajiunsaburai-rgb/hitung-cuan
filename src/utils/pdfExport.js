import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getConversionRate = (buyUnit, useUnit) => {
  if (buyUnit === useUnit) return 1;
  if (useUnit === 'Secukupnya') return 0.02;
  const key = `${buyUnit}_${useUnit}`;
  const conv = {
    'Kg_Gram': 1000, 'Gram_Kg': 0.001,
    'Liter_MiliLiter': 1000, 'MiliLiter_Liter': 0.001,
    'Kg_Butir': 16, 'Gram_Butir': 0.016,
    'Kg_Siung': 200, 'Gram_Siung': 0.2,
    'Kg_Lembar': 500, 'Gram_Lembar': 0.5,
    'Kg_Batang': 100, 'Gram_Batang': 0.1,
    'Liter_Sendok': 66, 'MiliLiter_Sendok': 0.066,
    'Kg_Sendok': 66, 'Gram_Sendok': 0.066,
    'Kg_Pcs': 20, 'Gram_Pcs': 0.02,
    'Kg_Potong': 20, 'Gram_Potong': 0.02,
    'Lusin_Pcs': 12, 'Pack_Pcs': 10, 'Bungkus_Pcs': 10, 'Pack_Bungkus': 10
  };
  return conv[key] || 0;
};

const calculateCostHelper = (item, invItem, portions = 1, defaultUsage = 'total_resep') => {
  if (!invItem || !item.useQty || !item.useUnit) return 0;
  let rate = getConversionRate(invItem.unit, item.useUnit);
  if (rate === 0) return 0;
  const qtyBought = invItem.qty || 1;
  const pricePerBaseUnit = invItem.price / qtyBought;
  let qtyInBuyUnit = item.useUnit === 'Secukupnya' ? rate : parseFloat(item.useQty) / rate;
  
  const usage = item.usageType || defaultUsage;
  if (usage === 'per_porsi') {
    qtyInBuyUnit = qtyInBuyUnit * (parseFloat(portions) || 1);
  }
  
  return qtyInBuyUnit * pricePerBaseUnit;
};

const calculateCompanionCost = (comp, projects, portions = 1) => {
  if (!comp.projectId || !comp.usePortions) return 0;
  const project = projects.find(p => p.id === comp.projectId);
  if (!project) return 0;
  const hppPerPortion = project.hppPerPortion || (project.totalHPP / (project.portions || 1));
  
  let useQty = parseFloat(comp.usePortions);
  const usage = comp.usageType || 'per_porsi';
  if (usage === 'per_porsi') {
    useQty = useQty * (parseFloat(portions) || 1);
  }
  return useQty * hppPerPortion;
};

export const generateRecipePDF = (project, stats, inventory, projects = [], potonganOjol = 20) => {
  try {
    const doc = new jsPDF();
    const portions = parseFloat(project.portions) || 1;
    
    // Format Currency
    const formatRp = (num) => 'Rp ' + Math.ceil(num || 0).toLocaleString('id-ID');

    // Header
    doc.setFontSize(18);
    doc.setTextColor(234, 88, 12); // Orange-600
    doc.text('Laporan HPP & Harga Jual', 14, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFont('helvetica', 'bold');
    doc.text(project.menuName || 'Resep', 14, 32);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')} | Skala Resep: ${portions} Porsi`, 14, 38);

    let currentY = 50;

    // 1. Ringkasan Laba Rugi
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Ringkasan Harga & Keuntungan (Per Porsi)', 14, currentY);
    
    currentY += 6;
    
    const safePotongan = potonganOjol >= 100 ? 99 : (potonganOjol || 0);
    const hargaOnline = stats.hargaJualOnline || 0;
    const potonganRpOnline = Math.ceil(hargaOnline * (safePotongan / 100));

    const modalKemasan = (stats.hppTakeaway || 0) - (stats.hppDineIn || 0);

    const untungDineIn = (stats.hargaJualDasar || 0) - (stats.hppDineIn || 0);
    const marginDineIn = stats.hargaJualDasar > 0 ? ((untungDineIn / stats.hargaJualDasar) * 100).toFixed(1) : 0;
    
    const untungTakeaway = (stats.hargaJualDasar || 0) - (stats.hppTakeaway || 0);
    const marginTakeaway = stats.hargaJualDasar > 0 ? ((untungTakeaway / stats.hargaJualDasar) * 100).toFixed(1) : 0;

    const untungOjol = hargaOnline - (stats.hppTakeaway || 0) - potonganRpOnline;
    const marginOjol = hargaOnline > 0 ? ((untungOjol / hargaOnline) * 100).toFixed(1) : 0;

    autoTable(doc, {
      startY: currentY,
      head: [['Keterangan', 'Dine-In', 'Take Away', 'Aplikasi Online']],
      body: [
        ['Harga Jual', formatRp(stats.hargaJualDasar), formatRp(stats.hargaJualDasar), formatRp(hargaOnline)],
        ['Modal Kemasan', '-', formatRp(modalKemasan), formatRp(modalKemasan)],
        ['Total Modal (HPP)', formatRp(stats.hppDineIn), formatRp(stats.hppTakeaway), formatRp(stats.hppTakeaway)],
        ['Potongan Ojol', '-', '-', formatRp(potonganRpOnline)],
        ['Keuntungan Bersih', formatRp(untungDineIn), formatRp(untungTakeaway), formatRp(untungOjol)],
        ['Margin Keuntungan', `${marginDineIn}%`, `${marginTakeaway}%`, `${marginOjol}%`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [248, 113, 29] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { left: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // 2. Rincian Modal Bahan (HPP)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Rincian Modal Bahan Baku (Total Resep)', 14, currentY);
    
    currentY += 6;

    const bahanRows = [];
    let sumTotalModal = 0;
    let sumModalPerPorsi = 0;

    if (project.recipeItems && project.recipeItems.length > 0) {
      project.recipeItems.forEach(item => {
        const inv = inventory.find(i => i.id === item.inventoryId);
        if (inv) {
          const costTotal = calculateCostHelper(item, inv, portions, 'total_resep');
          const costPerPortion = costTotal / portions;
          sumTotalModal += costTotal;
          sumModalPerPorsi += costPerPortion;
          bahanRows.push([
            'Bahan Baku',
            inv.name, 
            `${item.useQty} ${item.useUnit}`, 
            formatRp(costTotal),
            formatRp(costPerPortion)
          ]);
        }
      });
    }
    if (project.companionItems && project.companionItems.length > 0) {
      project.companionItems.forEach(item => {
        const costTotal = calculateCompanionCost(item, projects, portions);
        const costPerPortion = costTotal / portions;
        sumTotalModal += costTotal;
        sumModalPerPorsi += costPerPortion;
        const compProject = projects.find(p => p.id === item.projectId);
        const compName = compProject ? compProject.menuName : 'Menu Pendamping';
        bahanRows.push([
          'Pendamping',
          compName, 
          `${item.usePortions} Porsi`, 
          formatRp(costTotal),
          formatRp(costPerPortion)
        ]);
      });
    }
    if (project.packagingItems && project.packagingItems.length > 0) {
      project.packagingItems.forEach(item => {
        const inv = inventory.find(i => i.id === item.inventoryId);
        if (inv) {
          const costTotal = calculateCostHelper(item, inv, portions, 'per_porsi');
          const costPerPortion = costTotal / portions;
          sumTotalModal += costTotal;
          sumModalPerPorsi += costPerPortion;
          bahanRows.push([
            'Kemasan',
            inv.name, 
            `${item.useQty} ${item.useUnit}`, 
            formatRp(costTotal),
            formatRp(costPerPortion)
          ]);
        }
      });
    }

    if (bahanRows.length === 0) {
       bahanRows.push(['-', 'Belum ada bahan', '-', '-', '-']);
    }

    autoTable(doc, {
      startY: currentY,
      head: [['Kategori', 'Nama Item', 'Takaran Total', `Total Modal (${portions} Porsi)`, 'Modal / Porsi']],
      body: bahanRows,
      foot: [['', '', 'TOTAL HPP KESELURUHAN', formatRp(sumTotalModal), formatRp(sumModalPerPorsi)]],
      theme: 'striped',
      headStyles: { fillColor: [71, 85, 105] },
      footStyles: { fillColor: [30, 41, 59], fontStyle: 'bold', textColor: 255 },
      margin: { left: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 12;
    
    // Disclaimer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(239, 68, 68); // Red-500 for emphasis
    doc.text('* Catatan Penting:', 14, currentY);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text('Keuntungan di atas hanya perhitungan kotor dari Harga Jual dikurangi Modal Bahan (HPP) & Kemasan.', 43, currentY);
    
    currentY += 5;
    doc.text('Angka tersebut BELUM dipotong dengan Biaya Operasional (Sewa Tempat, Gaji Karyawan, Listrik, dll).', 43, currentY);

    currentY += 12;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text('Digenerate otomatis oleh Hitung Cuan - Kalkulator HPP UMKM F&B', 14, currentY);

    doc.save(`HPP_Laporan_${(project.menuName || 'Resep').replace(/\s+/g, '_')}.pdf`);
  } catch (err) {
    console.error('PDF Generation Error:', err);
    alert('Gagal mencetak PDF: ' + err.message);
  }
};
