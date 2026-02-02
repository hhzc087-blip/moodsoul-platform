// MoodSoul Cube - Custom Case V3.1
// Based on provided 2D Layout Diagrams
// Units: mm

/* [Global Settings] */
$fn = 60;

/* [Dimensions] */
case_x = 62.2;
case_y = 62.2;
case_z = 36.0;

wall_thickness = 4.0; // Side walls
front_face_thickness = 2.0;
back_face_thickness = 2.3;

// Magnet Settings
mag_d = 6.2;
mag_h = 3.2;

// --- 2D Shapes for Cutouts ---

module shape_front_window() {
    // Large rounded square in center
    // Est: 45x45mm based on 54mm body
    square_size = 46; 
    offset = (62.2 - square_size) / 2;
    translate([offset, offset])
        minkowski() {
            square([square_size-4, square_size-4]);
            circle(r=2);
        }
}

module shape_top_cutout() {
    // Wide rectangle with center slot
    // 62.2mm width context
    // Looks like 30mm wide, 15mm high?
    
    rect_w = 32;
    rect_h = 18;
    
    // Center it
    start_x = (62.2 - rect_w) / 2;
    start_y = (36.0 - rect_h) / 2 + 5; // Shifted up slightly
    
    union() {
        // Main rectangle
        translate([start_x, start_y])
            minkowski() {
                square([rect_w-4, rect_h-4]);
                circle(r=2);
            }
        
        // Vertical slot
        slot_w = 6;
        slot_h = 15;
        translate([(62.2 - slot_w)/2, start_y - 5])
            square([slot_w, slot_h]);
    }
}

module shape_bottom_cutout() {
    // Two small squares
    sq_size = 10;
    gap = 8;
    
    start_y = (36.0 - sq_size) / 2;
    center_x = 62.2 / 2;
    
    // Left Square
    translate([center_x - gap/2 - sq_size, start_y])
        minkowski() {
            square([sq_size-2, sq_size-2]);
            circle(r=1);
        }
        
    // Right Square
    translate([center_x + gap/2, start_y])
        minkowski() {
            square([sq_size-2, sq_size-2]);
            circle(r=1);
        }
}

module shape_right_cutout() {
    // Vertical slot with side notch
    slot_w = 12;
    slot_h = 35;
    
    start_x = (36.0 - slot_w) / 2; // On the 36mm side face
    start_y = (62.2 - slot_h) / 2;
    
    union() {
        // Vertical Slot
        translate([start_x, start_y])
            minkowski() {
                square([slot_w-2, slot_h-2]);
                circle(r=1);
            }
            
        // Notch
        notch_w = 6;
        notch_h = 8;
        translate([start_x - 3, (62.2 - notch_h)/2])
             square([notch_w, notch_h]);
    }
}

// --- Magnet Layouts (Blue Dots) ---

module magnets_front() {
    // 8 Magnets: 4 Corners + 4 Midpoints
    inset = 6;
    mid_x = 62.2 / 2;
    mid_y = 62.2 / 2;
    
    // Corners
    translate([inset, inset]) circle(d=mag_d);
    translate([62.2-inset, inset]) circle(d=mag_d);
    translate([inset, 62.2-inset]) circle(d=mag_d);
    translate([62.2-inset, 62.2-inset]) circle(d=mag_d);
    
    // Mids
    translate([mid_x, inset]) circle(d=mag_d);
    translate([mid_x, 62.2-inset]) circle(d=mag_d);
    translate([inset, mid_y]) circle(d=mag_d);
    translate([62.2-inset, mid_y]) circle(d=mag_d);
}

module magnets_3_linear(len) {
    // 3 Magnets: Start, Mid, End
    inset = 6;
    translate([inset, 0]) circle(d=mag_d);
    translate([len/2, 0]) circle(d=mag_d);
    translate([len-inset, 0]) circle(d=mag_d);
}

module magnets_5_cross() {
    // 5 Magnets: 4 Corners + 1 Center
    inset = 6;
    mid = 62.2 / 2;
    translate([inset, inset]) circle(d=mag_d);
    translate([62.2-inset, inset]) circle(d=mag_d);
    translate([inset, 62.2-inset]) circle(d=mag_d);
    translate([62.2-inset, 62.2-inset]) circle(d=mag_d);
    translate([mid, mid]) circle(d=mag_d);
}

// --- 3D Construction ---

module main_case() {
    difference() {
        // 1. Solid Block
        translate([2, 2, 0]) minkowski() {
            cube([case_x-4, case_y-4, case_z-1]);
            cylinder(r=2, h=1);
        }
        
        // 2. Hollow Interior
        translate([(case_x-54.2)/2, (case_y-54.2)/2, front_face_thickness])
            cube([54.2, 54.2, case_z]); // Goes through back
            
        // 3. Front Face Cutout (Z=0)
        translate([0, 0, -1]) linear_extrude(10) shape_front_window();
        
        // 4. Top Face Cutout (Y=Max)
        translate([0, 62.2, 0]) 
            rotate([90, 0, 0]) 
            translate([0, 0, -10]) // Start 'above' and cut down
            linear_extrude(20) shape_top_cutout();
            
        // 5. Bottom Face Cutout (Y=0)
        translate([0, 0, 0]) 
            rotate([90, 0, 0]) 
            translate([0, 0, -10]) // Start 'below' (Global Y>0) and cut 'up' (Global Y<0)? 
            // Logic Check: 
            // rotate([90,0,0]) maps Z_local -> -Y_global.
            // translate Z=-10 -> Global Y=10.
            // Extrude +20 (Z) -> Global Y moves by -20.
            // Path: Y=10 to Y=-10. Intersects Y=0 face. Correct.
            linear_extrude(20) shape_bottom_cutout();
            
        // 6. Right Face Cutout (X=Max)
        translate([62.2, 0, 0])
            rotate([0, -90, 0])
            translate([0, 0, -10])
            linear_extrude(20) shape_right_cutout();
            
        // --- Magnet Holes (Embedding) ---
        
        // Front Magnets
        translate([0, 0, front_face_thickness - mag_h]) 
            linear_extrude(mag_h + 0.1) magnets_front();
            
        // Top Magnets (3)
        translate([0, 62.2 - mag_h, 36/2]) 
            rotate([90, 0, 0])
            linear_extrude(mag_h + 0.1) magnets_3_linear(62.2);

        // Bottom Magnets (3)
        translate([0, mag_h, 36/2]) 
            rotate([90, 0, 0])
            linear_extrude(mag_h + 0.1) magnets_3_linear(62.2);
            
        // Left Magnets (3)
        translate([mag_h, 0, 36/2]) 
            rotate([0, -90, 0])
            linear_extrude(mag_h + 0.1) magnets_3_linear(62.2);
            
        // Right Magnets (3)
        translate([62.2, 0, 36/2]) 
            rotate([0, -90, 0])
            linear_extrude(mag_h + 0.1) magnets_3_linear(62.2);
    }
}

module back_plate() {
    difference() {
        translate([2, 2, 0]) minkowski() {
            cube([case_x-4, case_y-4, back_face_thickness-1]);
            cylinder(r=2, h=1);
        }
        
        // Magnets (5 Cross)
        translate([0, 0, back_face_thickness - mag_h])
            linear_extrude(mag_h + 0.1) magnets_5_cross();
            
        // Screw Holes (Corners)
        inset = 4;
        translate([inset, inset, -1]) cylinder(d=3.2, h=10);
        translate([62.2-inset, inset, -1]) cylinder(d=3.2, h=10);
        translate([inset, 62.2-inset, -1]) cylinder(d=3.2, h=10);
        translate([62.2-inset, 62.2-inset, -1]) cylinder(d=3.2, h=10);
    }
}

// Render Layout
translate([-35, 0, 0]) color("Silver") main_case();
translate([35, 0, 0]) color("DimGray") back_plate();
