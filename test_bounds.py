from PIL import Image

img = Image.open('public/doodle-butterflies.png')
pixels = img.load()
width, height = img.size

# Find the bounds of the drawing by looking at non-transparent pixels
def col_has_pixels(x):
    for y in range(height):
        if pixels[x, y][3] > 10:  # alpha > 10
            return True
    return False

# Print columns with pixels
cols = []
for x in range(width):
    if col_has_pixels(x):
        cols.append(x)

# Group into continuous segments
segments = []
start = cols[0]
for i in range(1, len(cols)):
    if cols[i] != cols[i-1] + 1:
        segments.append((start, cols[i-1]))
        start = cols[i]
segments.append((start, cols[-1]))

print(segments)
