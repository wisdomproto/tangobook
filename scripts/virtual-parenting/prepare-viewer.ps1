param([string]$OutputDirectory='D:/ComfyUI-output/virtual-parenting-20261006')
$ErrorActionPreference='Stop'
$taskRoot=[System.IO.Path]::GetFullPath($OutputDirectory)
$taskVendor=Join-Path $taskRoot 'vendor'
New-Item -ItemType Directory -Force -Path $taskRoot,$taskVendor,"$taskVendor/addons/controls","$taskVendor/addons/loaders","$taskVendor/addons/utils" | Out-Null
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'index.html') -Destination (Join-Path $taskRoot 'index.html')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'comparison.html') -Destination (Join-Path $taskRoot 'comparison.html')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'layout-v3.html') -Destination (Join-Path $taskRoot 'layout-v3.html')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'feed-v3.html') -Destination (Join-Path $taskRoot 'feed-v3.html')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'feed-v3-shots.json') -Destination (Join-Path $taskRoot 'feed-v3-shots.json')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'photoreal-v4.html') -Destination (Join-Path $taskRoot 'photoreal-v4.html')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'photoreal-v4-shots.json') -Destination (Join-Path $taskRoot 'photoreal-v4-shots.json')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'materials-v5.html') -Destination (Join-Path $taskRoot 'materials-v5.html')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'materials-v5-shots.json') -Destination (Join-Path $taskRoot 'materials-v5-shots.json')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'feed-v5.html') -Destination (Join-Path $taskRoot 'feed-v5.html')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'feed-v5-shots.json') -Destination (Join-Path $taskRoot 'feed-v5-shots.json')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'carousel-v6.html') -Destination (Join-Path $taskRoot 'carousel-v6.html')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'carousel-v6-shots.json') -Destination (Join-Path $taskRoot 'carousel-v6-shots.json')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'study-v7.html') -Destination (Join-Path $taskRoot 'study-v7.html')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'study-v7-shots.json') -Destination (Join-Path $taskRoot 'study-v7-shots.json')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'study-v7-assets.json') -Destination (Join-Path $taskRoot 'study-v7-assets.json')
$taskFiles=@('build/three.module.js','build/three.core.js','examples/jsm/controls/OrbitControls.js','examples/jsm/loaders/GLTFLoader.js','examples/jsm/utils/BufferGeometryUtils.js','LICENSE')
foreach($taskFile in $taskFiles){
    $taskRelative=if($taskFile.StartsWith('build/')){$taskFile.Substring(6)}elseif($taskFile.StartsWith('examples/jsm/')){'addons/'+$taskFile.Substring(13)}else{'THREE-LICENSE.txt'}
    Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/three@0.180.0/$taskFile" -OutFile (Join-Path $taskVendor $taskRelative)
}
Write-Output "Viewer prepared: $taskRoot"
