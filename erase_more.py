from PIL import Image
img = Image.open('public/doodle-butterflies.png')
pixels = img.load()
width, height = img.size
for x in range(int(width * 0.60), width):
    for y in range(height):
        pixels[x, y] = (0, 0, 0, 0)
img.save('public/doodle-butterflies.png')
print("Erased more")
