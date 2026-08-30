from PIL import Image

img = Image.open('public/doodle-butterflies.png')
pixels = img.load()
width, height = img.size

# Erase small circle on left (0 to 210)
for x in range(0, 210):
    for y in range(height):
        pixels[x, y] = (0, 0, 0, 0)

# Erase text on right (580 to 771)
for x in range(580, width):
    for y in range(height):
        pixels[x, y] = (0, 0, 0, 0)

img.save('public/doodle-butterflies.png')
print("Erased left circle and right text, preserved center butterfly doodle")
