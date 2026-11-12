# 把 content\*.md 打包成 js\content-bundle.js（Windows，免安裝 Python）
$root = Split-Path -Parent $PSScriptRoot
$map = [ordered]@{}
Get-ChildItem -Path (Join-Path $root 'content') -Filter *.md | Sort-Object Name | ForEach-Object {
  $map["content/$($_.Name)"] = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
}
$json = $map | ConvertTo-Json -Depth 3
$out = "/* 自動產生：請編輯 content/*.md 後執行 tools/更新教材.bat */`nwindow.CONTENT = $json;`n"
[System.IO.File]::WriteAllText((Join-Path $root 'js\content-bundle.js'), $out, (New-Object System.Text.UTF8Encoding $false))
Write-Host "已更新 js\content-bundle.js（$($map.Count) 份教材）"
