# PowerShell script to clean up corrupted storage.ts file
# This script will help identify and remove duplicate methods

Write-Host "🔍 Analyzing storage.ts file for duplicates..." -ForegroundColor Yellow

$filePath = "storage.ts"
$content = Get-Content $filePath -Raw

# Find all occurrences of the problematic methods
$methods = @(
    "getUserFirstCampaign",
    "getCampaignSlotInfo", 
    "getMonthlyLimitRecord"
)

foreach ($method in $methods) {
    Write-Host "`n📋 Looking for duplicates of: $method" -ForegroundColor Cyan
    
    # Count occurrences
    $count = ([regex]::Matches($content, "async $method\(")).Count
    Write-Host "   Found $count occurrences" -ForegroundColor White
    
    if ($count -gt 1) {
        Write-Host "   ⚠️  DUPLICATES DETECTED!" -ForegroundColor Red
        Write-Host "   You need to manually remove the extra copies" -ForegroundColor Red
    } else {
        Write-Host "   ✅ No duplicates found" -ForegroundColor Green
    }
}

Write-Host "`n📝 MANUAL CLEANUP INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "1. Open storage.ts in your editor" -ForegroundColor White
Write-Host "2. Search for each method name" -ForegroundColor White
Write-Host "3. Keep ONLY the FIRST occurrence of each method" -ForegroundColor White
Write-Host "4. Remove ALL other duplicates" -ForegroundColor White
Write-Host "5. Save the file" -ForegroundColor White

Write-Host "`n🔧 RECOMMENDED APPROACH:" -ForegroundColor Yellow
Write-Host "1. Make a backup: Copy-Item 'storage.ts' 'storage.ts.backup2'" -ForegroundColor White
Write-Host "2. Open the file and remove duplicates manually" -ForegroundColor White
Write-Host "3. Test with: npm run dev" -ForegroundColor White

Write-Host "`n⚠️  WARNING: This file is corrupted with duplicates!" -ForegroundColor Red
Write-Host "   Manual intervention required to fix it properly." -ForegroundColor Red
