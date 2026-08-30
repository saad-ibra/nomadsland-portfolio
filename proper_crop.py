from PIL import Image

# We know the butterfly circle is strictly between x=240 and x=575
img = Image.open('public/doodle-butterflies.png')
# crop(left, top, right, bottom)
cropped = img.crop((240, 0, 580, img.height))
cropped.save('public/doodle-butterflies.png')
print("Perfectly cropped to the butterfly drawing!")
