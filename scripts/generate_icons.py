import zlib
import struct
import math
import os

def write_png(filename, width, height, rgba_data):
    def make_chunk(chunk_type, data):
        c = chunk_type + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)

    header = b'\x89PNG\r\n\x1a\n'
    ihdr = make_chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))

    scanlines = bytearray()
    for y in range(height):
        scanlines.append(0) # Filter type 0 (None)
        start = y * width * 4
        scanlines.extend(rgba_data[start:start + width * 4])

    idat = make_chunk(b'IDAT', zlib.compress(bytes(scanlines), 9))
    iend = make_chunk(b'IEND', b'')

    with open(filename, 'wb') as f:
        f.write(header + ihdr + idat + iend)

def generate_icon(size, is_maskable=False):
    rgba = bytearray(size * size * 4)
    cx, cy = size / 2.0, size / 2.0

    # Color definitions
    # Indigo: #4f46e5 (79, 70, 229) -> Purple: #9333ea (147, 51, 234) -> Pink: #ec4899 (236, 72, 153)
    c1 = (79, 70, 229)
    c2 = (147, 51, 234)
    c3 = (236, 72, 153)

    corner_radius = size * 0.22 if not is_maskable else 0

    disc_r = size * (0.28 if is_maskable else 0.35)
    core_r = disc_r * 0.40
    hole_r = disc_r * 0.12

    for y in range(size):
        for x in range(size):
            idx = (y * size + x) * 4
            
            # Check rounded corner bounds for non-maskable
            in_bounds = True
            if not is_maskable:
                # distance to closest corner if outside inner rect
                min_x = corner_radius
                max_x = size - 1 - corner_radius
                min_y = corner_radius
                max_y = size - 1 - corner_radius
                
                check_x = min_x if x < min_x else (max_x if x > max_x else x)
                check_y = min_y if y < min_y else (max_y if y > max_y else y)
                dist_corner = math.hypot(x - check_x, y - check_y)
                if dist_corner > corner_radius:
                    in_bounds = False

            if not in_bounds:
                rgba[idx:idx+4] = b'\x00\x00\x00\x00'
                continue

            # Diagonal gradient factor (0 to 1)
            t = (x + (size - 1 - y)) / (2.0 * size)
            t = max(0.0, min(1.0, t))
            if t < 0.5:
                sub_t = t * 2.0
                bg_r = int(c1[0] + (c2[0] - c1[0]) * sub_t)
                bg_g = int(c1[1] + (c2[1] - c1[1]) * sub_t)
                bg_b = int(c1[2] + (c2[2] - c1[2]) * sub_t)
            else:
                sub_t = (t - 0.5) * 2.0
                bg_r = int(c2[0] + (c3[0] - c2[0]) * sub_t)
                bg_g = int(c2[1] + (c3[1] - c2[1]) * sub_t)
                bg_b = int(c2[2] + (c3[2] - c2[2]) * sub_t)

            dist_center = math.hypot(x - cx, y - cy)

            if dist_center <= hole_r:
                # Center hole
                rgba[idx:idx+4] = bytes([12, 13, 20, 255])
            elif dist_center <= core_r:
                # Disc center gradient
                rgba[idx:idx+4] = bytes([bg_r, bg_g, bg_b, 255])
            elif dist_center <= disc_r:
                # Vinyl record body (dark metallic charcoal with grooves)
                groove = math.sin(dist_center * 0.8) * 12
                v = max(16, min(40, int(22 + groove)))
                rgba[idx:idx+4] = bytes([v, v, int(v * 1.3), 255])
            else:
                rgba[idx:idx+4] = bytes([bg_r, bg_g, bg_b, 255])

    return rgba

os.makedirs('public', exist_ok=True)
print("Generating pwa-192x192.png...")
write_png('public/pwa-192x192.png', 192, 192, generate_icon(192, False))

print("Generating pwa-512x512.png...")
write_png('public/pwa-512x512.png', 512, 512, generate_icon(512, False))

print("Generating pwa-maskable-512x512.png...")
write_png('public/pwa-maskable-512x512.png', 512, 512, generate_icon(512, True))

print("Generating apple-touch-icon.png (180x180)...")
write_png('public/apple-touch-icon.png', 180, 180, generate_icon(180, False))

print("Generating favicon (32x32)...")
write_png('public/favicon.ico', 32, 32, generate_icon(32, False))

print("All icons generated successfully!")
