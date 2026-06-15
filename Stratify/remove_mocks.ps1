$files = Get-ChildItem "tests\api\uc*.test.js"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $content = $content -replace "(?s)jest\.mock\('axios', \(\) => \(\{.*?\n\}\)\);", "jest.mock('axios');"
    Set-Content $file.FullName $content -NoNewline
    Write-Host "Removed inline mock: $($file.Name)"
}
Write-Host "Done."
