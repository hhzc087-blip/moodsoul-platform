#include <M5CoreS3.h>
#include <WiFi.h>
#include <esp_camera.h>

// ==========================================
// CONFIGURATION
// ==========================================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASS     = "YOUR_WIFI_PASS";
const char* SERVER_HOST   = "192.168.1.100"; // CHANGE THIS to your PC's IP
const int   SERVER_PORT   = 3000;
const char* SERVER_PATH   = "/api/interact";
const char* DEVICE_ID     = "device_001";

// Audio Settings
#define RECORD_TIME_SEC 3
#define SAMPLE_RATE     16000
#define AUDIO_BUF_SIZE  (RECORD_TIME_SEC * SAMPLE_RATE * 2) // 16-bit PCM
uint8_t* audioBuffer = nullptr;

// ==========================================
// UI HELPERS
// ==========================================
void drawStatus(const char* status, uint16_t color) {
    M5.Lcd.fillScreen(BLACK);
    M5.Lcd.setTextColor(color);
    M5.Lcd.setTextSize(3);
    M5.Lcd.setTextDatum(MC_DATUM);
    M5.Lcd.drawString(status, M5.Lcd.width() / 2, M5.Lcd.height() / 2);
}

// ==========================================
// NETWORK TASK
// ==========================================
// We use WiFiClient directly to stream the Multipart data to avoid OOM
void sendInteraction(camera_fb_t* fb, uint8_t* audioData, size_t audioLen) {
    WiFiClient client;
    
    if (!client.connect(SERVER_HOST, SERVER_PORT)) {
        drawStatus("Conn Fail", RED);
        delay(2000);
        return;
    }

    String boundary = "------------------------" + String(millis());
    
    // Prepare Headers
    String head = "--" + boundary + "\r\n";
    head += "Content-Disposition: form-data; name=\"deviceId\"\r\n\r\n";
    head += String(DEVICE_ID) + "\r\n";
    
    head += "--" + boundary + "\r\n";
    head += "Content-Disposition: form-data; name=\"image\"; filename=\"capture.jpg\"\r\n";
    head += "Content-Type: image/jpeg\r\n\r\n";
    
    String mid = "\r\n--" + boundary + "\r\n";
    mid += "Content-Disposition: form-data; name=\"audio\"; filename=\"audio.pcm\"\r\n";
    mid += "Content-Type: application/octet-stream\r\n\r\n";
    
    String tail = "\r\n--" + boundary + "--\r\n";
    
    size_t totalLen = head.length() + fb->len + mid.length() + audioLen + tail.length();

    // Send HTTP Request
    client.println("POST " + String(SERVER_PATH) + " HTTP/1.1");
    client.println("Host: " + String(SERVER_HOST));
    client.println("Content-Length: " + String(totalLen));
    client.println("Content-Type: multipart/form-data; boundary=" + boundary);
    client.println(); // End of headers

    // Send Body Parts
    client.print(head);
    
    // Send Image in chunks
    uint8_t* fbBuf = fb->buf;
    size_t fbLen = fb->len;
    size_t chunkSize = 1024;
    while (fbLen > 0) {
        size_t toWrite = (fbLen > chunkSize) ? chunkSize : fbLen;
        client.write(fbBuf, toWrite);
        fbBuf += toWrite;
        fbLen -= toWrite;
    }

    client.print(mid);

    // Send Audio in chunks
    uint8_t* audBuf = audioData;
    size_t audLen = audioLen;
    while (audLen > 0) {
        size_t toWrite = (audLen > chunkSize) ? chunkSize : audLen;
        client.write(audBuf, toWrite);
        audBuf += toWrite;
        audLen -= toWrite;
    }

    client.print(tail);

    // ==========================================
    // RECEIVE RESPONSE (Audio Stream)
    // ==========================================
    // Skip headers
    unsigned long timeout = millis();
    while (client.connected()) {
        String line = client.readStringUntil('\n');
        if (line == "\r") break; // End of headers
        if (millis() - timeout > 5000) {
            drawStatus("Timeout", RED);
            client.stop();
            return;
        }
    }

    // Read Body (Audio) and Play
    drawStatus("Speaking...", GREEN);
    
    // CoreS3 Speaker Init (if not already done in setup)
    M5.Speaker.begin();
    M5.Speaker.setVolume(128);

    // Stream playback buffer
    uint8_t playBuf[1024];
    while (client.connected() && client.available()) {
        int bytesRead = client.read(playBuf, sizeof(playBuf));
        if (bytesRead > 0) {
            // Play raw PCM or MP3 depending on what server sends.
            // Since server sends MP3, CoreS3 might need an MP3 decoder here.
            // For simplicity/robustness in this snippet, we assume raw PCM or 
            // use a dedicated library function if available. 
            // M5CoreS3 Speaker usually handles I2S. 
            // NOTE: Directly playing MP3 stream requires a decoder (like libhelix).
            // For this prototype, we'll just dump it to speaker (which will sound like noise if MP3)
            // OR ideally, use M5.Speaker.playMp3(playBuf, bytesRead); if available.
            // We will stick to standard write for now.
            M5.Speaker.tone(1000, 10); // Placeholder feedback
        }
    }

    client.stop();
}

void setup() {
    M5.begin();
    
    // Allocate Audio Buffer (PSRAM usually available on CoreS3)
    audioBuffer = (uint8_t*)heap_caps_malloc(AUDIO_BUF_SIZE, MALLOC_CAP_SPIRAM);
    if (!audioBuffer) {
        drawStatus("Mem Fail", RED);
        while(1);
    }

    // Init Camera (CoreS3 internal)
    // CoreS3 camera init is handled by M5.begin() or requires specific call depending on lib version
    // M5.Camera.begin(); 
    
    // Init Mic
    M5.Mic.begin();

    // WiFi
    drawStatus("WiFi...", YELLOW);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
    }

    drawStatus("Ready", BLUE);
}

void loop() {
    M5.update();

    // Simple Trigger: Touch
    if (M5.Touch.getCount() > 0 && M5.Touch.getDetail(0).wasPressed()) {
        
        // 1. Record
        drawStatus("Listening...", ORANGE);
        M5.Mic.record(audioBuffer, AUDIO_BUF_SIZE, SAMPLE_RATE);
        while (M5.Mic.isRecording()) {
            delay(10); // Wait for record to finish
        }

        // 2. Capture
        drawStatus("Thinking...", PURPLE);
        if (M5.Camera.get()) {
             // 3. Send
             sendInteraction(M5.Camera.fb, audioBuffer, AUDIO_BUF_SIZE);
             M5.Camera.free();
        } else {
             drawStatus("Cam Fail", RED);
             delay(1000);
        }

        drawStatus("Ready", BLUE);
    }
}
