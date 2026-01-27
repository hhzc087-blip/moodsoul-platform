# MoodSoul Firmware Instructions (M5Stack CoreS3)

## 1. Feature: Shake to Punish (IMU Logic)
To implement the "Dizzy" effect when the user shakes the device:

**Dependencies:**
- `M5CoreS3.h` (Include IMU library)

**Code Snippet (Add to `loop()`):**
```cpp
float accX, accY, accZ;
M5.IMU.getAccelData(&accX, &accY, &accZ);

// Calculate total acceleration magnitude
float totalAcc = sqrt(accX * accX + accY * accY + accZ * accZ);

// Threshold for "Shake" (Adjust based on testing, usually > 2.5g)
if (totalAcc > 2.5) {
    // 1. Trigger UI
    showDizzyFace(); // Draw spiral eyes on screen
    
    // 2. Play Audio (Optional local file or TTS request)
    // For MVP, just show UI.
    
    // 3. Cool-down
    delay(2000); 
}
```

## 2. Feature: Orientation Awareness (Inverted)
To detect if the device is upside down:

**Code Snippet:**
```cpp
// Check if Y-acceleration is negative (gravity pulling "up" relative to screen)
if (accY < -0.8) {
   // Device is upside down
   M5.Lcd.setRotation(3); // Rotate screen 180 degrees (adjust index 1/3 based on start)
   // Or trigger "Don't pour my brain out!" TTS
} else {
   M5.Lcd.setRotation(1); // Normal rotation
}
```

## 3. Feature: Cyber Zen (Touch Interaction)
To implement the "Wooden Fish" tapping:

**Code Snippet:**
```cpp
// If current_app is WOODEN_FISH (You need to fetch this from API/Heartbeat)
if (M5.Touch.getCount() > 0) {
    auto detail = M5.Touch.getDetail(0);
    if (detail.state == touch_state_t::touch_begin) {
        // 1. Play Sound
        M5.Speaker.tone(800, 50); // "Ding" sound
        
        // 2. UI Feedback
        drawRipple(detail.x, detail.y);
        
        // 3. (Optional) Send "tap" count to server
    }
}
```

## 4. Feature: Toxic Pomodoro (Camera Loop)
If `current_app == POMODORO`:
- Instead of waiting for a button press, the device should automatically capture an image every 30-60 seconds.
- Send this image to `/api/interact` with a special flag or just rely on the server knowing the state.

**Logic:**
```cpp
static unsigned long lastCapture = 0;
if (currentMode == POMODORO && millis() - lastCapture > 30000) {
    captureAndSendImage();
    lastCapture = millis();
}
```
