#include "SparkFunMAX17043.h"

#define TEMPERATURE_PIN A0
#define WAKEUP_PIN WKP
#define DEBUG_PIN D2

int analog = 0;
double voltage = 0;
double soc = 0;
bool alert;

char analogStr[100];

void setup()
{
  lipo.begin();
  lipo.quickStart();
  lipo.setThreshold(20);

  pinMode(TEMPERATURE_PIN, INPUT);
  pinMode(DEBUG_PIN, INPUT_PULLDOWN);
  pinMode(WAKEUP_PIN, INPUT_PULLDOWN);

  WiFi.on();
  Particle.connect();
}

void loop()
{
  if (Particle.connected()) {
    if (digitalRead(WAKEUP_PIN) == LOW) {
      publishData(5000, false);
      System.sleep(WAKEUP_PIN, RISING, 3595); // 1 hour - 5 seconds
    } else if (digitalRead(DEBUG_PIN) == HIGH) {
      publishData(10000, true);
    }
  }
}

void publishData(int delayTime, bool debugMode) {
  int countAverageNum = 9;

  analog = analogRead(TEMPERATURE_PIN);
  voltage = lipo.getVoltage();
  soc = lipo.getSOC();
  alert = lipo.getAlert();

  if (!debugMode) {
    while (countAverageNum > 0) {
      analog += analogRead(TEMPERATURE_PIN);
      countAverageNum = countAverageNum - 1;
      delay(10);
    }

    analog = analog / 10;

    sprintf(analogStr, "{\"temperature\": %d,\"voltage\":%f,\"soc\":%f,\"alert\":%d}", analog, voltage, soc, alert);
  } else {
    sprintf(analogStr, "{\"temperature\": %d,\"voltage\":%f,\"soc\":%f,\"alert\":%d,\"sample\":true}", analog, voltage, soc, alert);
  }

  Particle.publish("basil", analogStr);
  delay(delayTime);
}
