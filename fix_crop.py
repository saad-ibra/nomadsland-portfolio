from PIL import Image

img = Image.open('/Users/saadibrahimkhan/.gemini/antigravity/brain/c570ffe4-3782-4dab-877f-c06de6223fe9/.user_uploaded/media_1788035641512.png')
# crop(left, top, right, bottom)
# The small circle is from x=0 to x=235. The rest is butterflies + text.
cropped = img.crop((240, 0, img.width, img.height))
cropped.save('public/doodle-butterflies.png')
print("Cropped out the left circle, keeping butterflies and handwritten text!")
