#include "lib.h"

int analogvalue = 0;

void setup()
{
  pinMode(D7, OUTPUT);
  if (Particle.variable("moisture", analogvalue) == false) {
    digitalWrite(D7, HIGH);
  }

  pinMode(A0, INPUT);
}

void loop()
{
  analogvalue = analogRead(A0);
  delay(200);
}
