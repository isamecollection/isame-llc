# make-invoice.ps1
# Creates a formatted Excel invoice

$ErrorActionPreference = "Stop"

$cwd = (Get-Location).Path
$outPath = Join-Path $cwd "isame-invoice-2026-09.xlsx"
$pdfPath = Join-Path $cwd "isame-invoice-2026-09.pdf"

Write-Host "Working directory: $cwd"
Write-Host "Excel target:      $outPath"
Write-Host "PDF target:        $pdfPath"
Write-Host ""

try {
    $excel = New-Object -ComObject Excel.Application
} catch {
    Write-Host "ERROR: Excel is not installed or COM registration is broken." -ForegroundColor Red
    exit 1
}

$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    $wb = $excel.Workbooks.Add()
    $ws = $wb.Worksheets.Item(1)
    $ws.Name = "Invoice"

    $ws.Columns.Item(1).ColumnWidth = 22
    $ws.Columns.Item(2).ColumnWidth = 48
    $ws.Columns.Item(3).ColumnWidth = 10
    $ws.Columns.Item(4).ColumnWidth = 10
    $ws.Columns.Item(5).ColumnWidth = 14

    $ws.Cells.Item(1, 1).Value = "KenCo Consultance"
    $ws.Cells.Item(1, 1).Font.Size = 20
    $ws.Cells.Item(1, 1).Font.Bold = $true
    $ws.Cells.Item(1, 1).Font.Color = 6307665
    $ws.Range("A1:E1").Merge()

    $ws.Cells.Item(2, 1).Value = "Software & Systems Consulting"
    $ws.Cells.Item(2, 1).Font.Size = 10
    $ws.Cells.Item(2, 1).Font.Italic = $true
    $ws.Range("A2:E2").Merge()

    $ws.Cells.Item(4, 1).Value = "INVOICE"
    $ws.Cells.Item(4, 1).Font.Size = 16
    $ws.Cells.Item(4, 1).Font.Bold = $true
    $ws.Cells.Item(4, 1).HorizontalAlignment = -4152

    $ws.Cells.Item(4, 2).Value = "Invoice #: KC-2026-0913"
    $ws.Cells.Item(4, 2).HorizontalAlignment = -4152
    $ws.Cells.Item(5, 2).Value = "Date: September 13, 2026"
    $ws.Cells.Item(5, 2).HorizontalAlignment = -4152
    $ws.Cells.Item(6, 2).Value = "Period: Sept 12-13, 2026"
    $ws.Cells.Item(6, 2).HorizontalAlignment = -4152

    $ws.Cells.Item(8, 1).Value = "FROM"
    $ws.Cells.Item(8, 1).Font.Bold = $true
    $ws.Cells.Item(9, 1).Value = "Kenneth Bladon"
    $ws.Cells.Item(9, 1).Font.Bold = $true
    $ws.Cells.Item(10, 1).Value = "KenCo Consultance"
    $ws.Cells.Item(11, 1).Value = "kbbladon@gmail.com"
    $ws.Cells.Item(12, 1).Value = "+501 636-8137"

    $ws.Cells.Item(8, 3).Value = "BILL TO"
    $ws.Cells.Item(8, 3).Font.Bold = $true
    $ws.Cells.Item(9, 3).Value = "Isame Credit Collection Ltd"
    $ws.Cells.Item(9, 3).Font.Bold = $true
    $ws.Cells.Item(10, 3).Value = "Belize City, Belize"
    $ws.Cells.Item(11, 3).Value = "Attn: Accounts Payable"

    $row = 14
    $ws.Cells.Item($row, 1).Value = "FIXES @ `$50/hr"
    $ws.Cells.Item($row, 1).Font.Bold = $true
    $ws.Cells.Item($row, 1).Font.Size = 11
    $ws.Range("A$row`:E$row").Interior.Color = 14803425
    $row++

    $headers = @("Category", "Description", "Hours", "Rate", "Amount")
    for ($i = 0; $i -lt $headers.Length; $i++) {
        $cell = $ws.Cells.Item($row, $i + 1)
        $cell.Value = $headers[$i]
        $cell.Font.Bold = $true
        $cell.Font.Color = 16777215
        $cell.Interior.Color = 6307665
        $cell.HorizontalAlignment = -4108
    }
    $row++

    $fixItems = @(
        @("Balance discrepancy investigation", 2.5, 50, 125.00),
        @("Payment hook rewrite + API route patches", 2.0, 50, 100.00),
        @("BalanceAdjustments collection + field lock", 2.0, 50, 100.00),
        @("Production backup + verification", 1.0, 50, 50.00),
        @("Data audit scripts", 1.5, 50, 75.00),
        @("Reconciliation (24 accounts fixed)", 1.5, 50, 75.00),
        @("Role switcher cookie fixes", 1.0, 50, 50.00),
        @("Corrupted layout.tsx restoration", 1.5, 50, 75.00),
        @("Users collection security fixes", 1.5, 50, 75.00),
        @("Reset-password / CRMSettings / Accounts fixes", 1.0, 50, 50.00),
        @("Type regen + build + deploy", 1.0, 50, 50.00)
    )

    foreach ($item in $fixItems) {
        $ws.Cells.Item($row, 1).Value = "Fix"
        $ws.Cells.Item($row, 2).Value = $item[0]
        $ws.Cells.Item($row, 3).Value2 = [double]$item[1]
        $ws.Cells.Item($row, 4).Value2 = [double]$item[2]
        $ws.Cells.Item($row, 5).Value2 = [double]$item[3]
        $row++
    }

    $ws.Cells.Item($row, 2).Value = "FIXES SUBTOTAL"
    $ws.Cells.Item($row, 2).Font.Bold = $true
    $ws.Cells.Item($row, 3).Value2 = [double]16.5
    $ws.Cells.Item($row, 3).Font.Bold = $true
    $ws.Cells.Item($row, 5).Value2 = [double]825.00
    $ws.Cells.Item($row, 5).Font.Bold = $true
    $ws.Range("A$row`:E$row").Interior.Color = 15921906
    $row += 2

    $ws.Cells.Item($row, 1).Value = "NEW FEATURE @ `$100/hr"
    $ws.Cells.Item($row, 1).Font.Bold = $true
    $ws.Cells.Item($row, 1).Font.Size = 11
    $ws.Range("A$row`:E$row").Interior.Color = 14803425
    $row++

    for ($i = 0; $i -lt $headers.Length; $i++) {
        $cell = $ws.Cells.Item($row, $i + 1)
        $cell.Value = $headers[$i]
        $cell.Font.Bold = $true
        $cell.Font.Color = 16777215
        $cell.Interior.Color = 6307665
        $cell.HorizontalAlignment = -4108
    }
    $row++

    $featureItems = @(
        @("Report design + requirements", 0.5, 100, 50.00),
        @("JSON + CSV API route", 1.0, 100, 100.00),
        @("PDF API route", 1.5, 100, 150.00),
        @("CollectorCollections.tsx component", 2.0, 100, 200.00),
        @("Dedicated page + reports page link", 0.5, 100, 50.00),
        @("Stale filter detection + UX", 0.5, 100, 50.00),
        @("End-to-end verification", 0.5, 100, 50.00)
    )

    foreach ($item in $featureItems) {
        $ws.Cells.Item($row, 1).Value = "Feature"
        $ws.Cells.Item($row, 2).Value = $item[0]
        $ws.Cells.Item($row, 3).Value2 = [double]$item[1]
        $ws.Cells.Item($row, 4).Value2 = [double]$item[2]
        $ws.Cells.Item($row, 5).Value2 = [double]$item[3]
        $row++
    }

    $ws.Cells.Item($row, 2).Value = "FEATURE SUBTOTAL"
    $ws.Cells.Item($row, 2).Font.Bold = $true
    $ws.Cells.Item($row, 3).Value2 = [double]6.5
    $ws.Cells.Item($row, 3).Font.Bold = $true
    $ws.Cells.Item($row, 5).Value2 = [double]650.00
    $ws.Cells.Item($row, 5).Font.Bold = $true
    $ws.Range("A$row`:E$row").Interior.Color = 15921906
    $row += 2

    $ws.Cells.Item($row, 3).Value = "TOTAL HOURS"
    $ws.Cells.Item($row, 3).Font.Bold = $true
    $ws.Cells.Item($row, 3).Font.Size = 12
    $ws.Cells.Item($row, 3).HorizontalAlignment = -4152
    $ws.Cells.Item($row, 4).Value2 = [double]23.0
    $ws.Cells.Item($row, 4).Font.Bold = $true
    $ws.Cells.Item($row, 4).Font.Size = 12
    $ws.Cells.Item($row, 4).HorizontalAlignment = -4152

    $ws.Cells.Item($row + 1, 3).Value = "TOTAL DUE"
    $ws.Cells.Item($row + 1, 3).Font.Bold = $true
    $ws.Cells.Item($row + 1, 3).Font.Size = 14
    $ws.Cells.Item($row + 1, 3).HorizontalAlignment = -4152
    $ws.Cells.Item($row + 1, 4).Value2 = [double]1475.00
    $ws.Cells.Item($row + 1, 4).Font.Bold = $true
    $ws.Cells.Item($row + 1, 4).Font.Size = 14
    $ws.Cells.Item($row + 1, 4).Font.Color = 6307665
    $ws.Cells.Item($row + 1, 4).HorizontalAlignment = -4152

    $ws.Range("C$($row+1):D$($row+1)").Borders.LineStyle = 1
    $ws.Range("C$($row+1):D$($row+1)").Borders.Weight = 3
    $row += 3

    $ws.Cells.Item($row, 1).Value = "PAYMENT TERMS"
    $ws.Cells.Item($row, 1).Font.Bold = $true
    $ws.Cells.Item($row, 2).Value = "Net 15 - due by September 28, 2026"
    $row++
    $ws.Cells.Item($row, 2).Value = "Bank transfer, Zelle, or PayPal"
    $row++
    $ws.Cells.Item($row, 2).Value = "Please reference Invoice # KC-2026-0913"
    $row += 2

    $ws.Cells.Item($row, 1).Value = "DELIVERABLES"
    $ws.Cells.Item($row, 1).Font.Bold = $true
    $row++
    $deliverables = @(
        "24 production accounts reconciled (15490QB corrected to $3,124)",
        "4 security vulnerabilities closed",
        "Balance write path audited and locked",
        "New Collector Collections report deployed",
        "Full production database backup verified"
    )
    foreach ($d in $deliverables) {
        $ws.Cells.Item($row, 1).Value = "OK"
        $ws.Cells.Item($row, 1).Font.Color = 4521796
        $ws.Cells.Item($row, 2).Value = $d
        $row++
    }

    $row++
    $ws.Cells.Item($row, 1).Value = "Thank you for your business."
    $ws.Cells.Item($row, 1).Font.Italic = $true
    $ws.Cells.Item($row, 1).Font.Size = 11
    $ws.Cells.Item($row, 1).Font.Color = 6307665
    $ws.Range("A$row`:E$row").Merge()

    $ws.Range("D15:E$row").NumberFormat = '"$"#,##0.00'
    $ws.Range("A14:E$($row-4)").Borders.LineStyle = 1
    $ws.Range("A14:E$($row-4)").Borders.Color = 13421772

    $ws.PageSetup.Orientation = 1
    $ws.PageSetup.FitToPagesWide = 1
    $ws.PageSetup.FitToPagesTall = $false

    $wb.SaveAs($outPath, 51)
    Write-Host "Excel saved: $outPath" -ForegroundColor Green

    try {
        $wb.ExportAsFixedFormat(0, $pdfPath)
        Write-Host "PDF saved: $pdfPath" -ForegroundColor Green
    } catch {
        Write-Host "PDF export failed: $_" -ForegroundColor Yellow
    }

    $wb.Close($false)

} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ws) | Out-Null
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($wb) | Out-Null
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    [GC]::Collect()
}

Write-Host ""
Write-Host "=== Final files ===" -ForegroundColor Cyan
Get-ChildItem isame-invoice-2026-09.* | Select-Object Name, Length | Format-Table

