Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("C:\Users\HP\Documents\ATM\groceries_app\assets\images\logo.png")
$width = 1024
$height = 1024
$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$scale = [math]::Min($width / $img.Width, $height / $img.Height) * 0.8
$newW = [int]($img.Width * $scale)
$newH = [int]($img.Height * $scale)
$x = [int](($width - $newW) / 2)
$y = [int](($height - $newH) / 2)
$g.DrawImage($img, $x, $y, $newW, $newH)
$g.Dispose()
$bmp.Save("C:\Users\HP\Documents\ATM\groceries_app\assets\images\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$img.Dispose()
