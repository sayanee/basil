#include "SparkFunMAX17043.h"

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

  pinMode(A0, INPUT);
  pinMode(WKP, INPUT_PULLDOWN);

  WiFi.on();
  Particle.connect();
}

void loop()
{
  if (digitalRead(WKP) == LOW && Particle.connected()){
    analog = analogRead(A0);
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

    delay(5000);

    System.sleep(WKP, RISING, 20);
  }
}
