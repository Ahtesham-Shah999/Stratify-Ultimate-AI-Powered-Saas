$files = Get-ChildItem "tests\api\uc*.test.js"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    # Fix setup/fixtures paths
    $content = $content -replace "require\('\.\./setup/testServer'\)", "require('./setup/testServer')"
    $content = $content -replace "require\('\.\./fixtures/mockData'\)", "require('./fixtures/mockData')"
    # Fix backend paths (../../../backend → ../../backend)
    $content = $content -replace "\.\./\.\./\.\./backend/", "../../backend/"
    Set-Content $file.FullName $content -NoNewline
    Write-Host "Fixed: $($file.Name)"
}
Write-Host "Done."
