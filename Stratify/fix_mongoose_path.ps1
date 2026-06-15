$files = Get-ChildItem "tests\api\uc*.test.js"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $content = $content -replace "require\('\.\./setup/mongoose'\)", "require('./setup/mongoose')"
    Set-Content $file.FullName $content -NoNewline
    Write-Host "Fixed mongoose path: $($file.Name)"
}
Write-Host "Done."
