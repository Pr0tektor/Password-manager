Add-Type -AssemblyName System.Drawing
$iconRoot = Join-Path (Split-Path -Parent $PSScriptRoot) 'icons'
New-Item -ItemType Directory -Path $iconRoot -Force | Out-Null
function New-RoundedPath([single]$x,[single]$y,[single]$w,[single]$h,[single]$r) {
  $shape = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $d = $r * 2
  $shape.AddArc($x,$y,$d,$d,180,90)
  $shape.AddArc($x+$w-$d,$y,$d,$d,270,90)
  $shape.AddArc($x+$w-$d,$y+$h-$d,$d,$d,0,90)
  $shape.AddArc($x,$y+$h-$d,$d,$d,90,90)
  $shape.CloseFigure()
  return $shape
}
foreach ($iconSpec in @(@(192,'icon-192.png',$false),@(512,'icon-512.png',$false),@(512,'icon-maskable-512.png',$true))) {
  $size = [int]$iconSpec[0]
  $bitmap = [System.Drawing.Bitmap]::new($size,$size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $blue = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#0066cc'))
  $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::White,2.5)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.ScaleTransform($size/48.0,$size/48.0)
  $background = New-RoundedPath 0 0 48 48 10
  if ($iconSpec[2]) { $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#0066cc')); $graphics.TranslateTransform(4.8,4.8); $graphics.ScaleTransform(0.8,0.8) }
  else { $graphics.Clear([System.Drawing.Color]::Transparent); $graphics.FillPath($blue,$background) }
  $bodyPath = New-RoundedPath 13 22 22 18 4
  $graphics.DrawPath($pen,$bodyPath)
  $graphics.DrawArc($pen,17,8,14,14,180,180)
  $graphics.DrawLine($pen,17,15,17,22)
  $graphics.DrawLine($pen,31,15,31,22)
  $graphics.DrawLine($pen,24,28,24,33)
  $bitmap.Save((Join-Path $iconRoot $iconSpec[1]),[System.Drawing.Imaging.ImageFormat]::Png)
  $bodyPath.Dispose(); $background.Dispose(); $pen.Dispose(); $blue.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}
