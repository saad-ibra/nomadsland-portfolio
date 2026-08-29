from PIL import Image

# Open the image
img = Image.open('public/doodle-butterflies.png')
pixels = img.load()

# The image is 772x323. The drawing is on the left, the text is on the right.
# We can just make the right 40% of the image transparent.
width, height = img.size
for x in range(int(width * 0.65), width):
    for y in range(height):
        pixels[x, y] = (0, 0, 0, 0)

img.save('public/doodle-butterflies.png')
print("Erased right 35% of image")
