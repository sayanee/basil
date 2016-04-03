![](img/pic.jpg)

# Soil moisture sensor [[demo](http://basil.sayan.ee) and [api](http://basil.sayan.ee/api)]

> Monitoring soil moisture sensor of a basil plant to remind the owner to water it!

## Quick start

1. Wire up the [soil moisture sensor](http://www.seeedstudio.com/wiki/Grove_-_Moisture_Sensor) with [Particle Photon](https://store.particle.io/collections/photon) and flash it with the [firmware](firmware)
1. Install packages and set environment variables

  ```sh
  npm i
  cp .env.sample .env # set the device id and access token for the Particle Photon
  ```
- Start the web server `npm start`

  ![](img/web.png)

## Wiring

- Turn on DIP `Switch 1` to wakeup - for flashing firmware
- Turn on DIP `Switch 1` and `Switch 2` for debug mode - for getting analog value every 5 seconds (instead of every hour)

![](hardware/basil.jpg)

## Bill of Materials

<table>
  <tr>
    <th>Part</th>
    <th>Function</th>
    <th>Quantity</th>
    <th>Cost (USD)</th>
    <th>Buy</th>
  </tr>
  <tr>
    <td>Particle Photon</td>
    <td>Wifi + Microcontroller</td>
    <td>1</td>
    <td>19</td>
    <td><a href="https://store.particle.io/collections/photon">Particle.io</a></td>
  </tr>
  <tr>
    <td>SparkFun Photon battery shield</td>
    <td>fuel guage and Lithium polymer battery charger</td>
    <td>1</td>
    <td>12.95</td>
    <td><a href="https://www.sparkfun.com/products/13626">Sparkfun</a></td>
  </tr>
  <tr>
    <td>Lithium polymer battery 2000mAh with JST connector and protection circuit</td>
    <td>to power the circuit and Photon</td>
    <td>1</td>
    <td>12.50</td>
    <td><a href="https://www.adafruit.com/products/2011">Adafruit</a></td>
  </tr>
  <tr>
    <td>LM35 Temperature sensor</td>
    <td>Measure temperature</td>
    <td>1</td>
    <td>0.60</td>
    <td><a href="http://www.aliexpress.com/item/Free-Shipping-5pcs-LM35-LM35D-LM35DZ-TO-92-CENTIGRADE-TEMPERATURE-SENSOR-IC/900246222.html">Aliexpress</a></td>
  </tr>
  <tr>
    <td>Type 2 Row 4 pin DIP switch</td>
    <td>On-off wakeup and debug</td>
    <td>1</td>
    <td>0.15</td>
    <td><a href="http://www.aliexpress.com/item/10-Pcs-Slide-Type-2-Row-4-Pin-Terminals-2-Positions-PCB-DIP-Switch/2038402574.html">Aliexpress</a></td>
  </tr>
  <tr>
    <td></td>
    <td></td>
    <td>TOTAL</td>
    <td>USD $45.20</td>
    <td></td>
  </tr>
</table>



## Research

### Sensors

1. [SparkFun](https://www.sparkfun.com/products/13322)
- [Grove](http://www.seeedstudio.com/wiki/Grove_-_Moisture_Sensor)
- [Cheap soil moisture sensor](http://gardenbot.org/howTo/soilMoisture/)

### Similar projects

1. [Instructables](http://www.instructables.com/id/Soil-Moisture-Sensor/)
- [Hackster](https://www.hackster.io/search?q=soil+moisture)
- [House plant monitor](https://learn.sparkfun.com/tutorials/sparkfun-inventors-kit-for-photon-experiment-guide/experiment-3-houseplant-monitor)
