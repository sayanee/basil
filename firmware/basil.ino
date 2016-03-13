#include "SparkFunMAX17043.h"

#define TEMPERATURE_PIN A0
#define WAKEUP_PIN WKP
#define DEBUG_PIN D2

int analog = 0;
double voltage = 0;
double soc = 0;
bool alert;

char analogStr[40];
char voltageStr[10];
char socStr[10];
char alertStr[10];

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
      publishData(5000);
      System.sleep(WAKEUP_PIN, RISING, 3600); // 1 hour
    } else if (digitalRead(DEBUG_PIN) == HIGH) {
      publishData(3000);
    }
  }
}

void publishData(int delayTime) {
  analog = analogRead(TEMPERATURE_PIN);
  sprintf(analogStr, "%d", analog);

  voltage = lipo.getVoltage();
  sprintf(voltageStr, "%f", voltage);

  soc = lipo.getSOC();
  sprintf(socStr, "%f", soc);

  alert = lipo.getAlert();
  sprintf(alertStr, "%d", alert);

  Particle.publish("temperature", analogStr);
  Particle.publish("voltage", voltageStr);
  Particle.publish("soc", socStr);
  Particle.publish("alert", alertStr);

  delay(delayTime);
}
