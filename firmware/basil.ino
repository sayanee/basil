#include "SparkFunMAX17043.h"

#define MOISTURE_ANALOG_PIN A0
#define MOISTURE_VCC_PIN D4
#define WAKEUP_PIN WKP

int analog = 0;
double voltage = 0;
double soc = 0;
bool alert;

char analogStr[100];

void setup()
{
  lipo.begin();
  lipo.quickStart();
  lipo.setThreshold(10);

  pinMode(MOISTURE_VCC_PIN, OUTPUT);
  pinMode(MOISTURE_ANALOG_PIN, INPUT);
  pinMode(WAKEUP_PIN, INPUT_PULLDOWN);

  WiFi.on();
  Particle.connect();
}

void loop()
{
  if (Particle.connected()) {
    if (digitalRead(WAKEUP_PIN) == LOW) {
      publishData(5000, false);
      System.sleep(WAKEUP_PIN, RISING, 14395); // 14400 seconds (4 hours) - 5 seconds
    } else {
      publishData(10000, true);
    }
  }
}

void publishData(int delayTime, bool sampleMode) {
  int countAverageNum = 9;

  digitalWrite(MOISTURE_VCC_PIN, HIGH);
  analog = analogRead(MOISTURE_ANALOG_PIN);
  voltage = lipo.getVoltage();
  soc = lipo.getSOC();
  alert = lipo.getAlert();

  if (!sampleMode) {
    while (countAverageNum > 0) {
      analog += analogRead(MOISTURE_ANALOG_PIN);
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
  digitalWrite(MOISTURE_VCC_PIN, LOW);
}
