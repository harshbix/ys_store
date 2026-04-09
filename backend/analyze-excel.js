import XLSX from 'xlsx';

const filePath = './custom builds/pc_builds_master_populated.xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  
  console.log('=== WORKBOOK ANALYSIS ===\n');
  console.log('Sheet Names:', workbook.SheetNames);
  console.log('\n' + '='.repeat(50) + '\n');
  
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Sheet: "${sheetName}"`);
    console.log(`   Rows: ${data.length}`);
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      console.log(`   Columns (${headers.length}):`, headers);
      
      console.log(`\n   Sample Data (first ${Math.min(3, data.length)} rows):`);
      data.slice(0, 3).forEach((row, idx) => {
        console.log(`   Row ${idx + 1}:`, JSON.stringify(row, null, 2));
      });
    }
    
    console.log('\n' + '-'.repeat(80) + '\n');
  });
} catch (error) {
  console.error('Error reading Excel file:', error.message);
  process.exit(1);
}
