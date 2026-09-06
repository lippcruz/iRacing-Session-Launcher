from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "build-assets" / "app.ico"
OUT.parent.mkdir(parents=True, exist_ok=True)

size = 256
img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

draw.rounded_rectangle((18, 18, 238, 238), radius=54, fill=(15, 108, 189, 255))
draw.rounded_rectangle((34, 34, 222, 222), radius=42, outline=(255, 255, 255, 64), width=3)
draw.arc((60, 66, 196, 204), start=205, end=335, fill=(255, 255, 255, 230), width=18)
draw.arc((82, 86, 174, 180), start=206, end=334, fill=(255, 255, 255, 156), width=10)
draw.ellipse((116, 176, 140, 200), fill=(255, 255, 255, 245))

try:
    font = ImageFont.truetype("segoeuib.ttf", 72)
except OSError:
    font = ImageFont.load_default()

draw.text((128, 92), "iR", anchor="mm", fill=(255, 255, 255, 255), font=font)

img.save(OUT, sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
print(OUT)
