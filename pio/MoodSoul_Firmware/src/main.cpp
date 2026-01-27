#include <M5CoreS3.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <esp_camera.h>
#include <HTTPClient.h>
#include <Update.h>
#include <Preferences.h>

const char* SERVER_HOST = "moodsoul-platform.vercel.app";
const int SERVER_PORT = 443;
const char* SERVER_PATH = "/api/interact";
const char* UPDATE_URL = "https://moodsoul-platform.vercel.app/api/firmware";
String DEVICE_ID = "";
const char* CURRENT_VERSION = "1.1";

#define RECORD_TIME_SEC 3
#define SAMPLE_RATE 16000
#define AUDIO_BUF_SIZE (RECORD_TIME_SEC * SAMPLE_RATE * 2)
uint8_t* audioBuffer = nullptr;

const char* BINDING_CHECK_PATH = "/api/check_binding";
Preferences preferences;

void drawIcon(const char* label, uint16_t color, const char* iconType);
void showHotspotQR();
void showBindQR();

void checkBinding() {
    preferences.begin("moodsoul", false);
    bool isBound = preferences.getBool("is_bound", false);
    if (isBound) {
        drawIcon("Welcome Back", BLUE, "none");
        delay(1000);
        preferences.end();
        return;
    }
    DEVICE_ID = WiFi.macAddress();
    DEVICE_ID.replace(":", "");
    String bindUrl = "https://" + String(SERVER_HOST) + "/bind?deviceId=" + DEVICE_ID;
    showBindQR();
    HTTPClient http;
    while (!isBound) {
        String apiPath = String("https://") + SERVER_HOST + BINDING_CHECK_PATH + "?deviceId=" + DEVICE_ID;
        http.begin(apiPath);
        int code = http.GET();
        if (code == 200) {
            String res = http.getString();
            if (res.indexOf("\"bound\":true") >= 0) {
                isBound = true;
                preferences.putBool("is_bound", true);
                M5.Speaker.tone(1000, 200);
                delay(200);
                M5.Speaker.tone(2000, 400);
                M5.Lcd.fillScreen(BLACK);
                drawIcon("SOUL LINKED!", GREEN, "none");
                delay(2000);
            }
        }
        http.end();
        delay(2000);
        M5.update();
    }
    preferences.end();
}

void drawIcon(const char* label, uint16_t color, const char* iconType) {
    M5.Lcd.fillScreen(BLACK);
    M5.Lcd.setTextColor(color);
    M5.Lcd.setTextSize(2);
    M5.Lcd.setTextDatum(MC_DATUM);
    M5.Lcd.drawString(label, M5.Lcd.width() / 2, M5.Lcd.height() - 40);
    int cx = M5.Lcd.width() / 2;
    int cy = M5.Lcd.height() / 2 - 20;
    if (strcmp(iconType, "ear") == 0) {
        M5.Lcd.fillCircle(cx, cy, 40, color);
        M5.Lcd.fillCircle(cx, cy, 30, BLACK);
        M5.Lcd.fillCircle(cx - 10, cy, 10, color);
    } else if (strcmp(iconType, "load") == 0) {
        M5.Lcd.fillCircle(cx - 30, cy, 10, color);
        M5.Lcd.fillCircle(cx, cy, 10, color);
        M5.Lcd.fillCircle(cx + 30, cy, 10, color);
    } else if (strcmp(iconType, "mouth") == 0) {
        M5.Lcd.fillEllipse(cx, cy, 50, 10, color);
    } else if (strcmp(iconType, "dizzy") == 0) {
        M5.Lcd.drawCircle(cx - 30, cy, 20, color);
        M5.Lcd.drawCircle(cx - 30, cy, 10, color);
        M5.Lcd.drawCircle(cx + 30, cy, 20, color);
        M5.Lcd.drawCircle(cx + 30, cy, 10, color);
        M5.Lcd.fillRect(cx - 20, cy + 30, 40, 5, color);
    } else if (strcmp(iconType, "tired") == 0) {
        M5.Lcd.drawLine(cx - 50, cy - 10, cx - 10, cy, color);
        M5.Lcd.drawLine(cx + 10, cy, cx + 50, cy - 10, color);
        M5.Lcd.drawArc(cx, cy + 30, 20, 20, 180, 360, color);
    }
}

void showHotspotQR() {
    M5.Lcd.fillScreen(BLACK);
    M5.Lcd.setTextColor(YELLOW);
    M5.Lcd.setTextSize(2);
    M5.Lcd.setTextDatum(TC_DATUM);
    M5.Lcd.drawString("Join Hotspot", M5.Lcd.width() / 2, 5);
    M5.Lcd.qrcode("WIFI:S:MoodSoul_Setup;T:nopass;;", 50, 30, 220, 6);
    M5.Lcd.setTextColor(WHITE);
    M5.Lcd.setTextSize(1);
    M5.Lcd.setTextDatum(BC_DATUM);
    M5.Lcd.drawString("Open AP: MoodSoul_Setup (no password)", M5.Lcd.width() / 2, M5.Lcd.height() - 5);
}

void showBindQR() {
    String bindUrl = "https://" + String(SERVER_HOST) + "/bind?deviceId=" + DEVICE_ID;
    M5.Lcd.fillScreen(BLACK);
    M5.Lcd.setTextColor(CYAN);
    M5.Lcd.setTextSize(2);
    M5.Lcd.setTextDatum(TC_DATUM);
    M5.Lcd.drawString("Bind Account", M5.Lcd.width() / 2, 5);
    M5.Lcd.qrcode(bindUrl.c_str(), 50, 30, 220, 6);
    M5.Lcd.setTextColor(WHITE);
    M5.Lcd.setTextSize(1);
    M5.Lcd.setTextDatum(BC_DATUM);
    M5.Lcd.drawString("Scan to open H5 and complete binding", M5.Lcd.width() / 2, M5.Lcd.height() - 5);
}

void drawMouth(int volume) {
    int height = map(constrain(volume, 0, 100), 0, 100, 5, 60);
    int cx = M5.Lcd.width() / 2;
    int cy = M5.Lcd.height() / 2 - 20;
    M5.Lcd.fillRect(cx - 60, cy - 60, 120, 120, BLACK);
    M5.Lcd.fillEllipse(cx, cy, 50, height, GREEN);
    M5.Lcd.fillEllipse(cx, cy, 30, height / 2, BLACK);
}

void checkUpdate() {
    drawIcon("Check Update", YELLOW, "load");
    HTTPClient http;
    String url = String(UPDATE_URL) + "?current_version=" + String(CURRENT_VERSION);
    http.begin(url);
    int httpCode = http.GET();
    if (httpCode == 200) {
        int contentLength = http.getSize();
        if (contentLength > 0) {
            drawIcon("UPDATING...", MAGENTA, "load");
            bool canBegin = Update.begin(contentLength);
            if (canBegin) {
                WiFiClient* stream = http.getStreamPtr();
                size_t written = Update.writeStream(*stream);
                if (written == contentLength) {
                    if (Update.end()) {
                        if (Update.isFinished()) {
                            drawIcon("REBOOTING!", GREEN, "none");
                            delay(1000);
                            ESP.restart();
                        } else {
                            drawIcon("Upd Error", RED, "none");
                        }
                    } else {
                        drawIcon("Upd Fail", RED, "none");
                    }
                } else {
                    drawIcon("Wrt Fail", RED, "none");
                }
            }
        }
    } else if (httpCode == 304) {
        drawIcon("Up to Date", GREEN, "none");
        delay(1000);
    } else {
        drawIcon("Check Fail", RED, "none");
        delay(1000);
    }
    http.end();
}

void sendInteraction(camera_fb_t* fb, uint8_t* audioData, size_t audioLen, const char* trigger = "") {
    WiFiClient client;
    if (!client.connect(SERVER_HOST, SERVER_PORT)) {
        drawIcon("Conn Fail", RED, "none");
        delay(2000);
        return;
    }
    String boundary = "------------------------" + String(millis());
    String head = "--" + boundary + "\r\n";
    head += "Content-Disposition: form-data; name=\"deviceId\"\r\n\r\n";
    head += String(DEVICE_ID) + "\r\n";
    if (strlen(trigger) > 0) {
        head += "--" + boundary + "\r\n";
        head += "Content-Disposition: form-data; name=\"trigger\"\r\n\r\n";
        head += String(trigger) + "\r\n";
    }
    if (fb) {
        head += "--" + boundary + "\r\n";
        head += "Content-Disposition: form-data; name=\"image\"; filename=\"capture.jpg\"\r\n";
        head += "Content-Type: image/jpeg\r\n\r\n";
    }
    String mid = "";
    if (fb) mid = "\r\n--" + boundary + "\r\n";
    else mid = "--" + boundary + "\r\n";
    mid += "Content-Disposition: form-data; name=\"audio\"; filename=\"audio.pcm\"\r\n";
    mid += "Content-Type: application/octet-stream\r\n\r\n";
    String tail = "\r\n--" + boundary + "--\r\n";
    size_t fbLen = fb ? fb->len : 0;
    size_t totalLen = head.length() + fbLen + mid.length() + audioLen + tail.length();
    client.println("POST " + String(SERVER_PATH) + " HTTP/1.1");
    client.println("Host: " + String(SERVER_HOST));
    client.println("Content-Length: " + String(totalLen));
    client.println("Content-Type: multipart/form-data; boundary=" + boundary);
    client.println();
    client.print(head);
    if (fb) {
        uint8_t* fbBuf = fb->buf;
        size_t chunkSize = 1024;
        while (fbLen > 0) {
            size_t toWrite = (fbLen > chunkSize) ? chunkSize : fbLen;
            client.write(fbBuf, toWrite);
            fbBuf += toWrite;
            fbLen -= toWrite;
        }
    }
    client.print(mid);
    uint8_t* audBuf = audioData;
    size_t audLen = audioLen;
    size_t chunkSize = 1024;
    while (audLen > 0) {
        size_t toWrite = (audLen > chunkSize) ? chunkSize : audLen;
        client.write(audBuf, toWrite);
        audBuf += toWrite;
        audLen -= toWrite;
    }
    client.print(tail);
    unsigned long timeout = millis();
    while (client.connected()) {
        String line = client.readStringUntil('\n');
        if (line == "\r") break;
        if (millis() - timeout > 8000) {
            drawIcon("Timeout", RED, "none");
            client.stop();
            return;
        }
    }
    drawIcon("Speaking...", GREEN, "mouth");
    M5.Speaker.begin();
    M5.Speaker.setVolume(128);
    uint8_t playBuf[1024];
    while (client.connected() && client.available()) {
        int bytesRead = client.read(playBuf, sizeof(playBuf));
        if (bytesRead > 0) {
            long sum = 0;
            for (int i = 0; i < bytesRead; i++) sum += abs((int8_t)playBuf[i]);
            int avgVol = sum / bytesRead;
            drawMouth(avgVol * 2);
        }
    }
    client.stop();
}

void runFactoryTest() {
    M5.Lcd.fillScreen(BLACK);
    M5.Lcd.setTextColor(WHITE);
    M5.Lcd.setTextSize(2);
    M5.Lcd.setCursor(10, 10);
    M5.Lcd.println("FACTORY TEST MODE");
    delay(1000);
    M5.Lcd.fillScreen(RED);
    delay(500);
    M5.Lcd.fillScreen(GREEN);
    delay(500);
    M5.Lcd.fillScreen(BLUE);
    delay(500);
    M5.Lcd.fillScreen(BLACK);
    M5.Lcd.setCursor(10, 50);
    M5.Lcd.println("Audio Loopback...");
    M5.Mic.record(audioBuffer, AUDIO_BUF_SIZE, SAMPLE_RATE);
    while (M5.Mic.isRecording()) delay(10);
    M5.Speaker.begin();
    M5.Speaker.setVolume(128);
    M5.Speaker.tone(1000, 500);
    M5.Lcd.setCursor(10, 90);
    M5.Lcd.println("Camera Preview...");
    if (CoreS3.Camera.get()) {
        M5.Lcd.pushImage(0, 0, 320, 240, (uint16_t*)CoreS3.Camera.fb->buf);
        CoreS3.Camera.free();
        delay(2000);
    } else {
        M5.Lcd.println("CAM FAIL");
    }
    M5.Lcd.fillScreen(BLACK);
    M5.Lcd.setCursor(10, 10);
    M5.Lcd.println("WiFi Scan...");
    WiFi.mode(WIFI_STA);
    WiFi.disconnect();
    int n = WiFi.scanNetworks();
    M5.Lcd.printf("Found: %d\n", n);
    delay(2000);
    M5.Lcd.fillScreen(GREEN);
    M5.Lcd.setTextColor(BLACK);
    M5.Lcd.setTextSize(4);
    M5.Lcd.drawCenterString("PASS", 160, 100, 1);
    while (1);
}

void setup() {
    M5.begin();
    auto cfg = M5.config();
    CoreS3.begin(cfg);
    CoreS3.Camera.begin();
    if (M5.Touch.getCount() > 0) {
        unsigned long startHold = millis();
        while (M5.Touch.getCount() > 0) {
            if (millis() - startHold > 5000) {
                runFactoryTest();
            }
            delay(100);
            M5.update();
        }
    }
    M5.Mic.begin();
    audioBuffer = (uint8_t*)heap_caps_malloc(AUDIO_BUF_SIZE, MALLOC_CAP_SPIRAM);
    if (!audioBuffer) {
        drawIcon("Mem Fail", RED, "none");
        while (1);
    }
    showHotspotQR();
    WiFiManager wm;
    bool res = wm.autoConnect("MoodSoul_Setup");
    if (!res) {
        drawIcon("WiFi Fail", RED, "none");
    } else {
        drawIcon("Connected!", GREEN, "none");
        delay(1000);
    }
    checkUpdate();
    checkBinding();
    drawIcon("Touch Me", BLUE, "none");
}

void loop() {
    M5.update();
    int battery = M5.Power.getBatteryLevel();
    if (battery < 20) {
        drawIcon("LOW BATT", RED, "tired");
        delay(5000);
        return;
    }
    float accX, accY, accZ;
    M5.Imu.getAccelData(&accX, &accY, &accZ);
    static unsigned long lastAutoObserveTime = 0;
    static unsigned long vibrationStartTime = 0;
    static bool isVibrating = false;
    if (M5.Power.isCharging() && millis() - lastAutoObserveTime > 300000) {
        if (abs(accX) > 1.2 || abs(accY) > 1.2) {
            if (!isVibrating) {
                isVibrating = true;
                vibrationStartTime = millis();
            } else {
                if (millis() - vibrationStartTime > 2000) {
                    lastAutoObserveTime = millis();
                    isVibrating = false;
                    if (CoreS3.Camera.get()) {
                        memset(audioBuffer, 0, 1024);
                        sendInteraction(CoreS3.Camera.fb, audioBuffer, 1024, "AUTO_OBSERVE");
                        CoreS3.Camera.free();
                    }
                }
            }
        } else {
            isVibrating = false;
        }
    }
    static unsigned long lastShakeTime = 0;
    if (abs(accX) > 2.5 && millis() - lastShakeTime > 3000) {
        lastShakeTime = millis();
        drawIcon("DIZZY!", ORANGE, "dizzy");
        memset(audioBuffer, 0, 1024);
        sendInteraction(nullptr, audioBuffer, 1024, "SHAKE_EVENT");
        delay(2000);
        drawIcon("Touch Me", BLUE, "none");
    }
    static bool isUpsideDown = false;
    if (accZ < -0.9) {
        if (!isUpsideDown) {
            isUpsideDown = true;
            M5.Lcd.setRotation(3);
            memset(audioBuffer, 0, 1024);
            sendInteraction(nullptr, audioBuffer, 1024, "UPSIDE_DOWN");
        }
    } else if (accZ > 0.5) {
        if (isUpsideDown) {
            isUpsideDown = false;
            M5.Lcd.setRotation(1);
        }
    }
    if (M5.Touch.getCount() > 0) {
        auto detail = M5.Touch.getDetail(0);
        if (detail.wasPressed()) {
            M5.Speaker.tone(800, 50);
            M5.Lcd.drawCircle(detail.x, detail.y, 20, WHITE);
        }
        if (detail.wasReleased()) {
            drawIcon("Listening...", ORANGE, "ear");
            M5.Mic.record(audioBuffer, AUDIO_BUF_SIZE, SAMPLE_RATE);
            while (M5.Mic.isRecording()) delay(10);
            drawIcon("Thinking...", PURPLE, "load");
            if (CoreS3.Camera.get()) {
                sendInteraction(CoreS3.Camera.fb, audioBuffer, AUDIO_BUF_SIZE);
                CoreS3.Camera.free();
            } else {
                drawIcon("Cam Fail", RED, "none");
                delay(1000);
            }
            drawIcon("Touch Me", BLUE, "none");
        }
    }
}
