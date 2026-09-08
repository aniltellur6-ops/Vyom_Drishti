import csv
import numpy as np

# Computed transformation matrix from LightGlue Matching Pipeline
# Maps coordinates from Moving Image to Reference Image space
TRANSFORM = np.array([
    [1.0785112223373448, -0.1326396744534822, -55.790016626554305],
    [0.1326396744534822, 1.0785112223373448, -124.78306344644827],
    [0.0, 0.0, 1.0]
])

def apply_transform(pixel, scan, matrix):
    # Note: Assuming Pixel = X, Scan = Y
    point = np.array([pixel, scan, 1.0])
    transformed = matrix.dot(point)
    return transformed[0], transformed[1]

def main():
    input_file = 'user_coords.csv'
    output_file = 'transformed_coords.csv'

    print(f"Reading base coordinates from {input_file}...")
    
    with open(input_file, mode='r') as infile, open(output_file, mode='w', newline='') as outfile:
        reader = csv.DictReader(infile)
        
        # Prepare output headers
        fieldnames = ['Longitude', 'Latitude', 'Original_Pixel', 'Original_Scan', 'Transformed_Pixel', 'Transformed_Scan']
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()

        for row in reader:
            lon = row['Longitude']
            lat = row['Latitude']
            pixel = float(row['Pixel'])
            scan = float(row['Scan'])

            # Apply geometric transformation
            t_pixel, t_scan = apply_transform(pixel, scan, TRANSFORM)
            
            writer.writerow({
                'Longitude': lon,
                'Latitude': lat,
                'Original_Pixel': pixel,
                'Original_Scan': scan,
                'Transformed_Pixel': round(t_pixel, 2),
                'Transformed_Scan': round(t_scan, 2)
            })

    print(f"Georeferencing complete! Mapped coordinates saved to {output_file}.")

if __name__ == '__main__':
    main()
