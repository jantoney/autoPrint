# My Note Printer

I was doom scrolling on YouTube one day, and there was a video about 'Fixing your life with a receipt printer'... or something to that effect.
I've been mulling it over, and had a spare receipt printer lying around, so I thought, why not?

This app is simple. Really simple.
You type in a note, and it gets printed on a receipt printer.
My receipt printer has a automatic cutter on it (most do these days).
Then I stick it into a docker holder you find in a commercial kitchen.

A receipt printer is cheap from ebay/alliexpress/etc.
Docker holders are dime and a dozen from Amazon/Aliexpress/etc.

It works well - let me know if you have any issues.


## Supported Printers

In reality, any printer will work because the application sends print jobs in a standard format that most printers can understand.
However this was built for a receipt printer with a paper width of 80mm.

## My learnings with cheap printers

The random printer I had lying around was a no-name brand model `WG-8200`.
It has Serial, USB, and Ethernet connectivity options and was resold as under the `Dailypos` brand in Australia.
If you turn the unit off, press the `Feed` button, turn it on and continue to press for a good 20-30 seconds, it will eventually print out a `Selftest` page.
This will have the IP address and supported features listed on it.

Logging onto the website (ip address) of the printer, it had this printed at the bottom of the page:
`Copyright © Lee 2006-2018 J-Speed All rights reserved.`

This was my only clue to the printer's origins and a potential driver.
Turns out that `J-Speed` is just an OEM manufacturer that rebrands printers for other companies.

The TL/DR of this is that if you have a cheap printer lying around, then the [Bill product driver](https://www.xprintertech.com/drivers-2.html) from `Xprinter` will most likely work.
It sounds like the printer just has to have `ESC/POS` compatibility. Which mine had also printed on the bottom on the device model number sticker.